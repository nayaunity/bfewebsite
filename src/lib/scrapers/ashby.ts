import type { DEICompany, AshbyConfig, ScrapedJob, ScraperResult } from "./types";
import {
  isTechRole,
  categorizeJob,
  extractTags,
  isRemote,
  normalizeJobType,
} from "./job-filter";

interface AshbyJob {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  department?: string;
  team?: string;
  isRemote?: boolean | null;
  publishedAt?: string;
  jobUrl: string;
  applyUrl: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
  secondaryLocations?: Array<{ location: string }>;
}

interface AshbyApiResponse {
  jobs: AshbyJob[];
}

export async function scrapeAshby(
  company: DEICompany,
  options?: { skipRoleFilter?: boolean; source?: string }
): Promise<ScraperResult> {
  const config = company.atsConfig as AshbyConfig;

  if (!config?.boardSlug) {
    return {
      success: false,
      jobs: [],
      error: "Missing Ashby board slug",
    };
  }

  try {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${config.boardSlug}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return {
        success: false,
        jobs: [],
        error: `Ashby API returned ${response.status}`,
      };
    }

    const data: AshbyApiResponse = await response.json();

    const jobs: ScrapedJob[] = [];

    for (const job of data.jobs) {
      if (!options?.skipRoleFilter && !isTechRole(job.title)) {
        continue;
      }

      const location = job.location || "Unknown";
      const remote =
        job.isRemote === true || isRemote(location, job.title);
      const employmentType = normalizeJobType(job.employmentType || "Full-time");

      const scrapedJob: ScrapedJob = {
        externalId: `ab-${job.id}`,
        title: job.title,
        description: job.descriptionPlain || job.descriptionHtml || undefined,
        location,
        type: employmentType,
        remote,
        postedAt: job.publishedAt ? new Date(job.publishedAt) : undefined,
        applyUrl: job.applyUrl,
        category: categorizeJob(job.title),
        tags: extractTags(job.title, job.descriptionHtml),
      };

      jobs.push(scrapedJob);
    }

    return { success: true, jobs };
  } catch (error) {
    return {
      success: false,
      jobs: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
