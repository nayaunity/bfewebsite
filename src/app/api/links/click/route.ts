import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { linkId, linkTitle, linkUrl } = data;

    if (!linkId || !linkTitle || !linkUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log the click
    await prisma.linkClick.create({
      data: {
        linkId,
        linkTitle,
        linkUrl,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging link click:", error);
    return NextResponse.json(
      { error: "Failed to log click" },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving click statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const linkId = searchParams.get("linkId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: {
      linkId?: string;
      clickedAt?: { gte?: Date; lte?: Date };
    } = {};

    if (linkId) {
      where.linkId = linkId;
    }

    if (startDate || endDate) {
      where.clickedAt = {};
      if (startDate) {
        where.clickedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.clickedAt.lte = new Date(endDate);
      }
    }

    // Get total clicks
    const totalClicks = await prisma.linkClick.count({ where });

    // Get clicks by link
    const clicksByLink = await prisma.linkClick.groupBy({
      by: ["linkId", "linkTitle"],
      _count: { id: true },
      where,
      orderBy: { _count: { id: "desc" } },
    });

    // Get recent clicks (last 100)
    const recentClicks = await prisma.linkClick.findMany({
      where,
      orderBy: { clickedAt: "desc" },
      take: 100,
      select: {
        id: true,
        linkTitle: true,
        linkUrl: true,
        clickedAt: true,
      },
    });

    return NextResponse.json({
      totalClicks,
      clicksByLink: clicksByLink.map((c) => ({
        linkId: c.linkId,
        linkTitle: c.linkTitle,
        clicks: c._count.id,
      })),
      recentClicks,
    });
  } catch (error) {
    console.error("Error fetching link click stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch click statistics" },
      { status: 500 }
    );
  }
}
