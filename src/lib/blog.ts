import { prisma } from "./prisma";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: string;
  category: string;
  tags: string[];
  featured?: boolean;
  image?: string | null;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  readTime: string;
  category: string;
  tags: string[];
  featured?: boolean;
  image?: string | null;
}

/**
 * Calculate read time based on content length
 */
function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

/**
 * Transform database record to BlogPost
 */
function transformPost(post: {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: Date | string;
  category: string;
  tags: string;
  featured: boolean;
  image: string | null;
}): BlogPost {
  // Handle publishedAt as either Date or string from Turso
  const publishedDate = post.publishedAt instanceof Date
    ? post.publishedAt
    : new Date(post.publishedAt);

  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    author: post.author,
    publishedAt: publishedDate.toISOString().split("T")[0],
    readTime: calculateReadTime(post.content),
    category: post.category,
    tags: JSON.parse(post.tags),
    featured: post.featured,
    image: post.image,
  };
}

/**
 * Get all blog post slugs
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await prisma.blogPost.findMany({
    select: { slug: true },
    orderBy: { publishedAt: "desc" },
  });
  return posts.map((p) => p.slug);
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post) {
    return null;
  }

  return transformPost(post);
}

/**
 * Get all blog posts with full content
 */
export async function getAllPosts(options?: { limit?: number; offset?: number }): Promise<BlogPost[]> {
  const { limit = 50, offset = 0 } = options || {};
  const posts = await prisma.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
    take: limit,
    skip: offset,
  });

  return posts.map(transformPost);
}

/**
 * Get all blog post metadata (without content, for listing pages)
 */
export async function getAllPostsMeta(options?: { limit?: number; offset?: number }): Promise<BlogPostMeta[]> {
  const { limit = 50, offset = 0 } = options || {};
  const posts = await prisma.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
    take: limit,
    skip: offset,
  });

  return posts.map((post) => {
    const transformed = transformPost(post);
    const { content, ...meta } = transformed;
    return meta;
  });
}

/**
 * Get featured posts
 */
export async function getFeaturedPosts(): Promise<BlogPost[]> {
  const posts = await prisma.blogPost.findMany({
    where: { featured: true },
    orderBy: { publishedAt: "desc" },
  });

  return posts.map(transformPost);
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  if (category === "All") {
    return getAllPosts();
  }

  const posts = await prisma.blogPost.findMany({
    where: { category },
    orderBy: { publishedAt: "desc" },
  });

  return posts.map(transformPost);
}

/**
 * Get all unique categories
 */
export async function getAllCategories(): Promise<string[]> {
  const posts = await prisma.blogPost.findMany({
    select: { category: true },
    distinct: ["category"],
  });

  const categories = posts.map((p) => p.category);
  return ["All", ...categories.sort()];
}

/**
 * Get all unique tags
 */
export async function getAllTags(): Promise<string[]> {
  const posts = await prisma.blogPost.findMany({
    select: { tags: true },
  });

  const allTags = new Set<string>();
  posts.forEach((post) => {
    const tags = JSON.parse(post.tags) as string[];
    tags.forEach((tag) => allTags.add(tag));
  });

  return Array.from(allTags).sort();
}

/**
 * Create a new blog post
 */
export async function createBlogPost(data: {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  image?: string;
}): Promise<BlogPost> {
  const post = await prisma.blogPost.create({
    data: {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      author: data.author || "Nyaradzo",
      category: data.category || "Career",
      tags: JSON.stringify(data.tags || []),
      featured: data.featured || false,
      image: data.image || null,
    },
  });

  return transformPost(post);
}

/**
 * Update a blog post
 */
export async function updateBlogPost(
  originalSlug: string,
  data: {
    slug?: string;
    title?: string;
    excerpt?: string;
    content?: string;
    author?: string;
    category?: string;
    tags?: string[];
    featured?: boolean;
    image?: string | null;
    publishedAt?: string;
  }
): Promise<BlogPost> {
  const updateData: Record<string, unknown> = {};

  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.author !== undefined) updateData.author = data.author;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
  if (data.featured !== undefined) updateData.featured = data.featured;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.publishedAt !== undefined) updateData.publishedAt = new Date(data.publishedAt);

  const post = await prisma.blogPost.update({
    where: { slug: originalSlug },
    data: updateData,
  });

  return transformPost(post);
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(slug: string): Promise<void> {
  await prisma.blogPost.delete({
    where: { slug },
  });
}
