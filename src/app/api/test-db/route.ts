import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Try to count blog posts
    const count = await prisma.blogPost.count();

    // Try to get first post
    const firstPost = await prisma.blogPost.findFirst({
      select: {
        slug: true,
        title: true,
        publishedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      count,
      firstPost,
      publishedAtType: firstPost ? typeof firstPost.publishedAt : null,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        error: "Database test failed",
        details: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
