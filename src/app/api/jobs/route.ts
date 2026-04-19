import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/admin";
import { computeRegion, hasUSLocation, hasInternationalLocation } from "@/lib/job-region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jobSelect = {
  id: true,
  company: true,
  companySlug: true,
  title: true,
  location: true,
  type: true,
  remote: true,
  salary: true,
  postedAt: true,
  scrapedAt: true,
  applyUrl: true,
  category: true,
  tags: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const company = searchParams.get("company");
    const remote = searchParams.get("remote");
    const search = searchParams.get("search");
    const region = searchParams.get("region") || "us";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true,
    };

    // Region filter at DB level
    if (region === "international") {
      where.region = { in: ["international", "both"] };
    } else {
      where.region = { in: ["us", "both"] };
    }

    if (category && category !== "All Jobs") {
      where.category = category;
    }

    if (company) {
      where.companySlug = company;
    }

    if (remote === "true") {
      where.remote = true;
    }

    if (search && search.trim()) {
      const searchTerms = search.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);

      if (searchTerms.length === 1) {
        where.OR = [
          { title: { contains: searchTerms[0] } },
          { company: { contains: searchTerms[0] } },
          { location: { contains: searchTerms[0] } },
          { tags: { contains: searchTerms[0] } },
        ];
      } else {
        where.OR = searchTerms.flatMap(term => [
          { title: { contains: term } },
          { company: { contains: term } },
          { location: { contains: term } },
          { tags: { contains: term } },
        ]);
      }
    }

    // DB-level pagination — only fetch the rows we need
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        select: jobSelect,
        orderBy: [{ postedAt: "desc" }, { scrapedAt: "desc" }],
        skip: offset,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    const transformedJobs = jobs.map((job) => {
      let parsedTags: string[] = [];
      try {
        parsedTags = JSON.parse(job.tags) as string[];
      } catch {
        parsedTags = [];
      }
      return {
        id: job.id,
        company: job.company,
        companySlug: job.companySlug,
        title: job.title,
        location: getDisplayLocation(job.location, region),
        type: job.type,
        remote: job.remote,
        salary: job.salary || "",
        posted: formatPostedDate(job.postedAt || job.scrapedAt),
        tags: parsedTags,
        href: job.applyUrl,
        category: job.category,
      };
    });

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
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { isAdmin } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
        region: computeRegion(data.location),
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
        tags: (() => { try { return JSON.parse(job.tags); } catch { return []; } })(),
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

// Extract the relevant portion of location based on region filter
function getDisplayLocation(location: string, region: string): string {
  // If it's a simple single-location, return as-is
  if (!location.includes(" or ") && !location.includes(", or ") && !location.includes("/")) {
    return location;
  }

  // Split on common multi-location separators
  const parts = location.split(/(?:,?\s+or\s+|\/)/i).map(p => p.trim());

  if (region === "us") {
    // Find the US part
    for (const part of parts) {
      if (hasUSLocation(part) && !hasInternationalLocation(part)) {
        return part;
      }
    }
  } else {
    // Find the international part
    for (const part of parts) {
      if (hasInternationalLocation(part)) {
        return part;
      }
    }
  }

  // Fallback to original
  return location;
}
