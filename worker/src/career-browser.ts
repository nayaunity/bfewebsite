import type { Page } from "playwright";
import { getBrowser, applyToJob, type ApplyResult } from "./apply-engine";

export interface DiscoveredJob {
  title: string;
  applyUrl: string;
}

/**
 * Search for the target role on a career page.
 * Tries URL params, search inputs, and fallback scan.
 */
export async function discoverJobs(
  careersUrl: string,
  targetRole: string
): Promise<DiscoveredJob[]> {
  const b = await getBrowser();
  const context = await b.newContext();
  const page = await context.newPage();

  try {
    // Try URL-based search first
    const searchUrl = appendSearchParam(careersUrl, targetRole);
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);

    // If URL didn't have a search param, try finding a search input
    if (searchUrl === careersUrl) {
      await trySearchInput(page, targetRole);
    }

    // Extract job listings from the page
    const jobs = await extractJobListings(page, targetRole);

    // Try one page of pagination
    if (jobs.length > 0) {
      const moreJobs = await tryNextPage(page, targetRole);
      jobs.push(...moreJobs);
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    return jobs.filter((j) => {
      if (seen.has(j.applyUrl)) return false;
      seen.add(j.applyUrl);
      return true;
    });
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

  // Try adding ?q= for URLs that don't already have search params related to search
  // Only add if the URL looks like a job search page
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
async function trySearchInput(page: Page, query: string): Promise<boolean> {
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
        await el.fill(query);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(3000);
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
): Promise<DiscoveredJob[]> {
  return page.evaluate((role: string) => {
    const roleWords = role
      .toLowerCase()
      .split(/[\s\-\/,]+/)
      .filter((w) => w.length > 1);
    const fillers = new Set([
      "senior", "junior", "staff", "principal", "lead", "sr", "jr",
      "ii", "iii", "iv", "the", "and", "or", "a", "an", "of", "for",
    ]);
    const coreWords = roleWords.filter((w) => !fillers.has(w));
    const results: { title: string; applyUrl: string }[] = [];

    const links = Array.from(document.querySelectorAll("a[href]"));
    for (const link of links) {
      const text = (link.textContent || "").trim().replace(/\s+/g, " ");
      const href = (link as HTMLAnchorElement).href;

      // Skip very short/long text, nav links, anchors
      if (text.length < 5 || text.length > 200) continue;
      if (!href || href === "#" || href.startsWith("javascript:")) continue;
      if (href === window.location.href) continue;

      const lowerText = text.toLowerCase();

      // Check if all core role words appear in the link text
      const matchCount = coreWords.filter(
        (w) => lowerText.includes(w)
      ).length;

      if (matchCount >= coreWords.length) {
        results.push({ title: text, applyUrl: href });
      }
    }

    return results;
  }, targetRole);
}

/**
 * Try clicking a "Next" or "Load More" button and extracting more jobs.
 */
async function tryNextPage(
  page: Page,
  targetRole: string
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
        await el.click();
        await page.waitForTimeout(3000);
        return extractJobListings(page, targetRole);
      }
    } catch {}
  }

  return [];
}

// Re-export for use in browse-loop
export { applyToJob, type ApplyResult };
