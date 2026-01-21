import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

// Ensure blog directory exists
if (!fs.existsSync(BLOG_DIR)) {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
}

export async function POST(request: Request) {
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
    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    if (fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      );
    }

    // Create frontmatter
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
author: "${author || "Nyaradzo"}"
publishedAt: "${new Date().toISOString().split("T")[0]}"
category: "${category || "Career"}"
tags: [${(tags || []).map((t: string) => `"${t}"`).join(", ")}]
featured: ${featured || false}
${image ? `image: "${image}"` : ""}
---

${content}`;

    // Write file
    fs.writeFileSync(filePath, frontmatter.trim());

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
  try {
    const data = await request.json();
    const { originalSlug, title, slug, excerpt, category, author, featured, image, tags, content, publishedAt } = data;

    if (!title || !slug || !excerpt || !content || !originalSlug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const originalPath = path.join(BLOG_DIR, `${originalSlug}.md`);
    const newPath = path.join(BLOG_DIR, `${slug}.md`);

    // Check if original file exists
    if (!fs.existsSync(originalPath)) {
      return NextResponse.json(
        { error: "Original post not found" },
        { status: 404 }
      );
    }

    // If slug changed, check new slug doesn't exist
    if (originalSlug !== slug && fs.existsSync(newPath)) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      );
    }

    // Create frontmatter
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
author: "${author || "Nyaradzo"}"
publishedAt: "${publishedAt || new Date().toISOString().split("T")[0]}"
category: "${category || "Career"}"
tags: [${(tags || []).map((t: string) => `"${t}"`).join(", ")}]
featured: ${featured || false}
${image ? `image: "${image}"` : ""}
---

${content}`;

    // Delete original if slug changed
    if (originalSlug !== slug) {
      fs.unlinkSync(originalPath);
    }

    // Write file
    fs.writeFileSync(newPath, frontmatter.trim());

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
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Missing slug" },
        { status: 400 }
      );
    }

    const filePath = path.join(BLOG_DIR, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
