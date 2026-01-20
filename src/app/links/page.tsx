import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { socialLinks } from "@/data/links";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Links | The Black Female Engineer",
  description: "All the important links and resources from The Black Female Engineer in one place.",
};

function SocialIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "instagram":
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      );
    case "linkedin":
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      );
    case "youtube":
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    case "tiktok":
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      );
    default:
      return null;
  }
}

export default async function LinksPage() {
  const links = await prisma.link.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  const featuredLinks = links.filter((link) => link.featured);
  const otherLinks = links.filter((link) => !link.featured);

  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero */}
        <section className="pb-12 md:pb-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-4">
              All <span className="italic text-[#ef562a]">links</span>
            </h1>
            <p className="text-lg text-[var(--gray-600)]">
              Everything mentioned in my posts, all in one place.
            </p>
          </div>
        </section>

        {/* Social Links */}
        <section className="pb-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-12 h-12 rounded-full border border-[var(--card-border)] flex items-center justify-center hover:border-[#ffe500] hover:bg-[#ffe500] transition-colors"
                >
                  <SocialIcon icon={social.icon} />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Links */}
        {featuredLinks.length > 0 && (
          <section className="py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="space-y-4">
                {featuredLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={link.url}
                    className="block bg-[#ffe500] text-black p-5 rounded-2xl hover:bg-[#f5dc00] transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {link.image && (
                          <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden">
                            <Image
                              src={link.image}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-serif text-xl">{link.title}</h3>
                          {link.description && (
                            <p className="text-black/70 text-sm mt-1">{link.description}</p>
                          )}
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 flex-shrink-0 ml-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="flex justify-center py-4">
          <div className="w-px h-8 bg-[var(--card-border)]"></div>
        </div>

        {/* Other Links */}
        <section className="py-8 pb-16 md:pb-24">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-3">
              {otherLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.url}
                  className="block bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-2xl hover:border-[#ffe500] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {link.image && (
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden">
                          <Image
                            src={link.image}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="font-serif text-lg group-hover:text-[#ef562a] transition-colors">{link.title}</h3>
                        {link.description && (
                          <p className="text-[var(--gray-600)] text-sm mt-1">{link.description}</p>
                        )}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 flex-shrink-0 ml-4 text-[var(--gray-600)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--cta-bg)] py-16 md:py-24 border-t border-[var(--card-border)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl mb-4 text-[var(--cta-text)]">
              Want more resources?
            </h2>
            <p className="text-[var(--cta-text-muted)] mb-8 text-lg">
              Explore our full resource hub for guides, templates, and learning paths.
            </p>
            <Link
              href="/resources"
              className="inline-block bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
            >
              Explore All Resources
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
