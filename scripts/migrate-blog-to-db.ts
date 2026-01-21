import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const prisma = new PrismaClient();

const BLOG_DIR = path.join(process.cwd(), "content/blog");

async function migrateBlogPosts() {
  console.log("Starting blog migration to database...\n");

  // Check if blog directory exists
  if (!fs.existsSync(BLOG_DIR)) {
    console.log("No blog directory found. Nothing to migrate.");
    return;
  }

  // Get all markdown files
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} blog posts to migrate.\n`);

  let migrated = 0;
  let skipped = 0;

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const filePath = path.join(BLOG_DIR, file);

    // Check if post already exists in database
    const existing = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (existing) {
      console.log(`  Skipping "${slug}" - already exists in database`);
      skipped++;
      continue;
    }

    // Read and parse markdown file
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    // Parse publishedAt date
    let publishedAt = new Date();
    if (data.publishedAt) {
      publishedAt = new Date(data.publishedAt);
    } else if (data.date) {
      publishedAt = new Date(data.date);
    }

    // Insert into database
    await prisma.blogPost.create({
      data: {
        slug,
        title: data.title || slug,
        excerpt: data.excerpt || "",
        content: content.trim(),
        author: data.author || "Nyaradzo",
        category: data.category || "Career",
        tags: JSON.stringify(data.tags || []),
        featured: data.featured || false,
        image: data.image || null,
        publishedAt,
      },
    });

    console.log(`  Migrated "${slug}"`);
    migrated++;
  }

  console.log(`\nMigration complete!`);
  console.log(`  - Migrated: ${migrated}`);
  console.log(`  - Skipped: ${skipped}`);
}

migrateBlogPosts()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
