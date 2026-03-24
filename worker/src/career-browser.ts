import type { Page } from "playwright";
import { createStealthContext, applyToJob, type ApplyResult } from "./apply-engine";

export interface DiscoveredJob {
  title: string;
  applyUrl: string;
}

export interface DiscoveryLog {
  steps: string[];
}

/**
 * Parse target role input into individual roles.
 * "AI Engineer, Software Engineer" → ["AI Engineer", "Software Engineer"]
 */
function parseRoles(targetRole: string): string[] {
  return targetRole
    .split(/[,;]+/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
}

/**
 * Get a simple search term from the target roles for URL/input search.
 * Uses the first role, simplified (e.g. "AI Engineer" → "engineer").
 */
function getSearchTerms(roles: string[]): string[] {
  // Return each role as a separate search term
  return roles.map((r) => r.trim());
}

/**
 * Search for the target role on a career page.
 * Tries URL params, search inputs, and fallback scan.
 * Returns discovered jobs AND a detailed log of what happened.
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
    // Search with each role separately, collect all results
    const searchTerms = getSearchTerms(roles);

    for (const term of searchTerms) {
      log.steps.push(`--- Searching for: "${term}" ---`);

      const searchUrl = appendSearchParam(careersUrl, term);
      log.steps.push(`Search URL: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(3000);

      // Check for Cloudflare challenge — if detected, wait longer
      let pageTitle = await page.title();
      if (pageTitle.includes("Just a moment") || pageTitle.includes("Attention Required")) {
        log.steps.push(`Cloudflare challenge detected — waiting 10s for it to resolve...`);
        await page.waitForTimeout(10000);
        pageTitle = await page.title();
        if (pageTitle.includes("Just a moment") || pageTitle.includes("Attention Required")) {
          log.steps.push(`Cloudflare still blocking after wait — skipping this search term`);
          continue;
        }
        log.steps.push(`Cloudflare challenge passed! Title now: "${pageTitle}"`);
      } else {
        log.steps.push(`Page loaded — title: "${pageTitle}"`);
      }

      // If URL didn't have a search param, try finding a search input
      if (searchUrl === careersUrl) {
        const searchFound = await trySearchInput(page, term, log);
        if (!searchFound) {
          log.steps.push("No search input found — will scan all visible links");
        }
      }

      // Count total links on page
      const totalLinks = await page.evaluate(() =>
        document.querySelectorAll("a[href]").length
      );
      log.steps.push(`Total links on page: ${totalLinks}`);

      // Extract job listings — match against ALL roles, not just the search term
      const { jobs, allCandidates } = await extractJobListings(page, roles);
      log.steps.push(`Links with text 5-200 chars: ${allCandidates}`);
      log.steps.push(`Jobs matching roles: ${jobs.length}`);

      // Log sample link texts
      const sampleTexts = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a[href]"));
        return links
          .map((l) => (l.textContent || "").trim().replace(/\s+/g, " "))
          .filter((t) => t.length >= 5 && t.length <= 200)
          .slice(0, 15);
      });
      log.steps.push(`Sample link texts: ${JSON.stringify(sampleTexts)}`);

      allJobs.push(...jobs);

      // Try pagination
      const paginationJobs = await tryNextPage(page, roles, log);
      if (paginationJobs.length > 0) {
        log.steps.push(`Pagination added ${paginationJobs.length} more jobs`);
        allJobs.push(...paginationJobs);
      }

      // Only search once if the URL already had no search capability
      // (avoids re-loading the same page with different terms)
      if (searchUrl === careersUrl) break;
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const deduped = allJobs.filter((j) => {
      if (seen.has(j.applyUrl)) return false;
      seen.add(j.applyUrl);
      return true;
    });

    log.steps.push(`After dedup: ${deduped.length} unique jobs`);

    if (deduped.length > 0) {
      log.steps.push(`Matched jobs: ${deduped.map((j) => j.title).join(" | ")}`);
    }

    return { jobs: deduped, log };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.steps.push(`ERROR: ${msg}`);
    return { jobs: [], log };
  } finally {
    await context.close();
  }
}

/**
 * Append a search query param to the career page URL.
 */
function appendSearchParam(url: string, query: string): string {
  const searchParams = ["q", "search", "keywords", "query", "keyword"];
  const parsed = new URL(url);

  // Check if any search param already exists
  for (const param of searchParams) {
    if (parsed.searchParams.has(param)) {
      parsed.searchParams.set(param, query);
      return parsed.toString();
    }
  }

  // Try adding ?q= for URLs that look like job search pages
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
        log.steps.push(`Typed "${query}" and pressed Enter, waited 3s`);
        return true;
      }
    } catch {}
  }

  return false;
}

/**
 * Extract job listings from the current page.
 * Matches against multiple roles — a link matches if ANY role is relevant.
 * A role is relevant if at least half of its core words appear, OR if the
 * strongest keyword (like "engineer", "scientist") appears.
 */
async function extractJobListings(
  page: Page,
  roles: string[]
): Promise<{ jobs: DiscoveredJob[]; allCandidates: number }> {
  const result = await page.evaluate((rolesJson: string) => {
    const roles: string[] = JSON.parse(rolesJson);
    const fillers = new Set([
      "senior", "junior", "staff", "principal", "lead", "sr", "jr",
      "ii", "iii", "iv", "the", "and", "or", "a", "an", "of", "for",
      "intern", "internship",
    ]);

    // Build match data for each role
    const roleMatchers = roles.map((role) => {
      const words = role
        .toLowerCase()
        .split(/[\s\-\/,]+/)
        .filter((w) => w.length > 1); // Min 2 chars — whole-word regex handles false positives
      const coreWords = words.filter((w) => !fillers.has(w));
      return { role, coreWords };
    });

    // Check if a word appears as a whole word (not inside another word)
    function hasWholeWord(text: string, word: string): boolean {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      return regex.test(text);
    }

    // URL patterns that indicate job listing pages
    const jobUrlPatterns = [
      "/positions/", "/jobs/", "/job/", "/careers/", "/openings/",
      "/apply/", "/requisition/", "/posting/", "/role/", "/opportunity/",
      "lever.co/", "greenhouse.io/", "workday.com/",
      "jobId=", "job_id=", "requisitionId=",
    ];

    function looksLikeJobUrl(href: string): boolean {
      const lower = href.toLowerCase();
      return jobUrlPatterns.some((p) => lower.includes(p));
    }

    const matched: { title: string; applyUrl: string }[] = [];
    let candidateCount = 0;

    const links = Array.from(document.querySelectorAll("a[href]"));
    for (const link of links) {
      const rawText = (link.textContent || "").trim().replace(/\s+/g, " ");
      const href = (link as HTMLAnchorElement).href;

      if (rawText.length < 5) continue;
      if (!href || href === "#" || href.startsWith("javascript:")) continue;
      if (href === window.location.href) continue;

      // Only consider links with job-like URLs OR on a known career page
      const isOnCareerPage = window.location.hostname.includes("career") ||
        window.location.pathname.includes("/jobs") ||
        window.location.pathname.includes("/positions") ||
        window.location.pathname.includes("/openings");
      if (!looksLikeJobUrl(href) && !isOnCareerPage) continue;

      // For long texts (SPA pages like Meta), extract just the job title portion
      let text = rawText;
      if (rawText.length > 120) {
        // Try to find where the title ends and metadata begins
        const cutPatterns = [
          /[A-Z][a-z]+,\s*[A-Z]{2}\b/,  // "Menlo Park, CA"
          /⋅/,                              // Meta separator
          /Multiple Locations/,
          /Posted \d/,
          /Remote/,
          /United States/,
          /\d+ locations/,
          /Singapore|London|Toronto|New York, NY|Sunnyvale|Redmond/,
        ];
        let cutIndex = rawText.length;
        for (const pattern of cutPatterns) {
          const match = rawText.search(pattern);
          if (match > 10 && match < cutIndex) cutIndex = match;
        }
        text = rawText.slice(0, cutIndex).trim();
      }
      if (text.length < 5) continue;

      candidateCount++;
      const lowerText = text.toLowerCase();

      // Check if this link matches ANY role using whole-word matching
      let isMatch = false;
      for (const { coreWords } of roleMatchers) {
        if (coreWords.length === 0) continue;

        const matchCount = coreWords.filter((w) => hasWholeWord(lowerText, w)).length;

        // Match if at least half of core words match, minimum 2 matches when possible
        const threshold = coreWords.length <= 2 ? coreWords.length : Math.ceil(coreWords.length / 2);
        if (matchCount >= threshold) {
          isMatch = true;
          break;
        }
      }

      if (isMatch) {
        // Use the cleaned title, not the raw long text
        matched.push({ title: text, applyUrl: href });
      }
    }

    return { matched, candidateCount };
  }, JSON.stringify(roles));

  return { jobs: result.matched, allCandidates: result.candidateCount };
}

/**
 * Try clicking a "Next" or "Load More" button and extracting more jobs.
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
        log.steps.push(`Found pagination: ${selector} — clicking`);
        await el.click();
        await page.waitForTimeout(3000);
        const { jobs } = await extractJobListings(page, roles);
        return jobs;
      }
    } catch {}
  }

  return [];
}

// Re-export for use in browse-loop
export { applyToJob, type ApplyResult };
