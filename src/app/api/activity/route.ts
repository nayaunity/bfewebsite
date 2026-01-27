import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get start of today in Denver timezone (Mountain Time)
function getTodayStartDenver(): Date {
  const now = new Date();
  const denverTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Denver" }));
  const denverMidnight = new Date(denverTime.getFullYear(), denverTime.getMonth(), denverTime.getDate());
  const offset = denverTime.getTime() - now.getTime();
  return new Date(denverMidnight.getTime() - offset);
}

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

    // Convert to a map, aggregating blog/* pages into blog count
    const presenceMap: Record<string, number> = {};
    let blogTotal = 0;

    presenceCounts.forEach((p) => {
      // Count all blog pages (blog and blog/slug) together
      if (p.page === "blog" || p.page.startsWith("blog/")) {
        blogTotal += p._count.visitorId;
      } else {
        presenceMap[p.page] = p._count.visitorId;
      }
    });

    // Set aggregated blog count
    if (blogTotal > 0) {
      presenceMap["blog"] = blogTotal;
    }

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

    // Get today's stats (Mountain Time)
    const todayStart = getTodayStartDenver();
    const recentCompletions = await prisma.lessonProgress.count({
      where: {
        completed: true,
        completedAt: { gte: todayStart },
      },
    });

    // Get today's micro-wins (Mountain Time)
    const recentMicroWins = await prisma.microWin.count({
      where: {
        status: "approved",
        createdAt: { gte: todayStart },
      },
    });

    // Get today's job clicks (Mountain Time)
    const recentJobClicks = await prisma.jobClick.count({
      where: {
        clickedAt: { gte: todayStart },
      },
    });

    // Get today's link clicks (Mountain Time)
    const recentLinkClicks = await prisma.linkClick.count({
      where: {
        clickedAt: { gte: todayStart },
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

// Allowed activity types
const ALLOWED_ACTIVITY_TYPES = ["micro_win", "lesson_complete", "job_click", "link_click", "blog_view"];

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

    // Validate activity type
    if (!ALLOWED_ACTIVITY_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid activity type" },
        { status: 400 }
      );
    }

    // Sanitize message length
    const sanitizedMessage = String(message).slice(0, 500);

    const activity = await prisma.activity.create({
      data: {
        type,
        message: sanitizedMessage,
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
