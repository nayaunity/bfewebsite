import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import ClaudeArchitectExam from "./_components/ClaudeArchitectExam";

export const metadata = {
  title: "Claude Architect Mock Exam | The Black Female Engineer",
  description:
    "Practice for the Claude Certified Architect exam with 48 scenario-based questions across 5 domains. Timed 90-minute mock exam with instant scoring.",
  openGraph: {
    title: "Claude Architect Mock Exam | The Black Female Engineer",
    description:
      "Practice for the Claude Certified Architect exam with 48 scenario-based questions across 5 domains.",
    url: "/resources/claude-architect-exam",
    type: "website",
    images: [{ url: "/images/bfeimage2.png", alt: "The Black Female Engineer" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Claude Architect Mock Exam | The Black Female Engineer",
    description:
      "Practice for the Claude Certified Architect exam with 48 scenario-based questions across 5 domains.",
    images: ["/images/bfeimage2.png"],
  },
};

export default function ClaudeArchitectExamPage() {
  return (
    <>
      <PagePresenceTracker page="claude-architect-exam" />
      <Navigation />
      <main className="pt-28 md:pt-32">
        {/* Hero */}
        <section
          className="py-12 md:py-16 border-b border-[var(--card-border)]"
          style={{
            background:
              "linear-gradient(to bottom, var(--hero-gradient-from), var(--background))",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-[var(--gray-600)] mb-4">
              <Link href="/resources" className="hover:text-[#ef562a]">
                Resources
              </Link>
              <span>/</span>
              <span>Claude Architect Mock Exam</span>
            </div>

            <div className="max-w-3xl">
              <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-[var(--accent-purple-bg)] text-[var(--accent-purple-text)] mb-4">
                Practice Exam
              </span>
              <h1 className="font-serif text-4xl md:text-5xl leading-tight">
                Claude Architect{" "}
                <span className="italic text-[#ef562a]">Mock Exam</span>
              </h1>
              <p className="mt-4 text-lg text-[var(--gray-600)] max-w-2xl">
                Full-length practice exam for the Claude Certified Architect
                &mdash; Foundations certification. 48 scenario-based questions,
                90-minute timer, instant domain-level scoring.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-[var(--gray-600)]">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>48 Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>90 Minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>6 Scenarios</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>5 Domains</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Exam */}
        <section className="py-8 md:py-12 bg-[var(--gray-50)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ClaudeArchitectExam />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
