import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ReminderForm from "./ReminderForm";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import BackToJobs from "../BackToJobs";

export const metadata = {
  title: "JPMorgan Emerging Talent Software Engineers | The Black Female Engineer",
  description:
    "2-year software engineering program at JPMorgan Chase for career changers, bootcamp grads, and non-traditional backgrounds. $95k-$125k salary.",
};

export default function JPMorganEmergingTalent() {
  return (
    <>
      <PagePresenceTracker page="jpmorgan-emerging-talent" />
      <Navigation />
      <main className="min-h-screen pt-32 md:pt-40 pb-20 bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <BackToJobs />
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 text-sm font-medium bg-[#ef562a] text-white rounded-full">
                JPMorgan Chase
              </span>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                Now Hiring
              </span>
              <span className="px-3 py-1 text-sm font-medium bg-[#ffe500] text-black rounded-full">
                Apprenticeship
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--foreground)] mb-4">
              Emerging Talent Software Engineers
            </h1>
            <div className="flex flex-wrap gap-4 text-[var(--gray-600)]">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                North America (Multiple Locations)
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                2-Year Program
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                $95k - $125k
              </span>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Applications close February 9, 2026
            </div>
          </div>

          {/* Content */}
          <div className="space-y-10">
            {/* About */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">About the Program</h2>
              <p className="text-[var(--foreground)] leading-relaxed mb-4">
                The Emerging Talent Software Engineers program is JPMorgan Chase&apos;s entry-level, two-year
                initiative designed for early-career software engineers to build large-scale, resilient
                technology solutions while receiving comprehensive mentorship and professional development.
              </p>
              <p className="text-[var(--foreground)] leading-relaxed">
                This program welcomes candidates from <strong>nontraditional backgrounds</strong>, including
                those transitioning from other industries, re-entering the workforce, or graduates of coding
                bootcamps. Previous participants have come from education, retail, hospitality, and other sectors.
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
                  <span><strong>Career changers:</strong> You&apos;re transitioning into tech from another industry (education, retail, hospitality, etc.)</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">2</span>
                  <span><strong>Bootcamp graduates:</strong> You&apos;ve completed a coding bootcamp and are looking for your first tech role</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">3</span>
                  <span><strong>Re-entering the workforce:</strong> You&apos;re returning to work after a career break</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">4</span>
                  <span><strong>Self-taught developers:</strong> You have foundational coding skills and a passion for learning</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-[var(--gray-100)] rounded-lg">
                <p className="text-[var(--foreground)] text-sm">
                  <strong>Key requirement:</strong> Foundational coding skills, strong interest in financial services, and a willingness to learn continuously
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Comprehensive Training</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Orientation, induction training, and continuous on-the-job learning covering coding languages and professional skills
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Mentorship & Support</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Dedicated program managers and mentors to guide your technical and professional development
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Peer Community</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Join a community of fellow emerging talent engineers with social events and tech talks
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
                    Full integration into the technology organization with advancement opportunities after program completion
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
                    <h3 className="font-semibold text-[var(--foreground)]">Strengthen Your Coding Skills</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      Practice problem-solving and be comfortable with fundamentals like conditionals, loops, and data structures
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold">2</span>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Build Your Portfolio</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      Showcase your projects on GitHub and be ready to discuss your technical journey
                    </p>
                    <Link href="/resources/github-essentials" className="inline-flex items-center gap-1 text-sm text-[#ef562a] hover:underline mt-2">
                      GitHub optimization tips →
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold">3</span>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Prepare Your Story</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      Be ready to share why you&apos;re passionate about software engineering and interested in financial services
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold">4</span>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Update Your Resume</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      Highlight your transferable skills from previous careers and your technical learning journey
                    </p>
                    <Link href="/resources/resume-linkedin" className="inline-flex items-center gap-1 text-sm text-[#ef562a] hover:underline mt-2">
                      Get resume tips →
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="pt-8 border-t border-[var(--card-border)]">
              <div className="text-center">
                <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Ready to Apply?</h2>
                <p className="text-[var(--gray-600)] mb-4 max-w-2xl mx-auto">
                  This is an incredible opportunity for career changers and bootcamp graduates to break into
                  big tech at one of the world&apos;s leading financial institutions.
                </p>
                <p className="text-red-600 dark:text-red-400 font-medium mb-6">
                  Applications close February 9, 2026 - don&apos;t miss out!
                </p>
                <a
                  href="https://www.jpmorganchase.com/careers/explore-opportunities/programs/emerging-talent-software-engineers-fulltime"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#ef562a] text-white px-8 py-4 rounded-lg font-medium hover:bg-[#d94a24] transition-colors text-lg"
                >
                  Apply on JPMorgan Careers
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
