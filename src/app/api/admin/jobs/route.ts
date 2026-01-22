import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/admin";

// GET /api/admin/jobs - List all jobs
export async function GET(request: NextRequest) {
  const { isAdmin } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { title: { contains: search } },
          { company: { contains: search } },
          { location: { contains: search } },
        ],
      }
    : {};

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { scrapedAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  return NextResponse.json({
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/admin/jobs - Create new job
export async function POST(request: NextRequest) {
  const { isAdmin, session } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const job = await prisma.job.create({
      data: {
        externalId: body.externalId || `manual-${Date.now()}`,
        company: body.company,
        companySlug: body.companySlug || body.company.toLowerCase().replace(/\s+/g, "-"),
        title: body.title,
        location: body.location,
        type: body.type || "Full-time",
        remote: body.remote || false,
        salary: body.salary || null,
        postedAt: body.postedAt ? new Date(body.postedAt) : new Date(),
        applyUrl: body.applyUrl,
        category: body.category || "Software Engineering",
        tags: body.tags || "[]",
        source: body.source || "manual",
        isActive: body.isActive ?? true,
        createdById: session?.user?.id || null,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
