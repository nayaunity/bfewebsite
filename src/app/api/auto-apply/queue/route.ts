import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canApply } from "@/lib/subscription";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [queueStats, recentQueue, usage] = await Promise.all([
    prisma.applyQueue.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: true,
    }),
    prisma.applyQueue.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        job: {
          select: { company: true, title: true, applyUrl: true },
        },
      },
    }),
    canApply(session.user.id),
  ]);

  const statusCounts = queueStats.reduce(
    (acc, s) => {
      acc[s.status] = s._count;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    queue: {
      queued: statusCounts.queued || 0,
      processing: statusCounts.processing || 0,
      completed: statusCounts.completed || 0,
      failed: statusCounts.failed || 0,
    },
    recent: recentQueue,
    usage,
  });
}
