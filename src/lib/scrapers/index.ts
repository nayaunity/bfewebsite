import { prisma } from "@/lib/prisma";
import { computeRegion } from "@/lib/job-region";
import deiCompanies from "@/data/dei-companies.json";
import autoApplyCompanies from "@/data/auto-apply-companies.json";
import type { DEICompany, ScraperResult } from "./types";
import { scrapeGreenhouse } from "./greenhouse";
import { scrapeWorkday } from "./workday";
import { scrapeLever } from "./lever";
import { scrapeAshby } from "./ashby";

const companies = deiCompanies as DEICompany[];
const autoApplyCompanyList = autoApplyCompanies as DEICompany[];

type ScrapeStatus = "success" | "error" | "partial";

interface ScrapeCompanyResult {
  company: string;
  companySlug: string;
  status: ScrapeStatus;
  jobsFound: number;
  jobsSaved: number;
  error?: string;
}

export interface ScrapeSummary {
  results: ScrapeCompanyResult[];
  totalJobsFound: number;
  totalJobsSaved: number;
  jobsDeactivated: number;
  successfulSlugs: string[];
  failedSlugs: string[];
  runStartTime: Date;
}

const PER_COMPANY_TIMEOUT_MS = 45_000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms)
    ),
  ]);
}

async function runScraperWithTimeout(
  company: DEICompany,
  opts: { skipRoleFilter?: boolean } = {}
): Promise<ScraperResult> {
  const label = `${company.name} (${company.atsType})`;
  try {
    switch (company.atsType) {
      case "greenhouse":
        return await withTimeout(scrapeGreenhouse(company, opts), PER_COMPANY_TIMEOUT_MS, label);
      case "workday":
        return await withTimeout(scrapeWorkday(company), PER_COMPANY_TIMEOUT_MS, label);
      case "lever":
        return await withTimeout(scrapeLever(company, opts), PER_COMPANY_TIMEOUT_MS, label);
      case "ashby":
        return await withTimeout(scrapeAshby(company, opts), PER_COMPANY_TIMEOUT_MS, label);
      case "custom":
      default:
        return { success: false, jobs: [], error: `No supported scraper for ATS type: ${company.atsType}` };
    }
  } catch (err) {
    return {
      success: false,
      jobs: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function scrapeCompany(
  company: DEICompany
): Promise<ScrapeCompanyResult> {
  const result = await runScraperWithTimeout(company);

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
  }).catch(() => { /* log failures shouldn't break the scrape */ });

  if (!result.success) {
    return {
      company: company.name,
      companySlug: company.slug,
      status: "error",
      jobsFound: 0,
      jobsSaved: 0,
      error: result.error,
    };
  }

  let jobsSaved = 0;
  const saveErrors: string[] = [];
  const UPSERT_BATCH = 50;

  for (let j = 0; j < result.jobs.length; j += UPSERT_BATCH) {
    const chunk = result.jobs.slice(j, j + UPSERT_BATCH);
    try {
      await prisma.$transaction(
        chunk.map((job) =>
          prisma.job.upsert({
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
              description: job.description,
              location: job.location,
              type: job.type,
              remote: job.remote,
              salary: job.salary,
              postedAt: job.postedAt,
              applyUrl: job.applyUrl,
              category: job.category,
              tags: JSON.stringify(job.tags),
              source: company.atsType,
              region: computeRegion(job.location),
              isActive: true,
            },
            update: {
              title: job.title,
              description: job.description,
              location: job.location,
              type: job.type,
              remote: job.remote,
              salary: job.salary,
              postedAt: job.postedAt,
              applyUrl: job.applyUrl,
              category: job.category,
              tags: JSON.stringify(job.tags),
              region: computeRegion(job.location),
              isActive: true,
              updatedAt: new Date(),
            },
          })
        )
      );
      jobsSaved += chunk.length;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      saveErrors.push(errMsg);
      console.error(`Failed to save batch for ${company.name}:`, error);
    }
  }

  return {
    company: company.name,
    companySlug: company.slug,
    status: jobsSaved > 0 ? "success" : result.jobs.length === 0 ? "success" : "partial",
    jobsFound: result.jobs.length,
    jobsSaved,
    error: saveErrors.length > 0 ? saveErrors.slice(0, 3).join("; ") : undefined,
  };
}

async function deactivateStale(
  successfulSlugs: string[],
  runStartTime: Date
): Promise<number> {
  if (successfulSlugs.length === 0) return 0;
  const { count } = await prisma.job.updateMany({
    where: {
      companySlug: { in: successfulSlugs },
      updatedAt: { lt: runStartTime },
      isActive: true,
      source: { not: "manual" },
    },
    data: { isActive: false },
  });
  return count;
}

export async function scrapeAllCompanies(): Promise<ScrapeSummary> {
  const runStartTime = new Date();
  const results: ScrapeCompanyResult[] = [];
  let totalJobsFound = 0;
  let totalJobsSaved = 0;

  const scrapableCompanies = companies.filter(
    (c) => c.atsType === "greenhouse" || c.atsType === "workday" || c.atsType === "lever" || c.atsType === "ashby"
  );

  const BATCH_SIZE = 5;
  for (let i = 0; i < scrapableCompanies.length; i += BATCH_SIZE) {
    const batch = scrapableCompanies.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(batch.map((c) => scrapeCompany(c)));
    for (let k = 0; k < batchResults.length; k++) {
      const settled = batchResults[k];
      if (settled.status === "fulfilled") {
        const r = settled.value;
        results.push(r);
        totalJobsFound += r.jobsFound;
        totalJobsSaved += r.jobsSaved;
      } else {
        const c = batch[k];
        results.push({
          company: c.name,
          companySlug: c.slug,
          status: "error",
          jobsFound: 0,
          jobsSaved: 0,
          error: settled.reason?.message || "Unknown error",
        });
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const successfulSlugs = results
    .filter((r) => r.status === "success" || r.status === "partial")
    .map((r) => r.companySlug);
  const failedSlugs = results
    .filter((r) => r.status === "error")
    .map((r) => r.companySlug);

  const jobsDeactivated = await deactivateStale(successfulSlugs, runStartTime);

  return {
    results,
    totalJobsFound,
    totalJobsSaved,
    jobsDeactivated,
    successfulSlugs,
    failedSlugs,
    runStartTime,
  };
}

async function scrapeOneAutoApplyCompany(company: DEICompany): Promise<ScrapeCompanyResult> {
  console.log(`[Auto-Apply Scrape] ${company.name}...`);

  const result = await runScraperWithTimeout(company, { skipRoleFilter: true });

  if (!result.success) {
    return {
      company: company.name,
      companySlug: company.slug,
      status: "error",
      jobsFound: 0,
      jobsSaved: 0,
      error: result.error,
    };
  }

  await prisma.scrapeLog.create({
    data: {
      companySlug: company.slug,
      status: result.jobs.length > 0 ? "success" : "partial",
      jobsFound: result.jobs.length,
    },
  }).catch(() => { /* noop */ });

  let jobsSaved = 0;
  const UPSERT_BATCH = 50;
  for (let j = 0; j < result.jobs.length; j += UPSERT_BATCH) {
    const chunk = result.jobs.slice(j, j + UPSERT_BATCH);
    try {
      await prisma.$transaction(
        chunk.map((job) =>
          prisma.job.upsert({
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
              description: job.description,
              location: job.location,
              type: job.type,
              remote: job.remote,
              salary: job.salary,
              postedAt: job.postedAt,
              applyUrl: job.applyUrl,
              category: job.category,
              tags: JSON.stringify(job.tags),
              source: "auto-apply",
              region: computeRegion(job.location),
              isActive: true,
            },
            update: {
              title: job.title,
              description: job.description,
              location: job.location,
              type: job.type,
              remote: job.remote,
              salary: job.salary,
              postedAt: job.postedAt,
              applyUrl: job.applyUrl,
              category: job.category,
              tags: JSON.stringify(job.tags),
              source: "auto-apply",
              region: computeRegion(job.location),
              isActive: true,
              updatedAt: new Date(),
            },
          })
        )
      );
      jobsSaved += chunk.length;
    } catch (error) {
      console.error(`[Auto-Apply Scrape] Batch save failed for ${company.name}:`, error);
    }
  }

  console.log(`[Auto-Apply Scrape] ${company.name}: Found ${result.jobs.length}, saved ${jobsSaved}`);
  return {
    company: company.name,
    companySlug: company.slug,
    status: jobsSaved > 0 ? "success" : result.jobs.length === 0 ? "success" : "partial",
    jobsFound: result.jobs.length,
    jobsSaved,
  };
}

export async function scrapeAutoApplyCompanies(): Promise<ScrapeSummary> {
  const runStartTime = new Date();
  const results: ScrapeCompanyResult[] = [];
  let totalJobsFound = 0;
  let totalJobsSaved = 0;

  const BATCH_SIZE = 5;
  for (let i = 0; i < autoApplyCompanyList.length; i += BATCH_SIZE) {
    const batch = autoApplyCompanyList.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(batch.map((c) => scrapeOneAutoApplyCompany(c)));
    for (let k = 0; k < batchResults.length; k++) {
      const settled = batchResults[k];
      if (settled.status === "fulfilled") {
        const r = settled.value;
        results.push(r);
        totalJobsFound += r.jobsFound;
        totalJobsSaved += r.jobsSaved;
      } else {
        const c = batch[k];
        results.push({
          company: c.name,
          companySlug: c.slug,
          status: "error",
          jobsFound: 0,
          jobsSaved: 0,
          error: settled.reason?.message || "Unknown error",
        });
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const successfulSlugs = results
    .filter((r) => r.status === "success" || r.status === "partial")
    .map((r) => r.companySlug);
  const failedSlugs = results
    .filter((r) => r.status === "error")
    .map((r) => r.companySlug);

  // Only touch auto-apply-sourced jobs here — scrapeAllCompanies handles the rest
  let jobsDeactivated = 0;
  if (successfulSlugs.length > 0) {
    const { count } = await prisma.job.updateMany({
      where: {
        source: "auto-apply",
        companySlug: { in: successfulSlugs },
        updatedAt: { lt: runStartTime },
        isActive: true,
      },
      data: { isActive: false },
    });
    jobsDeactivated = count;
  }

  return {
    results,
    totalJobsFound,
    totalJobsSaved,
    jobsDeactivated,
    successfulSlugs,
    failedSlugs,
    runStartTime,
  };
}

export async function getScrapableCompanies(): Promise<DEICompany[]> {
  return companies.filter(
    (c) => c.atsType === "greenhouse" || c.atsType === "workday" || c.atsType === "lever" || c.atsType === "ashby"
  );
}

export { type ScrapedJob, type ScraperResult, type DEICompany } from "./types";
