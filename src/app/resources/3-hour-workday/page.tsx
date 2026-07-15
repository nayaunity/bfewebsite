import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import DownloadButton from "./DownloadButton";

export const metadata = {
  title: "The 3-Hour Workday Ebook | The Black Female Engineer",
  description:
    "A step-by-step guide to using AI to reclaim your time. Learn the 5-phase system to automate low-value work and design a 3-hour active workday.",
  openGraph: {
    title: "The 3-Hour Workday Ebook | The Black Female Engineer",
    description:
      "A step-by-step guide to using AI to reclaim your time. Learn the 5-phase system to automate low-value work and design a 3-hour active workday.",
    url: "/resources/3-hour-workday",
    type: "website",
    images: [
      { url: "/images/bfeimage2.png", alt: "The Black Female Engineer" },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "The 3-Hour Workday Ebook | The Black Female Engineer",
    description:
      "A step-by-step guide to using AI to reclaim your time. Learn the 5-phase system to automate low-value work and design a 3-hour active workday.",
    images: ["/images/bfeimage2.png"],
  },
};

const phases = [
  {
    number: "01",
    title: "The Time Audit",
    description:
      "Track where your time actually goes, then sort every task into three buckets: AI Can Do Alone, AI + You Together, and Only You.",
  },
  {
    number: "02",
    title: "Build Your AI Stack",
    description:
      "The 5 core tools that save the most time. Claude, Zapier, Notion AI, meeting tools, and AI scheduling.",
  },
  {
    number: "03",
    title: "Automate the Big Time-Drains",
    description:
      "Step-by-step workflows for inbox, meetings, reports, research, and Zapier automations. Save 3+ hours per day.",
  },
  {
    number: "04",
    title: "Design Your 3-Hour Workday",
    description:
      "The protected schedule that compresses your active work into 3-3.5 hours. Everything else runs on automated systems.",
  },
  {
    number: "05",
    title: "Build Your AI Second Brain",
    description:
      "Set up Notion + AI to auto-categorize, file, and surface your knowledge. An operating system that maintains itself.",
  },
];

const highlights = [
  { stat: "60-70%", label: "of work tasks can be automated with AI" },
  { stat: "3 hrs", label: "of active work per day with the right systems" },
  { stat: "5+", label: "hours saved per week by AI power users" },
];

export default function ThreeHourWorkdayPage() {
  return (
    <>
      <PagePresenceTracker page="3-hour-workday" />
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero */}
        <section className="pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-[var(--gray-600)] mb-6">
              <Link href="/resources" className="hover:text-[var(--accent)]">
                Resources
              </Link>
              <span>/</span>
              <span>The 3-Hour Workday</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-[#4d1b27] text-white mb-4">
                  Free Ebook
                </span>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                  The 3-Hour{" "}
                  <span className="italic text-[var(--accent)]">Workday</span>
                </h1>
                <p className="mt-4 text-lg text-[var(--gray-600)] leading-relaxed">
                  A step-by-step guide to using AI to reclaim your time. Learn
                  the 5-phase system to audit your work, build your AI stack,
                  and compress your active workday into 3 focused hours.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[var(--gray-600)]">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <span>14 pages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>10 min read</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span>PDF download</span>
                  </div>
                </div>

                <div className="mt-8">
                  <DownloadButton />
                </div>
              </div>

              {/* Preview card */}
              <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-8 md:p-12">
                <div className="border-b-2 border-[var(--accent)] w-12 mb-6"></div>
                <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-2">
                  The 3-Hour
                  <br />
                  Workday
                </h2>
                <p className="text-[var(--gray-600)] text-sm mt-4">
                  A Step-by-Step Guide to Using AI to Reclaim Your Time
                </p>
                <div className="border-b-2 border-[var(--accent)] w-12 mt-6"></div>
                <p className="mt-8 text-xs tracking-widest text-[var(--gray-600)]">
                  THE BLACK FEMALE ENGINEER
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-[#2a2828] py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-8 text-center">
              {highlights.map((item, i) => (
                <div key={i}>
                  <div className="font-serif text-3xl md:text-5xl text-white">
                    {item.stat}
                  </div>
                  <p className="mt-2 text-white/60 text-sm">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Inside */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl">
                <span className="italic">what&apos;s</span> INSIDE
              </h2>
            </div>

            <div className="space-y-8">
              {phases.map((phase) => (
                <div
                  key={phase.number}
                  className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-6 md:p-8 flex gap-6"
                >
                  <div className="font-serif text-3xl md:text-4xl text-[var(--accent)] flex-shrink-0">
                    {phase.number}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl md:text-2xl">
                      {phase.title}
                    </h3>
                    <p className="mt-2 text-[var(--gray-600)]">
                      {phase.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Insight */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="border-l-2 border-[var(--accent)] pl-6 text-left">
              <p className="font-serif italic text-xl md:text-2xl text-[var(--foreground)]">
                &ldquo;The strategy: ruthlessly identify what you do, hand the
                low-value work to AI, and protect your remaining time for
                thinking that only you can do.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#2a2828] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Ready to reclaim your time?
            </h2>
            <p className="text-white/60 mb-8 text-lg">
              Download the free ebook and start building your 3-hour workday
              today.
            </p>
            <DownloadButton />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
