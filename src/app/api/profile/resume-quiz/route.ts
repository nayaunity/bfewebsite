import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { answers } = body;

  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Merge with existing applicationAnswers (if any)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { applicationAnswers: true },
  });

  let existing: Record<string, unknown> = {};
  if (user?.applicationAnswers) {
    try {
      existing = JSON.parse(user.applicationAnswers);
    } catch {
      existing = {};
    }
  }

  const updated = {
    ...existing,
    resumeQuiz: {
      ...answers,
      submittedAt: new Date().toISOString(),
    },
  };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { applicationAnswers: JSON.stringify(updated) },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { applicationAnswers: true },
  });

  let quizData = null;
  if (user?.applicationAnswers) {
    try {
      const parsed = JSON.parse(user.applicationAnswers);
      quizData = parsed.resumeQuiz || null;
    } catch {
      quizData = null;
    }
  }

  return NextResponse.json({ quizData });
}
