import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Contact Me | The Black Female Engineer",
  description: "Get in touch with The Black Female Engineer. I'd love to hear from you.",
};

export default function ContactPage() {
  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero */}
        <section className="bg-[var(--background)] pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                Get in <span className="italic text-[#ef562a]">touch</span>
              </h1>
              <p className="mt-6 text-xl text-[var(--gray-600)]">
                Have a question, collaboration idea, or just want to say hello? I&apos;d love to hear from you.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20">
              {/* Email Contact */}
              <div className="bg-[var(--card-bg)] p-8 md:p-12 rounded-2xl border border-[var(--card-border)]">
                <div className="w-16 h-16 rounded-full bg-[#ffe500] flex items-center justify-center mb-8">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl mb-4">Email Me</h2>
                <p className="text-[var(--gray-600)] mb-6">
                  For general inquiries, questions, or to start a conversation, reach out via email.
                </p>
                <a
                  href="mailto:hello@bfepartnerships.com"
                  className="inline-flex items-center gap-2 text-[#ef562a] hover:underline text-lg font-medium"
                >
                  hello@bfepartnerships.com
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>

              {/* Partnership */}
              <div className="bg-[var(--card-bg)] p-8 md:p-12 rounded-2xl border border-[var(--card-border)]">
                <div className="w-16 h-16 rounded-full bg-[#ef562a] flex items-center justify-center mb-8">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl mb-4">Partner With Me</h2>
                <p className="text-[var(--gray-600)] mb-6">
                  Interested in collaborating, sponsorships, or business opportunities? Check out my partnership page.
                </p>
                <Link
                  href="/work-with-us"
                  className="inline-flex items-center gap-2 text-[#ef562a] hover:underline text-lg font-medium"
                >
                  View Partnership Options
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Social */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              Connect on <span className="italic">social</span>
            </h2>
            <p className="text-[var(--gray-600)] mb-8 text-lg">
              Follow along for daily tips, behind-the-scenes content, and community updates.
            </p>
            <div className="flex justify-center gap-4">
              <a href="https://instagram.com/theblackfemaleengineer" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full border border-[var(--card-border)] flex items-center justify-center hover:border-[#ffe500] hover:bg-[#ffe500] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://linkedin.com/in/theblackfemaleengineer" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full border border-[var(--card-border)] flex items-center justify-center hover:border-[#ffe500] hover:bg-[#ffe500] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="https://youtube.com/@theblackfemaleengineer" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full border border-[var(--card-border)] flex items-center justify-center hover:border-[#ffe500] hover:bg-[#ffe500] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://tiktok.com/@theblackfemaleengineer" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full border border-[var(--card-border)] flex items-center justify-center hover:border-[#ffe500] hover:bg-[#ffe500] transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--cta-bg)] py-16 md:py-24 border-t border-[var(--card-border)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4 text-[var(--cta-text)]">
              Join the community
            </h2>
            <p className="text-[var(--cta-text-muted)] mb-8 text-lg">
              Get the tools and inspiration to make your impact in tech.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/community"
                className="bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
              >
                Join the Community
              </Link>
              <Link
                href="/resources"
                className="bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--card-border)] px-8 py-4 rounded-full font-medium hover:border-[#ffe500] transition-colors"
              >
                Explore Resources
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
