import type { DEICompany, GreenhouseConfig, ScrapedJob, ScraperResult } from "./types";
import {
  isTechRole,
  categorizeJob,
  extractTags,
  isRemote,
  normalizeJobType,
} from "./job-filter";

interface GreenhouseJob {
  id: number;
  title: string;
  location: {
    name: string;
  };
  absolute_url: string;
  updated_at: string;
  metadata?: Array<{
    name: string;
    value: string | string[] | null;
  }>;
}

interface GreenhouseApiResponse {
  jobs: GreenhouseJob[];
}

export async function scrapeGreenhouse(
  company: DEICompany
): Promise<ScraperResult> {
  const config = company.atsConfig as GreenhouseConfig;

  if (!config?.boardToken) {
    return {
      success: false,
      jobs: [],
      error: "Missing Greenhouse board token",
    };
  }

  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${config.boardToken}/jobs?content=true`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return {
        success: false,
        jobs: [],
        error: `Greenhouse API returned ${response.status}`,
      };
    }

    const data: GreenhouseApiResponse = await response.json();

    const jobs: ScrapedJob[] = [];

    for (const job of data.jobs) {
      // Filter for tech roles only
      if (!isTechRole(job.title)) {
        continue;
      }

      const location = job.location?.name || "Unknown";
      const remote = isRemote(location, job.title);

      // Extract employment type from metadata if available
      let employmentType = "Full-time";
      if (job.metadata) {
        const typeField = job.metadata.find(
          (m) =>
            m.name.toLowerCase().includes("employment") ||
            m.name.toLowerCase().includes("type")
        );
        if (typeField && typeof typeField.value === "string") {
          employmentType = normalizeJobType(typeField.value);
        }
      }

      const scrapedJob: ScrapedJob = {
        externalId: `gh-${job.id}`,
        title: job.title,
        location: location,
        type: employmentType,
        remote,
        postedAt: job.updated_at ? new Date(job.updated_at) : undefined,
        applyUrl: job.absolute_url,
        category: categorizeJob(job.title),
        tags: extractTags(job.title),
      };

      jobs.push(scrapedJob);
    }

    return {
      success: true,
      jobs,
    };
  } catch (error) {
    return {
      success: false,
      jobs: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
