import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const statusFilter = searchParams.get("status");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (statusFilter) {
    where.status = statusFilter;
  }

  const [applications, total, stats] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: true,
    }),
  ]);

  const statusCounts = stats.reduce(
    (acc, s) => {
      acc[s.status] = s._count;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      submitted: statusCounts.submitted || 0,
      skipped: statusCounts.skipped || 0,
      failed: statusCounts.failed || 0,
      pending: statusCounts.pending || 0,
    },
  });
}
