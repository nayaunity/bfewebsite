import { prisma } from "@/lib/prisma";
import deiCompanies from "@/data/dei-companies.json";
import type { DEICompany, ScrapedJob, ScraperResult } from "./types";
import { scrapeGreenhouse } from "./greenhouse";
import { scrapeWorkday } from "./workday";

const companies = deiCompanies as DEICompany[];

type ScrapeStatus = "success" | "error" | "partial";

interface ScrapeCompanyResult {
  company: string;
  status: ScrapeStatus;
  jobsFound: number;
  jobsSaved: number;
  error?: string;
}

export async function scrapeCompany(
  company: DEICompany
): Promise<ScrapeCompanyResult> {
  let result: ScraperResult;

  // Select the appropriate scraper based on ATS type
  switch (company.atsType) {
    case "greenhouse":
      result = await scrapeGreenhouse(company);
      break;
    case "workday":
      result = await scrapeWorkday(company);
      break;
    case "custom":
    default:
      // Skip companies without a supported ATS
      return {
        company: company.name,
        status: "error",
        jobsFound: 0,
        jobsSaved: 0,
        error: "No supported scraper for this ATS type",
      };
  }

  // Log the scrape attempt
  const logStatus: ScrapeStatus = result.success
    ? result.jobs.length > 0
      ? "success"
      : "partial"
    : "error";

  await prisma.scrapeLog.create({
    data: {
      companySlug: company.slug,
      status: logStatus,
      jobsFound: result.jobs.length,
      errorMessage: result.error,
    },
  });

  if (!result.success) {
    return {
      company: company.name,
      status: "error",
      jobsFound: 0,
      jobsSaved: 0,
      error: result.error,
    };
  }

  // Save jobs to database with upsert (deduplication)
  let jobsSaved = 0;
  const saveErrors: string[] = [];

  for (const job of result.jobs) {
    try {
      await prisma.job.upsert({
        where: {
          externalId_companySlug: {
            externalId: job.externalId,
            companySlug: company.slug,
          },
        },
        create: {
          externalId: job.externalId,
          company: company.name,
          companySlug: company.slug,
          title: job.title,
          location: job.location,
          type: job.type,
          remote: job.remote,
          salary: job.salary,
          postedAt: job.postedAt,
          applyUrl: job.applyUrl,
          category: job.category,
          tags: JSON.stringify(job.tags),
          source: company.atsType,
          isActive: true,
        },
        update: {
          title: job.title,
          location: job.location,
          type: job.type,
          remote: job.remote,
          salary: job.salary,
          postedAt: job.postedAt,
          applyUrl: job.applyUrl,
          category: job.category,
          tags: JSON.stringify(job.tags),
          isActive: true,
          updatedAt: new Date(),
        },
      });
      jobsSaved++;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      saveErrors.push(`${job.externalId}: ${errMsg}`);
      console.error(
        `Failed to save job ${job.externalId} for ${company.name}:`,
        error
      );
    }
  }

  return {
    company: company.name,
    status: jobsSaved > 0 ? "success" : "partial",
    jobsFound: result.jobs.length,
    jobsSaved,
    error: saveErrors.length > 0 ? saveErrors.slice(0, 3).join("; ") : undefined,
  };
}

export async function scrapeAllCompanies(): Promise<{
  results: ScrapeCompanyResult[];
  totalJobsFound: number;
  totalJobsSaved: number;
}> {
  const results: ScrapeCompanyResult[] = [];
  let totalJobsFound = 0;
  let totalJobsSaved = 0;

  // Get companies with supported ATS types
  const scrapableCompanies = companies.filter(
    (c) => c.atsType === "greenhouse" || c.atsType === "workday"
  );

  // Process companies sequentially to avoid rate limits
  for (const company of scrapableCompanies) {
    console.log(`Scraping ${company.name}...`);

    try {
      const result = await scrapeCompany(company);
      results.push(result);
      totalJobsFound += result.jobsFound;
      totalJobsSaved += result.jobsSaved;

      console.log(
        `${company.name}: Found ${result.jobsFound}, saved ${result.jobsSaved}`
      );
    } catch (error) {
      console.error(`Error scraping ${company.name}:`, error);
      results.push({
        company: company.name,
        status: "error",
        jobsFound: 0,
        jobsSaved: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Delay between companies to be nice to APIs
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Mark jobs as inactive if they weren't updated in this scrape
  // (they may have been removed from the company's job board)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.job.updateMany({
    where: {
      updatedAt: {
        lt: twentyFourHoursAgo,
      },
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  return {
    results,
    totalJobsFound,
    totalJobsSaved,
  };
}

export async function getScrapableCompanies(): Promise<DEICompany[]> {
  return companies.filter(
    (c) => c.atsType === "greenhouse" || c.atsType === "workday"
  );
}

export { type ScrapedJob, type ScraperResult, type DEICompany };
