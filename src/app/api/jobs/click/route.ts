import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { jobId, company, companySlug, jobTitle, applyUrl } = data;

    if (!jobId || !company || !companySlug || !jobTitle || !applyUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log the click
    await prisma.jobClick.create({
      data: {
        jobId,
        company,
        companySlug,
        jobTitle,
        applyUrl,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging job click:", error);
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
    const companySlug = searchParams.get("company");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: {
      companySlug?: string;
      clickedAt?: { gte?: Date; lte?: Date };
    } = {};

    if (companySlug) {
      where.companySlug = companySlug;
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
    const totalClicks = await prisma.jobClick.count({ where });

    // Get clicks by company
    const clicksByCompany = await prisma.jobClick.groupBy({
      by: ["company", "companySlug"],
      _count: { id: true },
      where,
      orderBy: { _count: { id: "desc" } },
    });

    // Get recent clicks (last 100)
    const recentClicks = await prisma.jobClick.findMany({
      where,
      orderBy: { clickedAt: "desc" },
      take: 100,
      select: {
        id: true,
        company: true,
        jobTitle: true,
        clickedAt: true,
      },
    });

    return NextResponse.json({
      totalClicks,
      clicksByCompany: clicksByCompany.map((c) => ({
        company: c.company,
        companySlug: c.companySlug,
        clicks: c._count.id,
      })),
      recentClicks,
    });
  } catch (error) {
    console.error("Error fetching click stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch click statistics" },
      { status: 500 }
    );
  }
}
