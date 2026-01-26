import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();

  if (!session?.user?.email || session.user.email !== "theblackfemaleengineer@gmail.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const { featured } = await request.json();

    const post = await prisma.blogPost.update({
      where: { slug },
      data: { featured },
    });

    return NextResponse.json({ success: true, featured: post.featured });
  } catch (error) {
    console.error("Failed to update featured status:", error);
    return NextResponse.json(
      { error: "Failed to update featured status" },
      { status: 500 }
    );
  }
}
