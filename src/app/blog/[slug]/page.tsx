import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { BlogViewTracker } from "@/components/BlogViewTracker";
import { getBlogPost, getAllPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: "Post Not Found | The Black Female Engineer",
    };
  }

  return {
    title: `${post.title} | The Black Female Engineer`,
    description: post.excerpt,
  };
}

// Helper to parse inline markdown (bold, italic, links, URLs)
function parseInlineMarkdown(text: string, keyPrefix: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let partIndex = 0;

  while (remaining.length > 0) {
    // Look for **bold** pattern or markdown links [text](url) or plain URLs
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    const urlMatch = remaining.match(/https?:\/\/[^\s]+/);

    // Find the earliest match
    const matches = [
      { type: 'bold', match: boldMatch, index: boldMatch?.index ?? Infinity },
      { type: 'link', match: linkMatch, index: linkMatch?.index ?? Infinity },
      { type: 'url', match: urlMatch, index: urlMatch?.index ?? Infinity },
    ].filter(m => m.match !== null).sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const earliest = matches[0];

    // Add text before the match
    if (earliest.index > 0) {
      parts.push(remaining.slice(0, earliest.index));
    }

    if (earliest.type === 'bold' && boldMatch) {
      parts.push(
        <strong key={`${keyPrefix}-b-${partIndex++}`} className="font-semibold">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(earliest.index + boldMatch[0].length);
    } else if (earliest.type === 'link' && linkMatch) {
      parts.push(
        <a
          key={`${keyPrefix}-a-${partIndex++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ef562a] hover:underline"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(earliest.index + linkMatch[0].length);
    } else if (earliest.type === 'url' && urlMatch) {
      parts.push(
        <a
          key={`${keyPrefix}-u-${partIndex++}`}
          href={urlMatch[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ef562a] hover:underline break-all"
        >
          {urlMatch[0]}
        </a>
      );
      remaining = remaining.slice(earliest.index + urlMatch[0].length);
    }
  }

  return parts.length === 1 ? parts[0] : parts;
}

function renderContent(content: string) {
  const elements: React.ReactNode[] = [];
  const lines = content.split("\n");
  let i = 0;
  let keyIndex = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle code blocks
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++; // Skip opening ```
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      elements.push(
        <pre
          key={keyIndex++}
          className="bg-[#1a1a1a] p-4 rounded-xl my-6 text-sm leading-relaxed whitespace-pre-wrap break-words"
        >
          <code className="text-gray-100">
            {codeLines.join("\n")}
          </code>
        </pre>
      );
      continue;
    }

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Handle h3 headings FIRST (more specific match)
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={keyIndex++} className="font-serif text-xl md:text-2xl mt-8 mb-3 text-[var(--foreground)]">
          {trimmed.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // Handle h2 headings
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={keyIndex++} className="font-serif text-2xl md:text-3xl mt-12 mb-4 text-[var(--foreground)]">
          {trimmed.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // Handle numbered lists
    if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <li key={keyIndex++} className="text-[var(--foreground)] ml-6 mb-2 list-decimal">
          {parseInlineMarkdown(trimmed.replace(/^\d+\.\s/, ""), `li-${keyIndex}`)}
        </li>
      );
      i++;
      continue;
    }

    // Handle bullet points
    if (trimmed.startsWith("- ")) {
      elements.push(
        <li key={keyIndex++} className="text-[var(--foreground)] ml-6 mb-2 list-disc">
          {parseInlineMarkdown(trimmed.slice(2), `li-${keyIndex}`)}
        </li>
      );
      i++;
      continue;
    }

    // Regular paragraphs with inline markdown support
    elements.push(
      <p key={keyIndex++} className="text-[var(--foreground)] mb-4 leading-relaxed">
        {parseInlineMarkdown(trimmed, `p-${keyIndex}`)}
      </p>
    );
    i++;
  }

  return elements;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  // Get related posts (same category, excluding current)
  const allPosts = await getAllPosts();
  const relatedPosts = allPosts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);

  return (
    <>
      <BlogViewTracker slug={post.slug} title={post.title} />
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Article Header */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              href="/blog"
              className="text-sm text-[var(--gray-600)] hover:text-[#ef562a] transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Blog
            </Link>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2 py-1 rounded-full bg-[#ffe500] text-black font-medium">
              {post.category}
            </span>
            <span className="text-sm text-[var(--gray-600)]">{post.readTime}</span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
            {post.title}
          </h1>

          {/* Author & Date */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-[var(--card-border)]">
            <div className="w-12 h-12 rounded-full bg-[var(--gray-200)] flex items-center justify-center">
              <span className="font-serif text-lg">{post.author.charAt(0)}</span>
            </div>
            <div>
              <p className="font-medium">{post.author}</p>
              <p className="text-sm text-[var(--gray-600)]">
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Featured Image */}
          {post.image && (
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {renderContent(post.content)}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[var(--card-border)]">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm px-3 py-1 rounded-full bg-[var(--gray-100)] text-[var(--gray-600)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div className="mt-8 pt-8 border-t border-[var(--card-border)]">
            <p className="text-sm text-[var(--gray-600)] mb-4">Share this article</p>
            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://theblackfemaleengineer.com/blog/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-[var(--card-border)] flex items-center justify-center hover:border-[#ffe500] hover:bg-[#ffe500] transition-colors group"
              >
                <svg className="w-4 h-4 text-[var(--gray-600)] group-hover:text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://theblackfemaleengineer.com/blog/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-[var(--card-border)] flex items-center justify-center hover:border-[#ffe500] hover:bg-[#ffe500] transition-colors group"
              >
                <svg className="w-4 h-4 text-[var(--gray-600)] group-hover:text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="bg-[var(--gray-50)] py-16 md:py-24 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-serif text-2xl md:text-3xl mb-8">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.slug}
                    href={`/blog/${relatedPost.slug}`}
                    className="group bg-[var(--card-bg)] rounded-2xl overflow-hidden border border-[var(--card-border)] hover:border-[#ffe500] hover:shadow-lg transition-all"
                  >
                    {relatedPost.image && (
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={relatedPost.image}
                          alt={relatedPost.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <span className="text-xs text-[var(--gray-600)]">{relatedPost.readTime}</span>
                      <h3 className="font-serif text-lg mt-2 group-hover:text-[#ef562a] transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Newsletter CTA */}
        <section className="bg-[var(--cta-bg)] py-16 md:py-24 mt-16 md:mt-24 border-t border-[var(--card-border)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl mb-4 text-[var(--cta-text)]">
              Enjoyed this article?
            </h2>
            <p className="text-[var(--cta-text-muted)] mb-8 text-lg">
              Subscribe to get new posts delivered straight to your inbox.
            </p>
            <Link
              href="#newsletter"
              className="inline-block bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
            >
              Subscribe to Newsletter
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
