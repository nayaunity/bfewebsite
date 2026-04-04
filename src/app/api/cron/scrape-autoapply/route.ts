import { NextRequest, NextResponse } from "next/server";
import { scrapeAutoApplyCompanies } from "@/lib/scrapers";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Auto-Apply Scrape] Starting...");
    const startTime = Date.now();

    const { results, totalJobsFound, totalJobsSaved } =
      await scrapeAutoApplyCompanies();

    const duration = Math.round((Date.now() - startTime) / 1000);

    const summary = {
      success: true,
      duration: `${duration}s`,
      totalJobsFound,
      totalJobsSaved,
      companiesScraped: results.length,
      successful: results.filter((r) => r.status === "success").length,
      partial: results.filter((r) => r.status === "partial").length,
      failed: results.filter((r) => r.status === "error").length,
      details: results,
    };

    console.log("[Auto-Apply Scrape] Complete:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Auto-Apply Scrape] Failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
