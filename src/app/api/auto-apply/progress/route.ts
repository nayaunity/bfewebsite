import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySession = await prisma.browseSession.findFirst({
    where: {
      userId: session.user.id,
      createdAt: { gte: todayStart },
    },
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
      totalCompanies: true,
      companiesDone: true,
      jobsFound: true,
      jobsApplied: true,
      jobsSkipped: true,
      startedAt: true,
    },
  });

  if (!todaySession) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json({
    active: todaySession.status === "queued" || todaySession.status === "processing",
    status: todaySession.status,
    totalCompanies: todaySession.totalCompanies,
    companiesDone: todaySession.companiesDone,
    jobsFound: todaySession.jobsFound,
    jobsApplied: todaySession.jobsApplied,
    jobsSkipped: todaySession.jobsSkipped,
    startedAt: todaySession.startedAt?.toISOString() || null,
  });
}
