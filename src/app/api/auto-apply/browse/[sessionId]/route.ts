import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const browseSession = await prisma.browseSession.findUnique({
    where: { id: sessionId },
    include: {
      discoveries: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!browseSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (browseSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ session: {
      id: browseSession.id,
      status: browseSession.status,
      targetRole: browseSession.targetRole,
      totalCompanies: browseSession.totalCompanies,
      companiesDone: browseSession.companiesDone,
      jobsFound: browseSession.jobsFound,
      jobsApplied: browseSession.jobsApplied,
      jobsSkipped: browseSession.jobsSkipped,
      jobsFailed: browseSession.jobsFailed,
      progressLog: JSON.parse(browseSession.progressLog),
      errorMessage: browseSession.errorMessage,
      createdAt: browseSession.createdAt.toISOString(),
      completedAt: browseSession.completedAt?.toISOString() || null,
    },
    discoveries: browseSession.discoveries.map((d) => ({
      id: d.id,
      company: d.company,
      jobTitle: d.jobTitle,
      applyUrl: d.applyUrl,
      status: d.status,
      errorMessage: d.errorMessage,
    })),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const browseSession = await prisma.browseSession.findUnique({
    where: { id: sessionId },
  });

  if (!browseSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (browseSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (browseSession.status !== "queued" && browseSession.status !== "processing") {
    return NextResponse.json({ error: "Session is not active" }, { status: 400 });
  }

  await prisma.browseSession.update({
    where: { id: sessionId },
    data: {
      status: "failed",
      errorMessage: "Stopped by user",
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
