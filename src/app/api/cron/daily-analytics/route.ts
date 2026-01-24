import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get start of a specific day in Denver timezone
function getDayStartDenver(daysAgo: number): Date {
  const now = new Date();
  const denverTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Denver" }));
  const denverMidnight = new Date(denverTime.getFullYear(), denverTime.getMonth(), denverTime.getDate());
  denverMidnight.setDate(denverMidnight.getDate() - daysAgo);
  const offset = denverTime.getTime() - now.getTime();
  return new Date(denverMidnight.getTime() - offset);
}

// Format date as YYYY-MM-DD in Denver timezone
function formatDateDenver(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Denver" }); // en-CA gives YYYY-MM-DD format
}

export async function GET(request: NextRequest) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Calculate analytics for yesterday
    const yesterdayStart = getDayStartDenver(1);
    const todayStart = getDayStartDenver(0);
    const dateStr = formatDateDenver(yesterdayStart);

    // Check if we already have data for this date
    const existing = await prisma.dailyAnalytics.findUnique({
      where: { date: dateStr },
    });

    if (existing) {
      return NextResponse.json({
        message: "Analytics already computed for this date",
        date: dateStr,
        data: existing
      });
    }

    // Compute analytics for yesterday
    const [visitors, blogViews, linkClicks, jobClicks] = await Promise.all([
      prisma.pagePresence.groupBy({
        by: ["visitorId"],
        where: {
          lastSeenAt: {
            gte: yesterdayStart,
            lt: todayStart,
          },
        },
        _count: true,
      }).then(r => r.length),

      prisma.blogView.count({
        where: {
          viewedAt: {
            gte: yesterdayStart,
            lt: todayStart,
          },
        },
      }),

      prisma.linkClick.count({
        where: {
          clickedAt: {
            gte: yesterdayStart,
            lt: todayStart,
          },
        },
      }),

      prisma.jobClick.count({
        where: {
          clickedAt: {
            gte: yesterdayStart,
            lt: todayStart,
          },
        },
      }),
    ]);

    // Store the analytics
    const analytics = await prisma.dailyAnalytics.create({
      data: {
        date: dateStr,
        visitors,
        blogViews,
        linkClicks,
        jobClicks,
      },
    });

    return NextResponse.json({
      message: "Daily analytics computed and stored",
      date: dateStr,
      data: analytics,
    });
  } catch (error) {
    console.error("Error computing daily analytics:", error);
    return NextResponse.json(
      { error: "Failed to compute analytics" },
      { status: 500 }
    );
  }
}
