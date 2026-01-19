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
  image?: string;
}

export const blogPosts: BlogPost[] = [
  // Add your blog posts here
  // Example:
  // {
  //   slug: "my-first-post",
  //   title: "My First Blog Post",
  //   excerpt: "A brief introduction to what this post is about...",
  //   content: `
  //     Your full blog post content goes here.
  //     You can use markdown-style formatting.
  //
  //     ## Subheading
  //
  //     More content...
  //   `,
  //   author: "Nyaradzo",
  //   publishedAt: "2026-01-19",
  //   readTime: "5 min read",
  //   category: "Career",
  //   tags: ["tech", "career", "advice"],
  //   featured: true,
  //   image: "/images/blog/my-first-post.jpg",
  // },
];

export const blogCategories = [
  "All",
  "Tech",
  "Career",
  "Coding",
  "Finance",
  "Life",
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter((post) => post.featured);
}

export function getPostsByCategory(category: string): BlogPost[] {
  if (category === "All") return blogPosts;
  return blogPosts.filter((post) => post.category === category);
}
