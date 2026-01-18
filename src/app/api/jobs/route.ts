import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const company = searchParams.get("company");
    const remote = searchParams.get("remote");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: {
      isActive: boolean;
      category?: string;
      companySlug?: string;
      remote?: boolean;
    } = {
      isActive: true,
    };

    if (category && category !== "All Jobs") {
      where.category = category;
    }

    if (company) {
      where.companySlug = company;
    }

    if (remote === "true") {
      where.remote = true;
    }

    // Get total count for pagination
    const total = await prisma.job.count({ where });

    // Get jobs
    const jobs = await prisma.job.findMany({
      where,
      orderBy: [{ postedAt: "desc" }, { scrapedAt: "desc" }],
      skip: offset,
      take: limit,
    });

    // Transform jobs for the frontend
    const transformedJobs = jobs.map((job) => ({
      id: job.id,
      company: job.company,
      companySlug: job.companySlug,
      title: job.title,
      location: job.location,
      type: job.type,
      remote: job.remote,
      salary: job.salary || "",
      posted: formatPostedDate(job.postedAt || job.scrapedAt),
      tags: JSON.parse(job.tags) as string[],
      href: job.applyUrl,
      category: job.category,
    }));

    return NextResponse.json({
      jobs: transformedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + jobs.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Create a new job in the database
    const job = await prisma.job.create({
      data: {
        externalId: `manual-${Date.now()}`,
        company: data.company,
        companySlug: data.company.toLowerCase().replace(/\s+/g, "-"),
        title: data.title,
        location: data.location,
        type: data.job_type || "Full-time",
        remote: data.remote === "Yes",
        salary: data.salary || null,
        applyUrl: data.job_url || "",
        category: data.category || "Software Engineering",
        tags: JSON.stringify(
          data.tags
            ? data.tags
                .split(",")
                .map((tag: string) => tag.trim())
                .filter(Boolean)
            : []
        ),
        source: "manual",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        company: job.company,
        title: job.title,
        location: job.location,
        type: job.type,
        remote: job.remote,
        salary: job.salary || "",
        posted: "Just now",
        tags: JSON.parse(job.tags),
        href: job.applyUrl,
      },
    });
  } catch (error) {
    console.error("Error adding job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add job" },
      { status: 500 }
    );
  }
}

function formatPostedDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      return "Just now";
    }
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  if (diffDays < 14) {
    return "1 week ago";
  }

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} weeks ago`;
  }

  if (diffDays < 60) {
    return "1 month ago";
  }

  const months = Math.floor(diffDays / 30);
  return `${months} months ago`;
}
