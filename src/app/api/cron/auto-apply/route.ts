import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { batchApply } from "@/lib/auto-apply/batch-apply";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Starting auto-apply cron...");
    const startTime = Date.now();

    // Find all users who have opted in and have complete profiles
    const users = await prisma.user.findMany({
      where: {
        autoApplyEnabled: true,
        firstName: { not: null },
        lastName: { not: null },
        phone: { not: null },
        resumeUrl: { not: null },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        resumeUrl: true,
        resumeName: true,
      },
    });

    console.log(`Found ${users.length} opted-in users`);

    const results = [];

    for (const user of users) {
      try {
        const result = await batchApply(user.id, {
          firstName: user.firstName!,
          lastName: user.lastName!,
          email: user.email,
          phone: user.phone!,
          resumeUrl: user.resumeUrl!,
          resumeName: user.resumeName || "resume.pdf",
        });

        results.push({
          userId: user.id,
          email: user.email,
          status: "success",
          submitted: result.submitted,
          skipped: result.skipped,
          failed: result.failed,
        });
      } catch (error) {
        results.push({
          userId: user.id,
          email: user.email,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      usersProcessed: users.length,
      results,
    });
  } catch (error) {
    console.error("Auto-apply cron failed:", error);
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
