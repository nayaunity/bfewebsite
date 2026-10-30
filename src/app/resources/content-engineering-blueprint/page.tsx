import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import DownloadButton from "./DownloadButton";

export const metadata = {
  title: "The Content Engineering Blueprint | The Black Female Engineer",
  description:
    "How I'm using AI, automation, and engineering principles to build a $1M/year media company. Six bots, three systems, and the exact prompts to build your own.",
  openGraph: {
    title: "The Content Engineering Blueprint | The Black Female Engineer",
    description:
      "How I'm using AI, automation, and engineering principles to build a $1M/year media company. Six bots, three systems, and the exact prompts to build your own.",
    url: "/resources/content-engineering-blueprint",
    type: "website",
    images: [
      { url: "/images/bfeimage2.png", alt: "The Black Female Engineer" },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "The Content Engineering Blueprint | The Black Female Engineer",
    description:
      "How I'm using AI, automation, and engineering principles to build a $1M/year media company. Six bots, three systems, and the exact prompts to build your own.",
    images: ["/images/bfeimage2.png"],
  },
};

const chapters = [
  {
    number: "01",
    label: "THE SHIFT",
    title: "From content creator to content engineer",
    description:
      "A content creator makes every piece by hand. A content engineer builds the system that makes the pieces. The 5-stage operating system behind the content, from research to revenue, and the three engineering rules borrowed to run it.",
  },
  {
    number: "02",
    label: "SYSTEM 1",
    title: "The AI content strategist",
    description:
      "Each month the strategist answers one question: what should I make next? Feed it your last 60 days of posts and proven creators in your niche, and get back ranked ideas instead of guesses.",
  },
  {
    number: "03",
    label: "SYSTEM 2",
    title: "The AI hook and idea generator",
    description:
      "Your best material already sits in your notes. Mine meeting notes, voice memos, and an end-of-day brain dump into a weekly menu of ready-to-script hooks.",
  },
  {
    number: "04",
    label: "SYSTEM 3",
    title: "The AI video editor",
    description:
      "Six bots, one job each, handing work to one another overnight: finding winning posts, writing the script, recording the voiceover, sourcing footage, checking quality, and cutting the final edit. A finished draft is waiting every morning.",
  },
  {
    number: "05",
    label: "THE CENTERPIECE",
    title: "One idea, reverse-engineered",
    description:
      "Follow a single idea from raw notes to a published post, traced handoff by handoff: note, hook, script, edit, result. The real numbers behind the views, the new followers, and what would change next time.",
  },
  {
    number: "06",
    label: "THE BUSINESS",
    title: "Output, growth, and revenue are three numbers",
    description:
      "Every brand deal, product sale, and community member starts with a piece of content. Why weekly revenue can look empty while growth stays strong, and how content fuels the partnership pipeline.",
  },
  {
    number: "07",
    label: "THE TOOLKIT",
    title: "Starter prompts, workflow, and scorecard",
    description:
      "Three copy-paste AI prompts for strategy, hooks, and video planning, a no-code six-step video workflow, and a weekly creator-business scorecard to track output, reach, engagement, inquiries, and revenue.",
  },
  {
    number: "08",
    label: "YOUR TURN",
    title: "Build your system in 7 days",
    description:
      "A day-by-day challenge: audit your process, pick your bottleneck, run the prompts, build one workflow, publish a piece, and score the results against where you started.",
  },
];

const highlights = [
  { stat: "6", label: "AI bots running one overnight content team" },
  { stat: "~2 hrs", label: "per AI-assisted video edit" },
  { stat: "35-40", label: "hours to build the entire system" },
];

export default function ContentEngineeringBlueprintPage() {
  return (
    <>
      <PagePresenceTracker page="content-engineering-blueprint" />
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
              <span>Content Engineering Blueprint</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-[var(--cta-bg)] text-white mb-4">
                  Free Playbook
                </span>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                  The Content{" "}
                  <span className="italic text-[var(--accent)]">
                    Engineering
                  </span>{" "}
                  Blueprint
                </h1>
                <p className="mt-4 text-lg text-[var(--gray-600)] leading-relaxed">
                  How I&apos;m using AI, automation, and engineering principles
                  to build a $1M/year media company. Six bots. One content
                  team. A finished draft waiting every morning.
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
                    <span>12 pages</span>
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
              <div className="bg-[var(--cta-bg)] rounded-2xl p-8 md:p-12 text-white">
                <p className="text-xs tracking-[0.2em] text-white/50 mb-8">
                  A FREE PLAYBOOK FROM NAYA
                </p>
                <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">
                  The Content
                  <br />
                  Engineering
                  <br />
                  Blueprint
                </h2>
                <div className="border-b-2 border-white/30 w-12 mb-6"></div>
                <p className="text-white/60 text-sm">
                  How I&apos;m using AI, automation, and engineering
                  principles to build a $1M/year media company.
                </p>
                <div className="border-b border-white/20 w-full mt-8 mb-4"></div>
                <p className="font-serif italic text-white/40 text-sm">
                  Six bots. One content team. A finished draft waiting every
                  morning.
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
              <p className="mt-4 text-[var(--gray-600)] max-w-lg mx-auto">
                8 chapters covering the shift from creator to engineer, the
                three AI systems behind the content, one idea traced start to
                finish, and the exact prompts to build your own.
              </p>
            </div>

            <div className="space-y-6">
              {chapters.map((chapter) => (
                <div
                  key={chapter.number}
                  className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-6 md:p-8 flex gap-6"
                >
                  <div className="flex-shrink-0">
                    <span className="font-serif text-3xl md:text-4xl text-[var(--accent)]">
                      {chapter.number}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs tracking-widest text-[var(--gray-600)] mb-1">
                      {chapter.label}
                    </p>
                    <h3 className="font-serif text-xl md:text-2xl">
                      {chapter.title}
                    </h3>
                    <p className="mt-2 text-[var(--gray-600)] text-sm leading-relaxed">
                      {chapter.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Quote */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="border-l-2 border-[var(--accent)] pl-6 text-left">
              <p className="font-serif italic text-xl md:text-2xl text-[var(--foreground)]">
                &ldquo;A system is easy to copy when you can see every
                handoff. Trace one of your own pieces the same way: note,
                hook, script, edit, result.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--cta-bg)] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              Ready to build your own content engine?
            </h2>
            <p className="text-white/60 mb-8 text-lg max-w-xl mx-auto">
              You do not need six bots on day one. You need one bottleneck,
              one prompt, and one week to build your first workflow.
            </p>
            <DownloadButton />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
