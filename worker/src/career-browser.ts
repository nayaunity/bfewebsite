import type { Page } from "playwright";
import Anthropic from "@anthropic-ai/sdk";
import { createStealthContext, applyToJob, type ApplyResult } from "./apply-engine";

const anthropic = new Anthropic();

export interface DiscoveredJob {
  title: string;
  applyUrl: string;
}

export interface DiscoveryLog {
  steps: string[];
}

/**
 * Parse target role input into individual roles.
 */
function parseRoles(targetRole: string): string[] {
  return targetRole
    .split(/[,;]+/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
}

/**
 * Search for the target role on a career page using Claude for intelligent matching.
 */
export async function discoverJobs(
  careersUrl: string,
  targetRole: string
): Promise<{ jobs: DiscoveredJob[]; log: DiscoveryLog }> {
  const log: DiscoveryLog = { steps: [] };
  const roles = parseRoles(targetRole);
  log.steps.push(`Parsed roles: ${JSON.stringify(roles)}`);

  const context = await createStealthContext();
  const page = await context.newPage();
  const allJobs: DiscoveredJob[] = [];

  try {
    // Use first role for the search query (simpler, avoids comma issues)
    const searchTerm = roles[0];
    const searchUrl = appendSearchParam(careersUrl, searchTerm);
    log.steps.push(`Search URL: ${searchUrl}`);

    await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {
      // networkidle can timeout on heavy SPAs — fall back to what we have
      log.steps.push("networkidle timed out — proceeding with current page state");
    });
    await page.waitForTimeout(3000);

    // Check for Cloudflare challenge
    let pageTitle = await page.title();
    if (pageTitle.includes("Just a moment") || pageTitle.includes("Attention Required")) {
      log.steps.push("Cloudflare challenge detected — waiting 10s...");
      await page.waitForTimeout(10000);
      pageTitle = await page.title();
      if (pageTitle.includes("Just a moment") || pageTitle.includes("Attention Required")) {
        log.steps.push("Cloudflare still blocking — skipping");
        return { jobs: [], log };
      }
      log.steps.push(`Cloudflare passed! Title: "${pageTitle}"`);
    } else {
      log.steps.push(`Page loaded — title: "${pageTitle}"`);
    }

    // If URL didn't change (no search param added), try a search input
    if (searchUrl === careersUrl) {
      const searchFound = await trySearchInput(page, searchTerm, log);
      if (!searchFound) {
        log.steps.push("No search input found — scanning all links");
      }
    }

    // Extract ALL links from the page (no filtering — let Claude decide)
    const pageLinks = await extractAllLinks(page);
    log.steps.push(`Total links extracted: ${pageLinks.length}`);

    if (pageLinks.length === 0) {
      log.steps.push("No links found on page");
      return { jobs: [], log };
    }

    // Send to Claude for intelligent matching — batch if too many links
    log.steps.push(`Sending ${pageLinks.length} links to Claude for matching...`);
    const BATCH_SIZE = 100;
    const matched: DiscoveredJob[] = [];
    for (let i = 0; i < pageLinks.length; i += BATCH_SIZE) {
      const batch = pageLinks.slice(i, i + BATCH_SIZE);
      if (i > 0) log.steps.push(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
      const batchMatched = await matchJobsWithClaude(batch, roles, log);
      matched.push(...batchMatched);
    }
    allJobs.push(...matched);

    log.steps.push(`Claude identified ${matched.length} matching jobs`);
    if (matched.length > 0) {
      log.steps.push(`Matched: ${matched.map((j) => j.title).join(" | ")}`);
    }

    // Try pagination for more results
    const paginationJobs = await tryNextPage(page, roles, log);
    if (paginationJobs.length > 0) {
      log.steps.push(`Pagination found ${paginationJobs.length} more jobs`);
      allJobs.push(...paginationJobs);
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const deduped = allJobs.filter((j) => {
      if (seen.has(j.applyUrl)) return false;
      seen.add(j.applyUrl);
      return true;
    });

    // Filter to only Greenhouse job URLs (we only support Greenhouse forms)
    const greenhouse = deduped.filter((j) => {
      const url = j.applyUrl.toLowerCase();
      return url.includes("greenhouse.io/") && url.includes("/jobs/");
    });

    if (greenhouse.length < deduped.length) {
      log.steps.push(`Filtered ${deduped.length - greenhouse.length} non-Greenhouse URLs`);
    }

    log.steps.push(`After dedup: ${greenhouse.length} unique jobs`);
    return { jobs: greenhouse, log };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.steps.push(`ERROR: ${msg}`);
    return { jobs: [], log };
  } finally {
    await context.close();
  }
}

/**
 * Extract all links from the page as raw text + URL pairs.
 */
async function extractAllLinks(page: Page): Promise<Array<{ text: string; url: string }>> {
  return page.evaluate(() => {
    const results: Array<{ text: string; url: string }> = [];
    const links = Array.from(document.querySelectorAll("a[href]"));

    for (const link of links) {
      const text = (link.textContent || "").trim().replace(/\s+/g, " ");
      const url = (link as HTMLAnchorElement).href;

      // Basic filtering — skip empty, anchors, javascript
      if (text.length < 3) continue;
      if (!url || url === "#" || url.startsWith("javascript:")) continue;
      if (url === window.location.href) continue;

      results.push({ text: text.slice(0, 300), url });
    }

    return results;
  });
}

/**
 * Use Claude to intelligently identify which links are job listings matching the target roles.
 */
async function matchJobsWithClaude(
  links: Array<{ text: string; url: string }>,
  roles: string[],
  log: DiscoveryLog
): Promise<DiscoveredJob[]> {
  // Format links for the prompt
  const linksText = links
    .map((l, i) => `[${i}] "${l.text}" → ${l.url}`)
    .join("\n");

  const prompt = `You are analyzing links from a company career page. Identify which ones are actual job listings relevant to these target roles: ${roles.join(", ")}.

Rules:
- Only include actual job postings (not navigation, footer, language, or category links)
- STRONGLY prefer links with URLs containing "greenhouse.io" — these are the ones we can apply to
- Match broadly: "Software Engineer" should match "Senior Software Engineer", "Staff Engineer", "ML Engineer", etc.
- Match related roles: "AI Engineer" should match "Machine Learning Engineer", "ML Infrastructure Engineer", etc.
- Extract a CLEAN job title (just the role name, no location/metadata)
- Include the exact URL from the link
- Return at most 15 of the MOST relevant matches. Prefer exact role matches over loose matches.
- Keep JSON compact: short titles, no extra whitespace

Links found on page:
${linksText}

Return ONLY a JSON array. No other text. Example format:
[{"title": "Senior Software Engineer", "applyUrl": "https://..."}]

If no matching jobs found, return: []`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    log.steps.push(`Claude response (${response.usage.input_tokens} in, ${response.usage.output_tokens} out)`);

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      log.steps.push("Claude returned no JSON array");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{ title: string; applyUrl: string }>;
    return parsed.filter((j) => j.title && j.applyUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.steps.push(`Claude API error: ${msg}`);
    return [];
  }
}

/**
 * Append a search query param to the career page URL.
 */
function appendSearchParam(url: string, query: string): string {
  const searchParams = ["q", "search", "keywords", "query", "keyword"];
  const parsed = new URL(url);

  for (const param of searchParams) {
    if (parsed.searchParams.has(param)) {
      parsed.searchParams.set(param, query);
      return parsed.toString();
    }
  }

  if (
    url.includes("/search") ||
    url.includes("/jobs") ||
    url.includes("/positions") ||
    url.includes("/careers")
  ) {
    parsed.searchParams.set("q", query);
    return parsed.toString();
  }

  return url;
}

/**
 * Try to find and use a search input on the page.
 */
async function trySearchInput(page: Page, query: string, log: DiscoveryLog): Promise<boolean> {
  const selectors = [
    'input[type="search"]',
    'input[placeholder*="Search" i]',
    'input[placeholder*="keyword" i]',
    'input[placeholder*="job title" i]',
    'input[placeholder*="role" i]',
    'input[aria-label*="search" i]',
    'input[name*="search" i]',
    'input[name*="keyword" i]',
    '[data-testid*="search"] input',
    "#search-input",
  ];

  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible().catch(() => false)) {
        log.steps.push(`Found search input: ${selector}`);
        await el.fill(query);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(3000);
        log.steps.push(`Searched for "${query}"`);
        return true;
      }
    } catch {}
  }

  return false;
}

/**
 * Try clicking pagination and extracting more jobs.
 */
async function tryNextPage(
  page: Page,
  roles: string[],
  log: DiscoveryLog
): Promise<DiscoveredJob[]> {
  const paginationSelectors = [
    'button:has-text("Load More")',
    'button:has-text("Show More")',
    'a:has-text("Next")',
    'button:has-text("Next")',
    '[aria-label="Next page"]',
    ".pagination-next",
  ];

  for (const selector of paginationSelectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible().catch(() => false)) {
        log.steps.push(`Found pagination: ${selector}`);
        await el.click();
        await page.waitForTimeout(3000);
        const links = await extractAllLinks(page);
        return matchJobsWithClaude(links, roles, log);
      }
    } catch {}
  }

  return [];
}

// Re-export for use in browse-loop
export { applyToJob, type ApplyResult };
