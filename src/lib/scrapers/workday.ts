import type { DEICompany, WorkdayConfig, ScrapedJob, ScraperResult } from "./types";
import {
  isTechRole,
  categorizeJob,
  extractTags,
  isRemote,
  normalizeJobType,
} from "./job-filter";

interface WorkdayJob {
  bulletFields: string[];
  title: string;
  externalPath: string;
  locationsText: string;
  postedOn: string;
}

// Parse Workday's relative date strings like "Posted Today", "Posted 30+ Days Ago"
function parseWorkdayDate(postedOn: string): Date | undefined {
  if (!postedOn) return undefined;

  const now = new Date();
  const lower = postedOn.toLowerCase();

  if (lower.includes("today")) {
    return now;
  }

  if (lower.includes("yesterday")) {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // Match patterns like "Posted 3 Days Ago", "Posted 30+ Days Ago"
  const daysMatch = lower.match(/(\d+)\+?\s*days?\s*ago/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // If we can't parse it, return undefined rather than an invalid date
  return undefined;
}

interface WorkdayApiResponse {
  total: number;
  jobPostings: WorkdayJob[];
}

export async function scrapeWorkday(
  company: DEICompany
): Promise<ScraperResult> {
  const config = company.atsConfig as WorkdayConfig;

  if (!config?.baseUrl || !config?.company || !config?.siteName) {
    return {
      success: false,
      jobs: [],
      error: "Missing Workday configuration",
    };
  }

  try {
    // Workday uses a POST endpoint to search jobs
    const url = `${config.baseUrl}/wday/cxs/${config.company}/${config.siteName}/jobs`;

    const seen = new Set<string>();
    const allJobs: ScrapedJob[] = [];

    // Two-pass scrape: default ordering (covers FT senior tech) + searchText
    // bias toward "intern" (surfaces internships that get pushed past the 500
    // offset cap on big tenants like Walmart with mostly non-tech postings).
    // Both passes share the same offset cap and tech-role filter; dedup by
    // externalId across passes.
    const passes: Array<{ searchText: string; label: string }> = [
      { searchText: "", label: "default" },
      { searchText: "intern", label: "intern-bias" },
    ];

    for (const pass of passes) {
      let offset = 0;
      const limit = 20;
      let hasMore = true;

      // Paginate through results (max 500 jobs per pass to avoid rate limits)
      while (hasMore && offset < 500) {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            appliedFacets: {},
            limit,
            offset,
            searchText: pass.searchText,
          }),
        });

        if (!response.ok) {
          // If first request of the first pass fails, return error.
          // Per-pass failures after offset 0 just stop that pass.
          if (offset === 0 && pass.label === "default") {
            return {
              success: false,
              jobs: [],
              error: `Workday API returned ${response.status}`,
            };
          }
          break;
        }

        const data: WorkdayApiResponse = await response.json();

        if (!data.jobPostings || data.jobPostings.length === 0) {
          break;
        }

        for (const job of data.jobPostings) {
          // Filter for tech roles only
          if (!isTechRole(job.title)) {
            continue;
          }

          // Extract job ID from path (e.g., /job/R123456)
          const idMatch = job.externalPath.match(/\/job\/([^/]+)/);
          const externalId = idMatch ? `wd-${idMatch[1]}` : `wd-${job.externalPath}`;
          if (seen.has(externalId)) continue;
          seen.add(externalId);

          const location = job.locationsText || "Unknown";
          const remote = isRemote(location, job.title);

          // Extract employment type from bullet fields if available, fall back
          // to title-based inference for unlabeled intern listings.
          let employmentType = "Full-time";
          if (job.bulletFields) {
            for (const field of job.bulletFields) {
              const normalized = normalizeJobType(field, job.title);
              if (normalized !== "Full-time") {
                employmentType = normalized;
                break;
              }
            }
          }
          if (employmentType === "Full-time") {
            employmentType = normalizeJobType(undefined, job.title);
          }

          // Build apply URL - must include site name for valid Workday URLs
          const applyUrl = `${config.baseUrl}/en-US/${config.siteName}${job.externalPath}`;

          const scrapedJob: ScrapedJob = {
            externalId,
            title: job.title,
            location,
            type: employmentType,
            remote,
            postedAt: parseWorkdayDate(job.postedOn),
            applyUrl,
            category: categorizeJob(job.title),
            tags: extractTags(job.title),
          };

          allJobs.push(scrapedJob);
        }

        // Check if there are more results
        hasMore = data.jobPostings.length === limit && offset + limit < data.total;
        offset += limit;

        // Small delay to be nice to the API
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return {
      success: true,
      jobs: allJobs,
    };
  } catch (error) {
    return {
      success: false,
      jobs: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
