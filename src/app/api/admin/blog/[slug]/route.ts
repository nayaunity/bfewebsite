import { NextResponse } from "next/server";
import { getBlogPost } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: Props) {
  try {
    const { slug } = await params;
    const post = await getBlogPost(slug);

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to get blog post:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to get blog post", details: errorMessage },
      { status: 500 }
    );
  }
}
