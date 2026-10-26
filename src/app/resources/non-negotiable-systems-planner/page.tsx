import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import DownloadButton from "./DownloadButton";

export const metadata = {
  title: "Non-Negotiable Systems Planner | The Black Female Engineer",
  description:
    "A free weekly planner for running your money, career, and lifestyle like systems instead of chaos. Track your non-negotiables, revenue, content, and habits in one place.",
  openGraph: {
    title: "Non-Negotiable Systems Planner | The Black Female Engineer",
    description:
      "A free weekly planner for running your money, career, and lifestyle like systems instead of chaos. Track your non-negotiables, revenue, content, and habits in one place.",
    url: "/resources/non-negotiable-systems-planner",
    type: "website",
    images: [
      { url: "/images/bfeimage2.png", alt: "The Black Female Engineer" },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Non-Negotiable Systems Planner | The Black Female Engineer",
    description:
      "A free weekly planner for running your money, career, and lifestyle like systems instead of chaos. Track your non-negotiables, revenue, content, and habits in one place.",
    images: ["/images/bfeimage2.png"],
  },
};

const sections = [
  {
    number: "01",
    title: "Week at a Glance",
    description:
      "Set your weekly intention, name your top 3 non-negotiables, and track a 7-day habit tracker for the routines that actually move the needle. Ends with a reflection on what to carry forward.",
  },
  {
    number: "02",
    title: "Money Systems",
    description:
      "A weekly money checklist to reconcile against your budget, log revenue by stream, track your credit score, and check in with the people who help you run your finances.",
  },
  {
    number: "03",
    title: "Career Systems",
    description:
      "Plan your content cadence, protect your learning block, and track growth across your product lines. Closes with a reflection on whether you're building toward your dream life or just staying busy.",
  },
  {
    number: "04",
    title: "Lifestyle Systems",
    description:
      "Track the staples, energy, and personal systems that keep your body and your brain running. Log your wins and ask the one question that matters: are you living your systems, or just planning them?",
  },
];

const highlights = [
  { stat: "4", label: "pages of weekly systems" },
  { stat: "3", label: "life areas: money, career, lifestyle" },
  { stat: "$0", label: "free download" },
];

export default function NonNegotiableSystemsPlannerPage() {
  return (
    <>
      <PagePresenceTracker page="non-negotiable-systems-planner" />
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
              <span>Non-Negotiable Systems Planner</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-[var(--cta-bg)] text-white mb-4">
                  Free Planner
                </span>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                  Non-Negotiable{" "}
                  <span className="italic text-[var(--accent)]">Systems</span>{" "}
                  Planner
                </h1>
                <p className="mt-4 text-lg text-[var(--gray-600)] leading-relaxed">
                  The exact weekly planner I use to run my money, career, and
                  lifestyle like systems instead of chaos. Print it, fill it
                  in every week, and build the habits that actually compound.
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
                    <span>4 pages</span>
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
                        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                      />
                    </svg>
                    <span>Weekly use</span>
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
                  Non-Negotiable
                  <br />
                  Systems Planner
                </h2>
                <p className="text-[var(--gray-600)] text-sm mt-4">
                  Money. Career. Lifestyle. One planner to run all three.
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
        <section className="bg-[var(--dark-section-bg)] py-16 md:py-20">
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
              {sections.map((section) => (
                <div
                  key={section.number}
                  className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-6 md:p-8 flex gap-6"
                >
                  <div className="font-serif text-3xl md:text-4xl text-[var(--accent)] flex-shrink-0">
                    {section.number}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl md:text-2xl">
                      {section.title}
                    </h3>
                    <p className="mt-2 text-[var(--gray-600)]">
                      {section.description}
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
                &ldquo;Am I living my systems, or just planning them?&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--dark-section-bg)] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Ready to run your week like a system?
            </h2>
            <p className="text-white/60 mb-8 text-lg">
              Download the free planner and start building the habits that
              compound.
            </p>
            <DownloadButton />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
