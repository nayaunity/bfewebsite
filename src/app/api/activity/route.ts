import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/activity - Fetch recent activity for the feed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    // Get recent activities from the Activity table
    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        message: true,
        metadata: true,
        createdAt: true,
      },
    });

    // Get presence counts for different pages
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const presenceCounts = await prisma.pagePresence.groupBy({
      by: ["page"],
      where: {
        lastSeenAt: { gte: fiveMinutesAgo },
      },
      _count: { visitorId: true },
    });

    // Convert to a map
    const presenceMap: Record<string, number> = {};
    presenceCounts.forEach((p) => {
      presenceMap[p.page] = p._count.visitorId;
    });

    // Get presence counts by country
    const countryCounts = await prisma.pagePresence.groupBy({
      by: ["country"],
      where: {
        lastSeenAt: { gte: fiveMinutesAgo },
        country: { not: null },
      },
      _count: { visitorId: true },
    });

    // Convert to location map
    const locationMap: Record<string, number> = {};
    countryCounts.forEach((c) => {
      if (c.country) {
        locationMap[c.country] = c._count.visitorId;
      }
    });

    // Get recent completions count (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCompletions = await prisma.lessonProgress.count({
      where: {
        completed: true,
        completedAt: { gte: oneDayAgo },
      },
    });

    // Get recent micro-wins count (last 24 hours)
    const recentMicroWins = await prisma.microWin.count({
      where: {
        status: "approved",
        createdAt: { gte: oneDayAgo },
      },
    });

    // Get recent job clicks (last 24 hours)
    const recentJobClicks = await prisma.jobClick.count({
      where: {
        clickedAt: { gte: oneDayAgo },
      },
    });

    // Get recent link clicks (last 24 hours)
    const recentLinkClicks = await prisma.linkClick.count({
      where: {
        clickedAt: { gte: oneDayAgo },
      },
    });

    return NextResponse.json({
      activities,
      presence: {
        home: presenceMap["home"] || 0,
        jobs: presenceMap["jobs"] || 0,
        resources: presenceMap["resources"] || 0,
        community: presenceMap["community"] || 0,
        blog: presenceMap["blog"] || 0,
        links: presenceMap["links"] || 0,
        total: Object.values(presenceMap).reduce((a, b) => a + b, 0),
      },
      locations: locationMap,
      stats: {
        completionsToday: recentCompletions,
        microWinsToday: recentMicroWins,
        jobClicksToday: recentJobClicks,
        linkClicksToday: recentLinkClicks,
      },
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

// POST /api/activity - Record a new activity event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, metadata } = body;

    if (!type || !message) {
      return NextResponse.json(
        { error: "type and message are required" },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
