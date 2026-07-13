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

  const [applications, total, stats, plannedApplications, pendingReviewCount] = await Promise.all([
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
    prisma.browseDiscovery.findMany({
      where: {
        session: { userId: session.user.id },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reviewTask: {
          select: {
            id: true,
            status: true,
            reason: true,
          },
        },
      },
    }),
    prisma.reviewTask.count({
      where: {
        userId: session.user.id,
        status: "pending",
      },
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
    plannedApplications: plannedApplications.map((item) => ({
      id: item.id,
      company: item.company,
      jobTitle: item.jobTitle,
      applyUrl: item.applyUrl,
      status: item.userActionRequired ? "review" : item.status,
      errorMessage: item.errorMessage,
      createdAt: item.createdAt,
      atsType: item.atsType,
      confidenceBucket: item.confidenceBucket,
      confidenceScore: item.confidenceScore,
      matchScore: item.matchScore,
      matchReason: item.matchReason,
      userActionRequired: item.userActionRequired,
      personalizedWritingRequired: item.personalizedWritingRequired,
      reviewTask: item.reviewTask,
    })),
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
      pendingReview: pendingReviewCount,
    },
  });
}
