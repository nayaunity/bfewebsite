import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { blogPosts, blogCategories } from "@/data/blog";

export const metadata = {
  title: "Blog | The Black Female Engineer",
  description: "Articles on tech, coding, career growth, and finance for young professionals making their mark.",
};

export default function BlogPage() {
  const featuredPosts = blogPosts.filter((post) => post.featured);
  const recentPosts = blogPosts.slice(0, 10);

  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero */}
        <section className="bg-[var(--background)] pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                The <span className="italic text-[#ef562a]">blog</span>
              </h1>
              <p className="mt-6 text-xl text-[var(--gray-600)]">
                Thoughts on tech, career, coding, and making an impact.
              </p>
            </div>

            {/* Category filters */}
            <div className="mt-8 flex flex-wrap gap-3">
              {blogCategories.map((category) => (
                <button
                  key={category}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    category === "All"
                      ? "bg-[#ffe500] text-black"
                      : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="bg-[var(--gray-50)] py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-serif text-2xl md:text-3xl mb-8">Featured</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {featuredPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group bg-[var(--card-bg)] rounded-2xl overflow-hidden border border-[var(--card-border)] hover:border-[#ffe500] hover:shadow-lg transition-all"
                  >
                    {post.image && (
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-[#ffe500] text-black font-medium">
                          {post.category}
                        </span>
                        <span className="text-sm text-[var(--gray-600)]">{post.readTime}</span>
                      </div>
                      <h3 className="font-serif text-xl md:text-2xl group-hover:text-[#ef562a] transition-colors">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-[var(--gray-600)] line-clamp-2">{post.excerpt}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-[var(--gray-600)]">
                          {new Date(post.publishedAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <svg
                          className="w-5 h-5 text-[var(--gray-200)] group-hover:text-[#ef562a] group-hover:translate-x-1 transition-all"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Posts */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-2xl md:text-3xl mb-8">
              {featuredPosts.length > 0 ? "All Articles" : "Articles"}
            </h2>

            {recentPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--gray-100)] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl mb-2">No articles yet</h3>
                <p className="text-[var(--gray-600)]">Check back soon for new content!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {recentPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col md:flex-row gap-6 bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] hover:border-[#ffe500] hover:shadow-lg transition-all"
                  >
                    {post.image && (
                      <div className="relative w-full md:w-48 aspect-[16/9] md:aspect-square flex-shrink-0 rounded-xl overflow-hidden">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-[var(--gray-100)] text-[var(--foreground)] font-medium">
                          {post.category}
                        </span>
                        <span className="text-sm text-[var(--gray-600)]">{post.readTime}</span>
                      </div>
                      <h3 className="font-serif text-xl group-hover:text-[#ef562a] transition-colors">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-[var(--gray-600)] line-clamp-2">{post.excerpt}</p>
                      <div className="mt-3 flex items-center gap-4">
                        <span className="text-sm text-[var(--gray-600)]">
                          {new Date(post.publishedAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {post.tags.length > 0 && (
                          <div className="hidden md:flex gap-2">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs text-[var(--gray-600)]">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="hidden md:flex items-center">
                      <svg
                        className="w-6 h-6 text-[var(--gray-200)] group-hover:text-[#ef562a] group-hover:translate-x-1 transition-all"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Never miss an article
            </h2>
            <p className="text-white/60 mb-8">
              Get the latest posts on tech, career, and finance delivered straight to your inbox.
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
