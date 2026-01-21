import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { slug, title } = await request.json();

    if (!slug || !title) {
      return NextResponse.json(
        { error: "Missing slug or title" },
        { status: 400 }
      );
    }

    await prisma.blogView.create({
      data: {
        slug,
        title,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to track blog view:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
