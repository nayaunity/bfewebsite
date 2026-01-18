import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidPromptType, MAX_CONTENT_LENGTH } from "@/lib/micro-wins";

// GET /api/micro-wins - Fetch approved micro-wins
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const promptType = searchParams.get("promptType");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const cursor = searchParams.get("cursor");

    const where = {
      status: "approved",
      ...(promptType && isValidPromptType(promptType) && { promptType }),
    };

    const microWins = await prisma.microWin.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      select: {
        id: true,
        content: true,
        promptType: true,
        authorName: true,
        createdAt: true,
      },
    });

    const hasMore = microWins.length > limit;
    const items = hasMore ? microWins.slice(0, -1) : microWins;

    return NextResponse.json({
      microWins: items,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    });
  } catch (error) {
    console.error("Error fetching micro-wins:", error);
    return NextResponse.json(
      { error: "Failed to fetch micro-wins" },
      { status: 500 }
    );
  }
}

// POST /api/micro-wins - Create a new micro-win
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, promptType, authorName } = body;

    // Validate content
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: "Content cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Content must be ${MAX_CONTENT_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Validate promptType
    if (!promptType || !isValidPromptType(promptType)) {
      return NextResponse.json(
        { error: "Valid promptType is required" },
        { status: 400 }
      );
    }

    // Get session for optional user linking
    const session = await auth();

    const microWin = await prisma.microWin.create({
      data: {
        content: trimmedContent,
        promptType,
        authorName: authorName?.trim() || null,
        authorId: session?.user?.id || null,
        status: "approved",
      },
      select: {
        id: true,
        content: true,
        promptType: true,
        authorName: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, microWin });
  } catch (error) {
    console.error("Error creating micro-win:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create micro-win: ${message}` },
      { status: 500 }
    );
  }
}
