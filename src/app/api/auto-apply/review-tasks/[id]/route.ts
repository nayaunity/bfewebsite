import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function syncSessionAndRun(sessionId: string, planningRunId: string | null) {
  const [pendingReviewCount, readyToSubmitCount, activeProcessing] = await Promise.all([
    prisma.reviewTask.count({
      where: { sessionId, status: "pending" },
    }),
    prisma.browseDiscovery.count({
      where: { sessionId, graphStatus: "ready_to_submit" },
    }),
    prisma.browseSession.findUnique({
      where: { id: sessionId },
      select: { status: true },
    }),
  ]);

  const sessionStatus =
    activeProcessing?.status === "processing"
      ? "processing"
      : readyToSubmitCount > 0
        ? "queued"
        : pendingReviewCount > 0
          ? "awaiting_review"
          : "completed";

  await prisma.browseSession.update({
    where: { id: sessionId },
    data: {
      status: sessionStatus,
      completedAt: sessionStatus === "completed" ? new Date() : null,
    },
  });

  if (planningRunId) {
    const skippedCount = await prisma.browseDiscovery.count({
      where: { sessionId, planningDecision: "skip" },
    });
    await prisma.planningRun.update({
      where: { id: planningRunId },
      data: {
        pendingReviewCount,
        autoSubmitCount: readyToSubmitCount,
        skippedCount,
      },
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action as "approve" | "reject" | undefined;
  const editedDraft =
    typeof body.editedDraft === "string" ? body.editedDraft.trim() : "";
  const reviewerNotes =
    typeof body.reviewerNotes === "string" ? body.reviewerNotes.trim() : "";

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const task = await prisma.reviewTask.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      discovery: true,
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Review task not found" }, { status: 404 });
  }

  const planPayload = (() => {
    try {
      return JSON.parse(task.discovery.planPayload || "{}") as {
        customWritingFormat?: "text" | "json";
      };
    } catch {
      return {} as { customWritingFormat?: "text" | "json" };
    }
  })();

  if (action === "approve") {
    const finalDraft = editedDraft || task.editedDraft || task.draft || "";

    await prisma.$transaction([
      prisma.reviewTask.update({
        where: { id: task.id },
        data: {
          status: "approved",
          editedDraft: finalDraft || null,
          reviewerNotes: reviewerNotes || null,
          approvedAt: new Date(),
          reviewedAt: new Date(),
        },
      }),
      prisma.browseDiscovery.update({
        where: { id: task.discoveryId },
        data: {
          graphStatus: "ready_to_submit",
          planningDecision: "auto_submit",
          userActionRequired: false,
          customWritingFinal: finalDraft || null,
          customWritingEditedAt: finalDraft ? new Date() : null,
          customWritingApprovedAt: new Date(),
          reviewedAt: new Date(),
          errorMessage: null,
          status: "found",
          planPayload: JSON.stringify({
            ...(planPayload || {}),
            customWritingFormat: planPayload.customWritingFormat || "text",
          }),
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.reviewTask.update({
        where: { id: task.id },
        data: {
          status: "rejected",
          reviewerNotes: reviewerNotes || null,
          rejectedAt: new Date(),
          reviewedAt: new Date(),
        },
      }),
      prisma.browseDiscovery.update({
        where: { id: task.discoveryId },
        data: {
          graphStatus: "skipped",
          planningDecision: "skip",
          userActionRequired: false,
          reviewedAt: new Date(),
          status: "skipped",
          errorMessage:
            reviewerNotes ||
            task.reason ||
            "Skipped during user review",
        },
      }),
    ]);
  }

  await syncSessionAndRun(task.sessionId, task.planningRunId);

  return NextResponse.json({
    success: true,
    taskId: task.id,
    action,
  });
}
