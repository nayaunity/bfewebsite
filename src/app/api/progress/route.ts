import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/progress - Get user's progress for a course
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId: session.user.id,
        courseId,
      },
      select: {
        lessonSlug: true,
        completed: true,
        completedAt: true,
      },
    });

    // Transform to a map for easier client-side usage
    const progressMap = progress.reduce(
      (acc, item) => {
        acc[item.lessonSlug] = {
          completed: item.completed,
          completedAt: item.completedAt,
        };
        return acc;
      },
      {} as Record<string, { completed: boolean; completedAt: Date | null }>
    );

    return NextResponse.json({ progress: progressMap });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/progress - Update lesson progress
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, lessonSlug, completed } = body;

    if (!courseId || !lessonSlug || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "courseId, lessonSlug, and completed are required" },
        { status: 400 }
      );
    }

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_courseId_lessonSlug: {
          userId: session.user.id,
          courseId,
          lessonSlug,
        },
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
      create: {
        userId: session.user.id,
        courseId,
        lessonSlug,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
