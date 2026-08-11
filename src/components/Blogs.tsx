import Link from "next/link";
import Image from "next/image";
import { getAllPostsMeta } from "@/lib/blog";
import { ChromeStar } from "@/components/brand";

export default async function Blogs() {
  const allPosts = await getAllPostsMeta();
  // Show only featured posts on the home page
  const posts = allPosts.filter(post => post.featured).slice(0, 3);

  return (
    <section id="blog" className="bg-[var(--dark-section-bg)] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 relative">
          <h2 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl text-white">
            <span className="italic font-normal">from the</span> BLOG
          </h2>
          <ChromeStar size={56} rotate={15} className="absolute -top-4 right-1/3 hidden md:block animate-twinkle" />
          <ChromeStar size={28} rotate={-10} className="absolute top-6 right-[25%] hidden md:block animate-twinkle [animation-delay:0.7s]" />
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Insights on AI, career growth, and building income on your own terms.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="flex flex-wrap justify-center gap-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="bg-[var(--dark-card-bg)] rounded-2xl overflow-hidden hover:bg-[var(--dark-card-hover)] transition-colors group border border-white/10 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-sm"
              >
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--dark-card-hover)]">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[var(--accent)] text-sm font-medium">{post.category}</span>
                    <span className="text-white/40 text-sm">·</span>
                    <span className="text-white/40 text-sm">{post.readTime}</span>
                  </div>
                  <h3 className="font-serif text-lg text-white group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-white/50 text-sm line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-white/60">
              No blog posts yet. Check back soon!
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-block bg-[var(--cta-bg)] text-white px-8 py-4 rounded-full font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            View All Posts
          </Link>
        </div>
      </div>
    </section>
  );
}
