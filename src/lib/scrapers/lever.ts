import type { DEICompany, LeverConfig, ScrapedJob, ScraperResult } from "./types";
import {
  isTechRole,
  categorizeJob,
  extractTags,
  isRemote,
  normalizeJobType,
} from "./job-filter";

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  categories: {
    team?: string;
    department?: string;
    location?: string;
    commitment?: string;
    allLocations?: string[];
  };
  description?: string;
  descriptionPlain?: string;
  createdAt: number;
}

export async function scrapeLever(
  company: DEICompany,
  options?: { skipRoleFilter?: boolean; source?: string }
): Promise<ScraperResult> {
  const config = company.atsConfig as LeverConfig;

  if (!config?.companySlug) {
    return {
      success: false,
      jobs: [],
      error: "Missing Lever company slug",
    };
  }

  try {
    const url = `https://api.lever.co/v0/postings/${config.companySlug}?limit=100`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return {
        success: false,
        jobs: [],
        error: `Lever API returned ${response.status}`,
      };
    }

    const data: LeverPosting[] = await response.json();

    const jobs: ScrapedJob[] = [];

    for (const posting of data) {
      if (!options?.skipRoleFilter && !isTechRole(posting.text)) {
        continue;
      }

      const location = posting.categories?.location || "Unknown";
      const remote = isRemote(location, posting.text);
      const employmentType = normalizeJobType(
        posting.categories?.commitment || "Full-time"
      );

      const scrapedJob: ScrapedJob = {
        externalId: `lv-${posting.id}`,
        title: posting.text,
        description: posting.descriptionPlain || posting.description || undefined,
        location,
        type: employmentType,
        remote,
        postedAt: posting.createdAt ? new Date(posting.createdAt) : undefined,
        applyUrl: posting.hostedUrl,
        category: categorizeJob(posting.text),
        tags: extractTags(posting.text, posting.description),
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
