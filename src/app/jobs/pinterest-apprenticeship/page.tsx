import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ReminderForm from "./ReminderForm";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";

export const metadata = {
  title: "Pinterest Apprenticeship Program | The Black Female Engineer",
  description:
    "Pinterest Apprenticeship Program for career changers and non-traditional backgrounds. Applications expected to open soon.",
};

export default function PinterestApprenticeship() {
  return (
    <>
      <PagePresenceTracker page="pinterest-apprenticeship" />
      <Navigation />
      <main className="min-h-screen pt-32 md:pt-40 pb-20 bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              href="/jobs"
              className="text-sm text-[var(--gray-600)] hover:text-[#ef562a] transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Jobs
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 text-sm font-medium bg-[#ef562a] text-white rounded-full">
                Pinterest
              </span>
              <span className="px-3 py-1 text-sm font-medium bg-[#ffe500] text-black rounded-full">
                Applications Opening Soon
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--foreground)] mb-4">
              Pinterest Apprentice Engineer
            </h1>
            <div className="flex flex-wrap gap-4 text-[var(--gray-600)]">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                San Francisco, CA / Remote
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Apprenticeship
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-10">
            {/* About */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">About the Program</h2>
              <p className="text-[var(--foreground)] leading-relaxed">
                The Pinterest Apprenticeship Program is designed for individuals from non-traditional
                backgrounds, career changers, and those with limited formal experience in tech. This is
                your chance to break into the tech industry at a global, innovative company while
                contributing to Pinterest&apos;s mission of inspiring creativity and sharing ideas.
              </p>
            </section>

            {/* Reminder Signup */}
            <ReminderForm />

            {/* Who Should Apply */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Who Should Apply</h2>
              <p className="text-[var(--foreground)] mb-4">This program is ideal for:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">1</span>
                  <span><strong>Non-traditional backgrounds:</strong> You don&apos;t have a CS degree but have been building your skills</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">2</span>
                  <span><strong>Career changers:</strong> You&apos;re transitioning into tech from another field</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">3</span>
                  <span><strong>Limited formal experience:</strong> You have potential but need the opportunity to prove yourself</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-[var(--gray-100)] rounded-lg">
                <p className="text-[var(--foreground)] text-sm">
                  <strong>Ideal candidates:</strong> Bootcamp graduates, self-taught developers, and those passionate about learning
                </p>
              </div>
            </section>

            {/* What You'll Get */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">What You&apos;ll Get</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Hands-On Training</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Learn by doing with practical training on real Pinterest systems and technologies
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Mentorship</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Get guidance from experienced Pinterest engineers to accelerate your growth
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Real-World Projects</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Work on actual Pinterest features used by millions of people worldwide
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Career Growth</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Gain skills and experience to propel your tech career forward
                  </p>
                </div>
              </div>
            </section>

            {/* How to Prepare */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">How to Prepare</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold">1</span>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Update Your Resume</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      Showcase your tech projects, skills, and highlight your non-traditional journey
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold">2</span>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Build Your GitHub Portfolio</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      Make sure your GitHub is public and showcases your best projects
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold">3</span>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Prepare Your Story</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      Be ready to share your enthusiasm for learning and your unique journey into tech
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Application Timeline</h2>
              <div className="p-6 bg-[#ffe500]/10 border border-[#ffe500] rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#ffe500] flex items-center justify-center">
                    <span className="text-black font-bold text-xl">JAN</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)] text-lg">Applications Opening Soon</p>
                    <p className="text-[var(--gray-600)]">Previous application opening dates:</p>
                    <ul>
                      <li>March 10, 2025</li>
                      <li>January 16, 2024</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Reminder Signup */}
            <ReminderForm />

            {/* Location */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Location</h2>
              <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                <p className="text-[var(--foreground)]">
                  Roles are based at Pinterest offices in <strong>San Francisco, CA</strong> or <strong>Remote</strong> (depending on the position).
                </p>
              </div>
            </section>

            {/* CTA */}
            <section className="pt-8 border-t border-[var(--card-border)]">
              <div className="text-center">
                <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Ready to Apply?</h2>
                <p className="text-[var(--gray-600)] mb-6 max-w-2xl mx-auto">
                  This is an incredible opportunity for career changers and non-traditional candidates to
                  break into big tech. Sign up above to get notified when applications open!
                </p>
                <a
                  href="https://www.pinterestcareers.com/early-career/apprenticeships/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#ef562a] text-white px-8 py-4 rounded-lg font-medium hover:bg-[#d94a24] transition-colors text-lg"
                >
                  Visit Pinterest Careers
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
