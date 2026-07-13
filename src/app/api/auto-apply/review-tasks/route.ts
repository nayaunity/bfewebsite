import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.reviewTask.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
    include: {
      discovery: {
        select: {
          company: true,
          jobTitle: true,
          applyUrl: true,
          atsType: true,
          confidenceBucket: true,
          confidenceScore: true,
          personalizedWritingRequired: true,
        },
      },
    },
  });

  return NextResponse.json({
    tasks: tasks.map((task) => ({
      id: task.id,
      status: task.status,
      type: task.type,
      title: task.title,
      prompt: task.prompt,
      reason: task.reason,
      requiredActions: task.requiredActions,
      draft: task.draft,
      editedDraft: task.editedDraft,
      reviewerNotes: task.reviewerNotes,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      discovery: task.discovery,
    })),
  });
}
