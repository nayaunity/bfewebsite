import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Allowed page names for presence tracking
const ALLOWED_PAGES = ["home", "jobs", "resources", "community", "blog", "links"];

// POST /api/presence - Update presence (heartbeat)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, page } = body;

    if (!visitorId || !page) {
      return NextResponse.json(
        { error: "visitorId and page are required" },
        { status: 400 }
      );
    }

    // Validate and sanitize inputs
    const sanitizedVisitorId = String(visitorId).slice(0, 100);
    const sanitizedPage = String(page).slice(0, 100);

    // Validate page is allowed (allow exact matches or blog/* patterns)
    const isValidPage = ALLOWED_PAGES.includes(sanitizedPage) || sanitizedPage.startsWith("blog/");
    if (!isValidPage) {
      return NextResponse.json(
        { error: "Invalid page" },
        { status: 400 }
      );
    }

    // Get country from Vercel geo headers
    const country = request.headers.get("x-vercel-ip-country") || null;

    // Upsert the presence record
    await prisma.pagePresence.upsert({
      where: {
        visitorId_page: { visitorId: sanitizedVisitorId, page: sanitizedPage },
      },
      update: {
        lastSeenAt: new Date(),
        country,
      },
      create: {
        visitorId: sanitizedVisitorId,
        page: sanitizedPage,
        country,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating presence:", error);
    return NextResponse.json(
      { error: "Failed to update presence" },
      { status: 500 }
    );
  }
}

// DELETE /api/presence - Remove presence when leaving page
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, page } = body;

    if (!visitorId) {
      return NextResponse.json(
        { error: "visitorId is required" },
        { status: 400 }
      );
    }

    if (page) {
      // Remove presence for specific page
      await prisma.pagePresence.deleteMany({
        where: { visitorId, page },
      });
    } else {
      // Remove all presence for this visitor
      await prisma.pagePresence.deleteMany({
        where: { visitorId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing presence:", error);
    return NextResponse.json(
      { error: "Failed to remove presence" },
      { status: 500 }
    );
  }
}

// GET /api/presence - Get presence counts
export async function GET() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // NOTE: We no longer delete old records here to preserve historical analytics data
    // The query below already filters for active users (last 5 minutes)

    // Get counts by page (only active users)
    const presenceCounts = await prisma.pagePresence.groupBy({
      by: ["page"],
      where: {
        lastSeenAt: { gte: fiveMinutesAgo },
      },
      _count: { visitorId: true },
    });

    const presence: Record<string, number> = {};
    presenceCounts.forEach((p) => {
      presence[p.page] = p._count.visitorId;
    });

    return NextResponse.json({
      presence,
      total: Object.values(presence).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    console.error("Error fetching presence:", error);
    return NextResponse.json(
      { error: "Failed to fetch presence" },
      { status: 500 }
    );
  }
}
