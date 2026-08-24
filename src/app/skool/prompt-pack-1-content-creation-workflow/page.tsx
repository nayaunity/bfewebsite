import type { Metadata } from "next";
import React from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CopyableCodeBlock from "@/components/blog/CopyableCodeBlock";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import PromptPackPageViewTracker from "./PageViewTracker";

export const metadata: Metadata = {
  title: "AI Income Lab: Prompt Pack #1 | The Black Female Engineer",
  description:
    "Content Creation Workflow (Session 01). Every prompt from competitor research to brand deal pitches, in run-this-order sequence.",
  robots: {
    index: false,
    follow: false,
  },
};

interface PromptItem {
  heading: string;
  prompt: string;
  note?: string;
}

interface Section {
  title: string;
  items: PromptItem[];
}

const sections: Section[] = [
  {
    title: "Step 1: Competitor Research (Perplexity)",
    items: [
      {
        heading: "1.1 Find your 10 benchmark creators",
        prompt:
          "Find 10 top creators on Instagram in the [tech and AI] niche with between 100k and 200k followers. For each: handle, follower count, what they post, and their most-repeated content format. Browse the actual profiles, don't rely on listicles.",
        note: "Keep the niche broad here. Your specificity (\"for beginners\") is your differentiator, not a search filter. Cap at 200k. The path to your first 100k uses different tactics than the path to 1M.",
      },
      {
        heading: "1.2 Extract the repeatable patterns",
        prompt:
          "From those 10 profiles, identify the tactics that repeat across at least 3 of them. Cover: caption structure and first line, calls to action, series or numbered formats, hook styles, and posting cadence. Give me the pattern, then one real example of it.",
      },
      {
        heading: "1.3 Find their outliers",
        prompt:
          "For each of those 10 creators, find their 3 highest-engagement posts. Tell me what those posts have in common that their average posts don't.",
      },
    ],
  },
  {
    title: "Step 2: Page-Level Analysis (Perplexity computer use)",
    items: [
      {
        heading: "2.1 Niche-wide audit",
        prompt:
          "Open Instagram, search the keyword [tech]. Scroll through reels and carousels and analyze every post with at least 600 likes, 10k views, or 100 comments. For each: hook, length, format, and why it likely performed. Then group them into patterns.",
      },
      {
        heading: "2.2 Audit your own page",
        prompt:
          "Open my Instagram profile [@handle]. Analyze my top 10 and bottom 10 posts by engagement. Tell me: what my winners have in common, what my losers have in common, and which of my formats I should stop making entirely.",
      },
      {
        heading: "2.3 The reshare test",
        prompt:
          "From the posts you analyzed, separate the ones that got shared/saved heavily from the ones that just got likes. What emotional trigger is in the shared ones? Give me the exact structure to replicate it.",
        note: "Expect this: repost-worthy content beats tips. Under-10-word reach posts and full numbered intent posts both work. Nothing in between does. Production quality is not the constraint.",
      },
    ],
  },
  {
    title: "Step 3: Build Your Knowledge Base (ChatGPT project)",
    items: [
      {
        heading: "3.1 Compress your research",
        prompt:
          "Summarize everything above into under 1,000 characters. Keep only the patterns I can act on: caption structure, hook types, formats that work, formats to avoid. No commentary.",
        note: "Save that as a file and upload it into a ChatGPT project. That project is now your permanent context. Every idea gets evaluated against your real research instead of generic advice.",
      },
      {
        heading: "3.2 Set the project instructions",
        prompt:
          "You are my content strategist. My audience is [beginners learning to use AI for the first time]. My promise is [helping them see what's possible with AI and fit it into their specific situation]. Use the uploaded research file as your source of truth for what formats work. Every idea you give me must name the format (reach or intent), the hook, and the reason it fits my audience.",
      },
      {
        heading: "3.3 Generate ideas",
        prompt:
          "Give me 10 post ideas for [beginners looking to integrate AI into their lifestyle]. Label each as a reach post or an intent post. For each: the hook line, the format, and the one thing the viewer walks away able to do.",
      },
    ],
  },
  {
    title: "Step 4: Write the Posts",
    items: [
      {
        heading: "4.1 Reach post (under 10 words)",
        prompt:
          "Write 15 reach post hooks for [my niche]. Under 10 words each. Comedy, novelty, or a sharp observation my audience would tag a friend in. No tips, no teaching.",
      },
      {
        heading: "4.2 Intent post (60-90 seconds)",
        prompt:
          "Write a 60-90 second numbered script: \"[X] things I'd do first if I were starting with AI today.\" Number every step out loud so the viewer knows how long to stay. Show the transformation, not just the advice.",
        note: "Numbers give viewers a defined start, middle, and end. \"We're on tip 3 of 6\" buys you retention. Age and dollar numbers create identity hooks, so viewers self-select in.",
      },
      {
        heading: "4.3 Caption + CTA",
        prompt:
          "Write the caption for this post. First line restates my credential in one clause. Body is 3 short lines. End with a comment-keyword CTA: \"comment [WORD] and I'll send you [RESOURCE].\"",
      },
      {
        heading: "4.4 Build a series",
        prompt:
          "Turn my strongest 5 ideas into a numbered series with a title like \"[X] Days of [TOPIC].\" Give me the series name, the promise, and the one-line hook for each episode.",
      },
    ],
  },
  {
    title: "Step 5: Audit and Monetize",
    items: [
      {
        heading: "5.1 The 7-post audit (Perplexity)",
        prompt:
          "Open my Instagram. Analyze my last 7 posts. Rank them by engagement rate, not raw views. Tell me which format won, which hook style won, and what to double down on for the next 7.",
        note: "Audit after 7 posts, not after a week. If you only made 3, you don't have data yet.",
      },
      {
        heading: "5.2 Brand deal pitches (Claude)",
        prompt:
          "Find 5 brands whose product fits an audience of [AI beginners]. For each, draft a short pitch email: one line on who I am, one line on my audience, one specific idea for their product. Under 120 words each.",
        note: "Run this every morning. Five pitches a day compounds fast.",
      },
      {
        heading: "5.3 Speaking opportunities (Claude)",
        prompt:
          "Find conferences and events in the next 6 months on AI, tech, or creator topics that are still accepting speaker submissions. For each: event, date, deadline, submission link, and why my talk on [TOPIC] fits. Rank by best fit.",
      },
      {
        heading: "5.4 Speaker submission",
        prompt:
          "Draft a speaker proposal for [EVENT]: title, 100-word abstract, 3 audience takeaways, and a 50-word bio. Match the tone of the event's existing programme.",
      },
    ],
  },
];

const toolSplit = [
  { job: "Pattern research (what's working, why posts perform)", tool: "Perplexity" },
  { job: "Live page audits and scrolling real feeds", tool: "Perplexity computer use" },
  { job: "Persistent knowledge base and idea generation", tool: "ChatGPT project" },
  { job: "Fact-based research (conferences, brands, contacts)", tool: "Claude" },
];

export default function PromptPack1Page() {
  return (
    <>
      <PagePresenceTracker page="skool-prompt-pack-1" />
      <PromptPackPageViewTracker />
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--cta-bg)] text-white font-medium">
              AI Income Lab
            </span>
            <span className="text-sm text-[var(--gray-600)]">
              Members only. Please don't share this link.
            </span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-4 text-[var(--foreground)]">
            Prompt Pack #1: <span className="italic text-[var(--accent)]">Content Creation Workflow</span>
          </h1>
          <p className="text-lg text-[var(--gray-600)] mb-8 pb-8 border-b border-[var(--card-border)]">
            Session 01, August 20, 2026
          </p>

          {/* How to use */}
          <div className="bg-[var(--surface-warm)] border border-[var(--border-warm)] rounded-2xl p-6 mb-10">
            <p className="text-[var(--foreground)] leading-relaxed">
              <strong className="font-semibold">How to use this:</strong> run the prompts in
              order. Steps 1 and 2 in Perplexity (pattern research + computer use), Step 3 in
              a ChatGPT project (persistent knowledge base), Step 5 in Claude (fact-based
              research). Replace everything in [BRACKETS].
            </p>
          </div>

          {/* Steps */}
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-serif text-2xl md:text-3xl mt-12 mb-4 text-[var(--foreground)]">
                {section.title}
              </h2>
              {section.items.map((item) => (
                <div key={item.heading}>
                  <h3 className="font-serif text-xl md:text-2xl mt-8 mb-3 text-[var(--foreground)]">
                    {item.heading}
                  </h3>
                  <CopyableCodeBlock code={item.prompt} />
                  {item.note && (
                    <p className="text-[var(--gray-600)] italic mb-4 leading-relaxed">
                      {item.note}
                    </p>
                  )}
                </div>
              ))}
            </section>
          ))}

          {/* Tool split */}
          <h2 className="font-serif text-2xl md:text-3xl mt-12 mb-4 text-[var(--foreground)]">
            The Tool Split
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-[var(--card-border)] mb-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[var(--gray-50)]">
                  <th className="px-4 py-3 font-semibold text-[var(--foreground)]">Job</th>
                  <th className="px-4 py-3 font-semibold text-[var(--foreground)]">Tool</th>
                </tr>
              </thead>
              <tbody>
                {toolSplit.map((row) => (
                  <tr key={row.tool} className="border-t border-[var(--card-border)]">
                    <td className="px-4 py-3 text-[var(--foreground)]">{row.job}</td>
                    <td className="px-4 py-3 text-[var(--foreground)] whitespace-nowrap">{row.tool}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Homework */}
          <h2 className="font-serif text-2xl md:text-3xl mt-12 mb-4 text-[var(--foreground)]">
            Your Homework
          </h2>
          <ol className="list-decimal ml-6 mb-4">
            <li className="text-[var(--foreground)] mb-2">
              Run prompts 1.1 through 3.2 for your own niche. Have the ChatGPT project built
              before next Thursday.
            </li>
            <li className="text-[var(--foreground)] mb-2">
              Create 7 posts using 4.1 to 4.3. Mix reach and intent.
            </li>
            <li className="text-[var(--foreground)] mb-2">After post 7, run 5.1.</li>
          </ol>
          <p className="text-[var(--foreground)] mb-4 leading-relaxed">
            Session recording is in the classroom. Saturday: board meeting. Tuesday: Tech
            Tuesdays.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
