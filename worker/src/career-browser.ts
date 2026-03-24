import type { Page } from "playwright";
import { getBrowser, applyToJob, type ApplyResult } from "./apply-engine";

export interface DiscoveredJob {
  title: string;
  applyUrl: string;
}

export interface DiscoveryLog {
  steps: string[];
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
  const b = await getBrowser();
  const context = await b.newContext();
  const page = await context.newPage();

  try {
    // Try URL-based search first
    const searchUrl = appendSearchParam(careersUrl, targetRole);
    log.steps.push(`Original URL: ${careersUrl}`);
    log.steps.push(`Search URL: ${searchUrl}`);
    log.steps.push(searchUrl !== careersUrl ? "Added search param to URL" : "No search param added — will try search input");

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);

    const pageTitle = await page.title();
    const currentUrl = page.url();
    log.steps.push(`Page loaded — title: "${pageTitle}"`);
    log.steps.push(`Final URL after load: ${currentUrl}`);

    // If URL didn't have a search param, try finding a search input
    if (searchUrl === careersUrl) {
      const searchFound = await trySearchInput(page, targetRole, log);
      if (!searchFound) {
        log.steps.push("No search input found — will scan all visible links");
      }
    }

    // Count total links on page for debugging
    const totalLinks = await page.evaluate(() =>
      document.querySelectorAll("a[href]").length
    );
    log.steps.push(`Total links on page: ${totalLinks}`);

    // Extract job listings from the page
    const { jobs, allCandidates } = await extractJobListings(page, targetRole);
    log.steps.push(`Links with text 5-200 chars: ${allCandidates}`);
    log.steps.push(`Jobs matching "${targetRole}": ${jobs.length}`);

    // Log some sample link texts for debugging
    const sampleTexts = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href]"));
      return links
        .map((l) => (l.textContent || "").trim().replace(/\s+/g, " "))
        .filter((t) => t.length >= 5 && t.length <= 200)
        .slice(0, 15);
    });
    log.steps.push(`Sample link texts: ${JSON.stringify(sampleTexts)}`);

    // Try one page of pagination
    if (jobs.length > 0) {
      const { jobs: moreJobs } = await extractJobListings(page, targetRole);
      const beforePagination = jobs.length;
      // Try next page
      const paginationJobs = await tryNextPage(page, targetRole, log);
      jobs.push(...paginationJobs);
      if (paginationJobs.length > 0) {
        log.steps.push(`Pagination added ${paginationJobs.length} more jobs`);
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const deduped = jobs.filter((j) => {
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
 * Finds links that look like job postings and match the target role.
 */
async function extractJobListings(
  page: Page,
  targetRole: string
): Promise<{ jobs: DiscoveredJob[]; allCandidates: number }> {
  const result = await page.evaluate((role: string) => {
    const roleWords = role
      .toLowerCase()
      .split(/[\s\-\/,]+/)
      .filter((w) => w.length > 1);
    const fillers = new Set([
      "senior", "junior", "staff", "principal", "lead", "sr", "jr",
      "ii", "iii", "iv", "the", "and", "or", "a", "an", "of", "for",
    ]);
    const coreWords = roleWords.filter((w) => !fillers.has(w));
    const matched: { title: string; applyUrl: string }[] = [];
    let candidateCount = 0;

    const links = Array.from(document.querySelectorAll("a[href]"));
    for (const link of links) {
      const text = (link.textContent || "").trim().replace(/\s+/g, " ");
      const href = (link as HTMLAnchorElement).href;

      if (text.length < 5 || text.length > 200) continue;
      if (!href || href === "#" || href.startsWith("javascript:")) continue;
      if (href === window.location.href) continue;

      candidateCount++;
      const lowerText = text.toLowerCase();

      const matchCount = coreWords.filter(
        (w) => lowerText.includes(w)
      ).length;

      if (matchCount >= coreWords.length) {
        matched.push({ title: text, applyUrl: href });
      }
    }

    return { matched, candidateCount, coreWords };
  }, targetRole);

  return { jobs: result.matched, allCandidates: result.candidateCount };
}

/**
 * Try clicking a "Next" or "Load More" button and extracting more jobs.
 */
async function tryNextPage(
  page: Page,
  targetRole: string,
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
        const { jobs } = await extractJobListings(page, targetRole);
        return jobs;
      }
    } catch {}
  }

  return [];
}

// Re-export for use in browse-loop
export { applyToJob, type ApplyResult };
