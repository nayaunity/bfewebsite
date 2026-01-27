import { NextResponse } from "next/server";
import { createBlogPost, updateBlogPost, deleteBlogPost, getBlogPost } from "@/lib/blog";
import { checkAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  const { isAdmin } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { title, slug, excerpt, category, author, featured, image, tags, content } = data;

    if (!title || !slug || !excerpt || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await getBlogPost(slug);
    if (existing) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      );
    }

    await createBlogPost({
      slug,
      title,
      excerpt,
      content,
      author: author || "Nyaradzo",
      category: category || "Career",
      tags: tags || [],
      featured: featured || false,
      image: image || undefined,
    });

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("Failed to create blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { isAdmin } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { originalSlug, title, slug, excerpt, category, author, featured, image, tags, content, publishedAt } = data;

    if (!title || !slug || !excerpt || !content || !originalSlug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if original post exists
    const originalPost = await getBlogPost(originalSlug);
    if (!originalPost) {
      return NextResponse.json(
        { error: "Original post not found" },
        { status: 404 }
      );
    }

    // If slug changed, check new slug doesn't exist
    if (originalSlug !== slug) {
      const existingWithNewSlug = await getBlogPost(slug);
      if (existingWithNewSlug) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 400 }
        );
      }
    }

    await updateBlogPost(originalSlug, {
      slug,
      title,
      excerpt,
      content,
      author: author || "Nyaradzo",
      category: category || "Career",
      tags: tags || [],
      featured: featured || false,
      image: image || null,
      publishedAt,
    });

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("Failed to update blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { isAdmin } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Missing slug" },
        { status: 400 }
      );
    }

    const post = await getBlogPost(slug);
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    await deleteBlogPost(slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
