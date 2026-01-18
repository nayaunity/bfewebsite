import { NextRequest, NextResponse } from "next/server";
import { scrapeAllCompanies } from "@/lib/scrapers";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max for Vercel

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Starting job scrape...");
    const startTime = Date.now();

    const { results, totalJobsFound, totalJobsSaved } =
      await scrapeAllCompanies();

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

    console.log("Scrape complete:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Scrape failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
