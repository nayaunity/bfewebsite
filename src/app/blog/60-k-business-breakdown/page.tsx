import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import BlueprintPageViewTracker from "./PageViewTracker";
import DownloadButton from "./DownloadButton";

export const metadata = {
  title: "The $60K/Month Blueprint Breakdown | The Black Female Engineer",
  description:
    "The business model, systems, and AI leverage behind how I built a $60K/month business. And how you can start building your own version.",
  openGraph: {
    title: "The $60K/Month Blueprint Breakdown | The Black Female Engineer",
    description:
      "The business model, systems, and AI leverage behind how I built a $60K/month business. And how you can start building your own version.",
    url: "/blog/60-k-business-breakdown",
    type: "website",
    images: [
      { url: "/images/bfeimage2.png", alt: "The Black Female Engineer" },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "The $60K/Month Blueprint Breakdown | The Black Female Engineer",
    description:
      "The business model, systems, and AI leverage behind how I built a $60K/month business. And how you can start building your own version.",
    images: ["/images/bfeimage2.png"],
  },
};

const chapters = [
  {
    number: "01",
    label: "THE PREMISE",
    title: "What this actually is",
    description:
      "This is not a motivational PDF. It is a blueprint breakdown of how the business makes money, how content creates demand, how AI builds leverage, and how to turn skills into security.",
  },
  {
    number: "02",
    label: "THE MODEL",
    title: "The business model",
    description:
      "Three revenue streams that strengthen each other: brand deals, company education sessions, and AI consulting. Built like a portfolio, not a single bet.",
  },
  {
    number: "03",
    label: "THE ENGINE",
    title: "The real engine behind it",
    description:
      "Content is not just marketing. It is market research, trust-building, lead generation, and proof of concept happening in public.",
  },
  {
    number: "04",
    label: "THE SYSTEM",
    title: "My content system",
    description:
      "The 5-step process from paying attention to patterns, turning them into hooks, posting daily, doubling down on what works, and converting ideas into series and leads.",
  },
  {
    number: "05",
    label: "THE BRIDGE",
    title: "How attention becomes leads",
    description:
      "Attention is not enough. You need a bridge. A specific call to action connected to a specific desire. The lead flow that turns a comment into a conversation.",
  },
  {
    number: "06",
    label: "THE OFFERS",
    title: "My offer logic",
    description:
      "You do not need a massive empire first. You need offer logic. A ladder from free content to newsletter to premium consulting.",
  },
  {
    number: "07",
    label: "THE OPERATING SYSTEM",
    title: "How I run my life like a startup",
    description:
      "Content blocks in the evening, CEO strategy time in the afternoon, client work throughout the day. Systems for the business and systems for life.",
  },
  {
    number: "08",
    label: "THE HABITS",
    title: "The unhinged systems that keep me focused",
    description:
      "A Future Me GPT for strategic alignment. ElevenReader and AI newsletters to stay informed. Being early is easier when you turn it into a system.",
  },
  {
    number: "09",
    label: "THE MATH",
    title: "Dream life math",
    description:
      "Reverse engineer your income goal. $10K/month, $60K/month. The goal becomes less intimidating the second it becomes math.",
  },
  {
    number: "10",
    label: "THE LEVERAGE",
    title: "Where AI creates leverage",
    description:
      "AI is not a cheat code. AI is leverage. A co-pilot. A skill amplifier. The women who win with AI will be the ones using tools to become more capable.",
  },
  {
    number: "11",
    label: "YOUR TURN",
    title: "Your blueprint starts here",
    description:
      "One clear audience. One clear problem. One clear point of view. One repeatable content series. One lead magnet. One path from attention to action.",
  },
];

const highlights = [
  { stat: "22", label: "pages of real strategy" },
  { stat: "11", label: "chapters from model to math" },
  { stat: "$0", label: "free download" },
];

export default function BlueprintBreakdownPage() {
  return (
    <>
      <PagePresenceTracker page="60k-blueprint" />
      <BlueprintPageViewTracker />
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero */}
        <section className="pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-[var(--gray-600)] mb-6">
              <Link href="/blog" className="hover:text-[var(--accent)]">
                Blog
              </Link>
              <span>/</span>
              <span>$60K/Month Blueprint</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-[#4d1b27] text-white mb-4">
                  Free Ebook
                </span>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                  The $60K/month{" "}
                  <span className="italic text-[var(--accent)]">blueprint</span>
                </h1>
                <p className="mt-4 text-lg text-[var(--gray-600)] leading-relaxed">
                  The business model, systems, and AI leverage behind how I
                  built this. And how you can start building your own version.
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
                    <span>22 pages</span>
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
                    <span>15 min read</span>
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
              <div className="bg-[#4d1b27] rounded-2xl p-8 md:p-12 text-white">
                <p className="text-xs tracking-[0.2em] text-white/50 mb-8">
                  DISGUSTINGLY AMBITIOUS
                </p>
                <p className="text-xs tracking-widest text-white/40 mb-4">
                  AN EBOOK BY NAYA
                </p>
                <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">
                  The $60K/month
                  <br />
                  blueprint
                  <br />
                  breakdown
                </h2>
                <div className="border-b-2 border-white/30 w-12 mb-6"></div>
                <p className="text-white/60 text-sm">
                  The business model, systems, and AI leverage behind how I built
                  this. And how you can start building your own version.
                </p>
                <div className="border-b border-white/20 w-full mt-8 mb-4"></div>
                <p className="font-serif italic text-white/40 text-sm">
                  Dream life, engineered.
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
              <p className="mt-4 text-[var(--gray-600)] max-w-lg mx-auto">
                11 chapters covering every layer of the business, from the model
                to the math to the AI leverage that makes it possible.
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
                &ldquo;Your dream life gets easier to build when you stop
                treating income like magic and start treating it like a
                system.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#4d1b27] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              You just need to start building.
            </h2>
            <p className="text-white/60 mb-8 text-lg max-w-xl mx-auto">
              You do not need huge followers first. You do not need to think of
              yourself as a founder yet. You do not need to have it all figured
              out.
            </p>
            <DownloadButton />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
