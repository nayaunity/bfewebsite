import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const company = searchParams.get("company");
    const remote = searchParams.get("remote");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    // Build where clause with search support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
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

    // Fuzzy search on title, company, location, and tags
    // Note: SQLite LIKE is case-insensitive by default for ASCII
    // Supports comma-separated terms for OR search
    if (search && search.trim()) {
      const searchTerms = search.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);

      if (searchTerms.length === 1) {
        // Single term search
        where.OR = [
          { title: { contains: searchTerms[0] } },
          { company: { contains: searchTerms[0] } },
          { location: { contains: searchTerms[0] } },
          { tags: { contains: searchTerms[0] } },
        ];
      } else {
        // Multiple terms - OR across all terms
        where.OR = searchTerms.flatMap(term => [
          { title: { contains: term } },
          { company: { contains: term } },
          { location: { contains: term } },
          { tags: { contains: term } },
        ]);
      }
    }

    // Get total count for pagination
    const total = await prisma.job.count({ where });

    // Get jobs - fetch more than needed to allow for US prioritization sorting
    const allJobs = await prisma.job.findMany({
      where,
      orderBy: [{ postedAt: "desc" }, { scrapedAt: "desc" }],
    });

    // Sort to prioritize US jobs first, then by date within each group
    const sortedJobs = allJobs.sort((a, b) => {
      const aIsUS = isUSLocation(a.location);
      const bIsUS = isUSLocation(b.location);

      // If one is US and the other isn't, US comes first
      if (aIsUS && !bIsUS) return -1;
      if (!aIsUS && bIsUS) return 1;

      // Within the same group, sort by date (most recent first)
      const aDate = a.postedAt || a.scrapedAt;
      const bDate = b.postedAt || b.scrapedAt;
      return bDate.getTime() - aDate.getTime();
    });

    // Apply pagination after sorting
    const jobs = sortedJobs.slice(offset, offset + limit);

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

    return NextResponse.json(
      {
        jobs: transformedJobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + jobs.length < total,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching jobs:", error);
    const dbUrl = process.env.DATABASE_URL || "";
    return NextResponse.json(
      {
        error: "Failed to fetch jobs",
        detail: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split("\n").slice(0, 3) : undefined,
        dbUrl: dbUrl.substring(0, 35) + "...",
        dbUrlLen: dbUrl.length,
        hasAuthToken: !!process.env.DATABASE_AUTH_TOKEN,
        authTokenLen: process.env.DATABASE_AUTH_TOKEN?.length || 0,
      },
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

// US state abbreviations
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

function isUSLocation(location: string): boolean {
  const loc = location.toUpperCase();

  // Check for explicit US indicators
  if (loc.includes("UNITED STATES") || loc.includes(", USA") || loc.includes(", US")) {
    return true;
  }

  // Check for US state abbreviations (e.g., "San Francisco, CA" or "Remote, CA")
  for (const state of US_STATES) {
    // Match patterns like ", CA" or ", CA " or ending with ", CA"
    if (loc.includes(`, ${state}`) || loc.endsWith(` ${state}`)) {
      return true;
    }
  }

  // Check for "Remote" without specific country (assume US)
  if (loc === "REMOTE" || loc === "REMOTE, US" || loc === "US REMOTE" || loc === "REMOTE - US") {
    return true;
  }

  return false;
}
