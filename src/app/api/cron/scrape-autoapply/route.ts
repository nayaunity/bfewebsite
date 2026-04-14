import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeAutoApplyCompanies } from "@/lib/scrapers";

export const runtime = "nodejs";
export const maxDuration = 300;

const CRON_NAME = "scrape-autoapply";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Self-heal: close any prior "running" row for this cron older than 15 min.
  // Covers cases where the function was killed mid-run (Vercel timeout, OOM).
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
  await prisma.scrapeRun.updateMany({
    where: { cron: CRON_NAME, status: "running", startedAt: { lt: fifteenMinAgo } },
    data: { status: "timeout", completedAt: new Date(), error: "Previous run did not complete within 15 minutes" },
  }).catch(() => { /* non-fatal */ });

  const run = await prisma.scrapeRun.create({
    data: { cron: CRON_NAME, status: "running" },
  });
  const startedAt = run.startedAt;

  try {
    console.log(`[${CRON_NAME}] Starting (run=${run.id})...`);
    const summary = await scrapeAutoApplyCompanies();

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const companiesSuccessful = summary.successfulSlugs.length;
    const companiesFailed = summary.failedSlugs.length;
    const companiesTotal = companiesSuccessful + companiesFailed;
    const status = companiesFailed === 0 ? "success" : companiesSuccessful === 0 ? "failed" : "partial";

    await prisma.scrapeRun.update({
      where: { id: run.id },
      data: {
        completedAt,
        durationMs,
        status,
        companiesTotal,
        companiesSuccessful,
        companiesFailed,
        jobsFound: summary.totalJobsFound,
        jobsSaved: summary.totalJobsSaved,
        jobsDeactivated: summary.jobsDeactivated,
        details: JSON.stringify(summary.results),
      },
    });

    console.log(`[${CRON_NAME}] Complete:`, {
      runId: run.id,
      status,
      durationMs,
      companiesTotal,
      companiesSuccessful,
      companiesFailed,
      jobsFound: summary.totalJobsFound,
      jobsSaved: summary.totalJobsSaved,
      jobsDeactivated: summary.jobsDeactivated,
    });

    return NextResponse.json({
      success: status !== "failed",
      runId: run.id,
      status,
      duration: `${Math.round(durationMs / 1000)}s`,
      companiesTotal,
      companiesSuccessful,
      companiesFailed,
      jobsFound: summary.totalJobsFound,
      jobsSaved: summary.totalJobsSaved,
      jobsDeactivated: summary.jobsDeactivated,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[${CRON_NAME}] Failed:`, error);
    await prisma.scrapeRun.update({
      where: { id: run.id },
      data: {
        completedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        status: "failed",
        error: errMsg,
      },
    }).catch(() => { /* best effort */ });

    return NextResponse.json(
      { success: false, runId: run.id, error: errMsg },
      { status: 500 }
    );
  }
}
