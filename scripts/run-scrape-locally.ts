/**
 * Run the auto-apply scrape locally against the prod Turso DB.
 *
 * Why: the cron `/api/cron/scrape-autoapply` reads `src/data/auto-apply-companies.json`
 * from the Vercel bundle at build time. To pick up local edits without
 * deploying, we reimplement the orchestration here. The individual scraper
 * modules (greenhouse, lever, ashby, workday) don't import `server-only`,
 * so we can call them directly. We use our own PrismaLibSQL client.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/run-scrape-locally.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { readFileSync } from "fs";
import { resolve } from "path";
import { scrapeGreenhouse } from "../src/lib/scrapers/greenhouse";
import { scrapeWorkday } from "../src/lib/scrapers/workday";
import { scrapeLever } from "../src/lib/scrapers/lever";
import { scrapeAshby } from "../src/lib/scrapers/ashby";
import { computeRegion } from "../src/lib/job-region";
import type { DEICompany, ScrapedJob, ScraperResult } from "../src/lib/scrapers/types";

interface CompanyResult {
  company: string;
  companySlug: string;
  status: "success" | "partial" | "error";
  jobsFound: number;
  jobsSaved: number;
  error?: string;
}

async function scrapeCompany(c: DEICompany): Promise<{ success: boolean; result: ScraperResult | null; error?: string }> {
  if (!c.atsType || !c.atsConfig) {
    return { success: false, result: null, error: "missing atsType/atsConfig" };
  }
  try {
    let result: ScraperResult;
    if (c.atsType === "greenhouse") {
      result = await scrapeGreenhouse(c);
    } else if (c.atsType === "workday") {
      result = await scrapeWorkday(c);
    } else if (c.atsType === "lever") {
      result = await scrapeLever(c);
    } else if (c.atsType === "ashby") {
      result = await scrapeAshby(c);
    } else {
      return { success: false, result: null, error: `unsupported atsType: ${c.atsType}` };
    }
    return { success: result.success, result };
  } catch (err) {
    return { success: false, result: null, error: err instanceof Error ? err.message : String(err) };
  }
}

async function saveJobs(prisma: PrismaClient, c: DEICompany, jobs: ScrapedJob[]): Promise<number> {
  let saved = 0;
  for (const job of jobs) {
    try {
      const region = computeRegion(job.location);
      await prisma.job.upsert({
        where: { externalId_companySlug: { externalId: job.externalId, companySlug: c.slug } },
        create: {
          externalId: job.externalId,
          company: c.name,
          companySlug: c.slug,
          title: job.title,
          description: job.description ?? null,
          location: job.location,
          type: job.type,
          remote: job.remote,
          salary: job.salary ?? null,
          postedAt: job.postedAt ?? null,
          applyUrl: job.applyUrl,
          category: job.category,
          tags: JSON.stringify(job.tags ?? []),
          source: "auto-apply",
          region,
          isActive: true,
        },
        update: {
          title: job.title,
          description: job.description ?? null,
          location: job.location,
          type: job.type,
          remote: job.remote,
          salary: job.salary ?? null,
          postedAt: job.postedAt ?? null,
          applyUrl: job.applyUrl,
          category: job.category,
          tags: JSON.stringify(job.tags ?? []),
          region,
          isActive: true,
        },
      });
      saved++;
    } catch (err) {
      console.warn(`  ! upsert failed for ${c.slug}/${job.externalId}: ${err instanceof Error ? err.message : err}`);
    }
  }
  return saved;
}

async function main() {
  const adapter = new PrismaLibSQL({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
    intMode: "number",
  });
  const prisma = new PrismaClient({ adapter });

  const companiesPath = resolve(__dirname, "..", "src", "data", "auto-apply-companies.json");
  const companies = JSON.parse(readFileSync(companiesPath, "utf-8")) as DEICompany[];

  console.log(`\n=== run-scrape-locally ===`);
  console.log(`Companies in auto-apply-companies.json: ${companies.length}\n`);

  const runStartTime = new Date();
  const run = await prisma.scrapeRun.create({
    data: { cron: "scrape-autoapply", status: "running", startedAt: runStartTime },
  });
  console.log(`ScrapeRun id: ${run.id}\n`);

  const results: CompanyResult[] = [];
  let totalJobsFound = 0;
  let totalJobsSaved = 0;

  const BATCH_SIZE = 5;
  for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map(async (c) => {
        const { success, result, error } = await scrapeCompany(c);
        const found = result?.jobs?.length ?? 0;
        const saved = success && result ? await saveJobs(prisma, c, result.jobs) : 0;
        return {
          company: c.name,
          companySlug: c.slug,
          status: success ? (saved < found ? "partial" : "success") : "error",
          jobsFound: found,
          jobsSaved: saved,
          error: error || result?.error,
        } as CompanyResult;
      })
    );
    for (let k = 0; k < settled.length; k++) {
      const s = settled[k];
      if (s.status === "fulfilled") {
        results.push(s.value);
        totalJobsFound += s.value.jobsFound;
        totalJobsSaved += s.value.jobsSaved;
        const tag = s.value.status === "success" ? "OK" : s.value.status === "partial" ? "PART" : "ERR";
        console.log(`  [${tag.padEnd(4)}] ${s.value.company.padEnd(20)} found=${s.value.jobsFound.toString().padStart(4)} saved=${s.value.jobsSaved.toString().padStart(4)}${s.value.error ? `  err=${s.value.error.slice(0, 80)}` : ""}`);
      } else {
        const c = batch[k];
        results.push({
          company: c.name,
          companySlug: c.slug,
          status: "error",
          jobsFound: 0,
          jobsSaved: 0,
          error: s.reason?.message || "Unknown error",
        });
        console.log(`  [ERR ] ${c.name.padEnd(20)} CRASH ${s.reason?.message?.slice(0, 80) ?? ""}`);
      }
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const successfulSlugs = results.filter((r) => r.status === "success" || r.status === "partial").map((r) => r.companySlug);
  const failedSlugs = results.filter((r) => r.status === "error").map((r) => r.companySlug);

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

  const completedAt = new Date();
  const durationMs = completedAt.getTime() - runStartTime.getTime();
  const status = failedSlugs.length === 0 ? "success" : successfulSlugs.length === 0 ? "failed" : "partial";

  await prisma.scrapeRun.update({
    where: { id: run.id },
    data: {
      completedAt,
      durationMs,
      status,
      companiesTotal: results.length,
      companiesSuccessful: successfulSlugs.length,
      companiesFailed: failedSlugs.length,
      jobsFound: totalJobsFound,
      jobsSaved: totalJobsSaved,
      jobsDeactivated,
      details: JSON.stringify(results),
    },
  });

  console.log(`\n=== Summary ===`);
  console.log(`  Status:               ${status}`);
  console.log(`  Duration:             ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`  Companies total:      ${results.length}`);
  console.log(`  Companies successful: ${successfulSlugs.length}`);
  console.log(`  Companies failed:     ${failedSlugs.length}`);
  console.log(`  Jobs found:           ${totalJobsFound}`);
  console.log(`  Jobs saved:           ${totalJobsSaved}`);
  console.log(`  Jobs deactivated:     ${jobsDeactivated}`);

  if (failedSlugs.length > 0) {
    console.log(`\nFailed companies:`);
    for (const r of results.filter((r) => r.status === "error")) {
      console.log(`  - ${r.companySlug}: ${r.error}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
