import type { Metadata } from "next";
import React from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CopyableCodeBlock from "@/components/blog/CopyableCodeBlock";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import PromptPackPageViewTracker from "./PageViewTracker";

export const metadata: Metadata = {
  title: "The Content Intelligence Prompt Pack | The Black Female Engineer",
  description:
    "24 copy-paste prompts that turn Perplexity into a research team, a content strategist, and a QA layer for your posting.",
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

interface Part {
  title: string;
  items: PromptItem[];
}

const parts: Part[] = [
  {
    title: "Part 1: Find your real benchmarks",
    items: [
      {
        heading: "1. The competitor map",
        prompt: `Act as a senior content strategist. Research and find 10 top creators in my niche. My niche is [YOUR ONE-LINE PROMISE: who you help, what they get].

Focus on [PLATFORM]. Exclude anyone with more than [FOLLOWER CEILING] followers. For each creator give me: handle, follower count with source, their bio verbatim, content formats they lean on, how they monetize, and one line on why they're a useful blueprint for me.

Include a mix of accounts near my current size and accounts one tier above it.`,
        note: "Why the ceiling matters: accounts 10x your size win on distribution you don't have. A cohort just above you shows tactics that work without an existing audience.",
      },
      {
        heading: "2. The adjacent-niche raid",
        prompt: `I create content about [YOUR TOPIC]. Find 5 creators in a COMPLETELY DIFFERENT niche, [pick: fitness, finance, parenting, cooking, sports], who are excellent at [SPECIFIC SKILL: hooks / storytelling / teaching complex things simply].

For each, show me the structural technique they use, with verbatim examples, and translate that technique into my topic.`,
        note: "The fastest route to content that doesn't look like everyone else's in your niche.",
      },
      {
        heading: "3. Find who your audience already trusts",
        prompt: `My audience is [SPECIFIC PERSON: e.g. "a 32-year-old ops manager who wants out of their job"]. Research where they actually spend attention: which creators, podcasts, newsletters, and subreddits.

Then tell me what promises are already being made to them, and where the gap is that nobody is filling.`,
      },
      {
        heading: "4. The white-space check",
        prompt: `Research the 15 most-repeated content angles in [YOUR NICHE] over the last 6 months. Rank them from most saturated to least. Then identify 5 angles with clear demand signals but low supply, and explain the evidence for each.`,
      },
    ],
  },
  {
    title: "Part 2: Deconstruct what already works",
    items: [
      {
        heading: "5. The deep profile teardown",
        prompt: `Analyze these profiles: [HANDLES].

I don't care what they talk about. I care HOW. For each, capture verbatim:
- Bio text, highlight names, link-in-bio destination
- The on-screen cover text of their most recent 12 posts
- Their top-performing posts from the last 12 months, with view/like/comment counts
- For each top post: the exact first spoken line, the video structure beat by beat, the full caption, and the CTA

Quote everything verbatim. Verbatim text matters more than your summary.`,
        note: "The single highest-value prompt in this pack. Verbatim is the whole game. Paraphrased hooks are useless as templates.",
      },
      {
        heading: "6. Separate organic from paid",
        prompt: `From that analysis, remove every post that is a paid partnership, sponsored post, brand deal, ambassador content, or affiliate promo.

Then re-rank each creator's top performers using organic posts only, and tell me: which conclusions changed, which held, and what each creator's realistic ORGANIC ceiling and typical baseline actually are.`,
        note: "Do not skip this. Sponsored posts routinely hit 50x the views with a fraction of the engagement. A 12.7M-view post with 256 likes is an ad budget, not a repeatable tactic.",
      },
      {
        heading: "7. The outlier isolation",
        prompt: `For [CREATOR], find their posts from the last 12 months whose performance is a clear multiple of their typical post. Ignore average posts.

For each outlier, tell me what it did DIFFERENTLY from their baseline content: hook structure, format, opening frame, length, CTA. Then identify what the outliers have in common with each other.`,
      },
      {
        heading: "8. Engagement quality, not reach",
        prompt: `For each of these posts, calculate like rate, comment rate, and share rate (each divided by views): [POSTS OR CREATOR].

Rank them by SHARE rate, not views. Then tell me what the top share-rate posts have structurally in common, and separately flag any post where comments are inflated by a "comment [keyword]" mechanic rather than real discussion.`,
        note: "Shares are the scarcest and most honest metric. Comment-keyword posts can look like engagement and be pure lead capture.",
      },
      {
        heading: "9. Hook pattern extraction",
        prompt: `Here are [NUMBER] high-performing hooks from my niche: [PASTE THEM].

Group them into distinct structural patterns. For each pattern give me: a name, the fill-in-the-blank template, the average word count, whether it uses second-person, a number, a negation, or a timeframe, and 2 verbatim examples with their performance.`,
      },
      {
        heading: "10. Reverse-engineer the script",
        prompt: `Here is a transcript / description of a top-performing post: [PASTE].

Reverse-engineer it into a reusable script skeleton with beat-by-beat timing. Tell me what each beat is doing psychologically, where the retention risk is, and how I'd swap in my own topic without breaking the structure.`,
      },
      {
        heading: "11. The first three seconds",
        prompt: `Across these top-performing posts [LIST], analyze ONLY the first 3 seconds: what's on screen, whether the hook is spoken and written at the same time, what moves or changes by second 2, and whether it opens on a face, an interface, a graphic, or a scene.

Then give me the rule I should follow for my content format.`,
      },
    ],
  },
  {
    title: "Part 3: Build",
    items: [
      {
        heading: "12. Hooks from proven patterns",
        prompt: `Using the hook patterns you identified, write 7 hooks for my content about [YOUR TOPIC], one per pattern.

Rules: 8-14 words each. Every hook must create exactly one question in the viewer's mind. No hook may require me to already be known. For each, tell me which pattern it uses, the evidence behind it, and one execution note about what must be on screen.`,
      },
      {
        heading: "13. Hook stress test",
        prompt: `Here are my hooks: [PASTE].

For each: rate it 1-10 on specificity, tension, and scroll-stopping power. Flag any that are vague, generic, could apply to any creator, or make a promise I'd struggle to pay off. Then rewrite the three weakest ones twice: once sharper, once shorter.`,
      },
      {
        heading: "14. Full script build",
        prompt: `Write a [LENGTH]-second script for [TOPIC] using the [SKELETON NAME] structure.

Give me: the hook line, the on-screen text for each beat, what I say, what's visible on screen, and the ending. Include timing per beat. Conversational spoken language, not written prose. No sentence I wouldn't say out loud.`,
      },
      {
        heading: "15. The proof audit",
        prompt: `Here's my script: [PASTE].

I want to open on proof, not explanation. Tell me exactly what should be visible in frame one, what I should show rather than say, and every place I'm claiming something I could be demonstrating instead. Then cut every line that doesn't add tension, proof, or a step.`,
      },
      {
        heading: "16. Caption in their format",
        prompt: `Write a caption for this post: [DESCRIBE IT].

Match the caption mechanics that work in my niche: [LENGTH], first line [FUNCTION], line breaks every [N] lines, [N] hashtags placed [WHERE], CTA positioned [WHERE]. The first line must not repeat the hook word for word. It should extend it.`,
      },
      {
        heading: "17. CTA and keyword design",
        prompt: `For this post [DESCRIBE], design the ending. Give me 3 options: one comment-keyword CTA, one share/save prompt, and one genuine question.

For the keyword: it must be a single easy-to-type noun that names the asset. Tell me exactly what gets delivered and what I need built before I post. I'm not promising anything I can't fulfil.`,
      },
      {
        heading: "18. Carousel architecture",
        prompt: `Turn this idea into a [N]-slide carousel: [IDEA].

Slide 1 must work as a standalone cover. Slide 2 must earn the swipe. One idea per slide, final slide converts. Give me the exact text per slide plus a note on what's visual on each.`,
      },
    ],
  },
  {
    title: "Part 4: Test and improve",
    items: [
      {
        heading: "19. The structured week",
        prompt: `Build me a 7-day posting test plan for [YOUR TOPIC].

Each day should test a DIFFERENT hook pattern and format purpose. Hold the audience, posting time, and visual style constant so the hook is the variable.

For each day give me: the brief, the hook pattern, the opening frame, the script skeleton, and the CTA. Then tell me which metrics decide the winner and what result would make me kill vs. repeat a pattern.`,
      },
      {
        heading: "20. Post-mortem",
        prompt: `Here's how my last [N] posts performed: [PASTE DATA: hook, format, views, likes, comments, shares, saves].

Find the pattern. What do my top posts share structurally that my bottom posts don't? Separate "the topic worked" from "the packaging worked." Then tell me the one variable I should change next week, and one thing I should stop doing.`,
      },
      {
        heading: "21. Diagnose a flop",
        prompt: `This post underperformed: [PASTE HOOK, DESCRIBE STRUCTURE, GIVE METRICS]. My typical post gets [BASELINE].

Diagnose where it lost people: hook, first 3 seconds, middle, or ending. Use the metric shape as evidence: high views but low likes, or good likes but no shares, mean different things. Then rewrite the weakest element.`,
      },
      {
        heading: "22. Re-cut a winner",
        prompt: `This post outperformed for me: [PASTE HOOK AND STRUCTURE].

Don't retire it. Give me 5 ways to re-run the same hook syntax and structure with new proof, examples, or angles, and tell me how long to wait between re-cuts.`,
        note: "Top creators reuse a winning hook family repeatedly with fresh proof. One post is not the end of a pattern's life.",
      },
    ],
  },
  {
    title: "Part 5: Systemize",
    items: [
      {
        heading: "23. Bio and profile conversion",
        prompt: `Here's my bio: [PASTE]. My promise is [PROMISE] and my audience is [AUDIENCE].

Rebuild it as: line 1 promise, line 2 mechanism, line 3 compact proof, line 4 single CTA. Give me 3 versions. Then tell me what my highlights should be named based on the questions a buyer asks before they trust me, and what my link-in-bio should point to.`,
      },
      {
        heading: "24. The repeatable engine",
        prompt: `Based on everything we've established, build me a content system I can run weekly:
- My 3 recurring content pillars, and what each one is FOR (reach, trust, or conversion)
- 2 repeatable series formats with a fixed structure I can fill in
- A realistic weekly cadence for [MY CAPACITY: hours/week]
- The 4 metrics I track and what each one tells me
- My batching workflow: what I write, film, and edit in one sitting

Keep it something a solo creator can actually sustain.`,
      },
    ],
  },
];

const metaPrompt = `I want to [GOAL] in [TIMEFRAME]. My current situation is [HONEST STARTING POINT].

Before answering, ask me the 5 questions you most need answered to give me a genuinely useful plan rather than generic advice. Then research what actually works, tell me what the evidence says, and flag where the evidence is thin.`;

const habits = [
  {
    lead: "Ask for verbatim.",
    body: "\"Quote it exactly\" turns a vague summary into a template you can use.",
  },
  {
    lead: "Ask what changed.",
    body: "After any analysis, ask \"which of your conclusions would change if [CONSTRAINT]?\" That's how the paid-vs-organic split in this build surfaced. It rewrote half the findings.",
  },
  {
    lead: "Ask what not to copy.",
    body: "Every analysis of successful people hides survivorship bias. Making that explicit is often more valuable than the tactics themselves.",
  },
];

export default function ContentIntelligencePromptPackPage() {
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
            The <span className="italic text-[var(--accent)]">Content Intelligence</span> Prompt Pack
          </h1>
          <p className="text-lg text-[var(--gray-600)] mb-8 pb-8 border-b border-[var(--card-border)]">
            24 copy-paste prompts that turn Perplexity into a research team, a content
            strategist, and a QA layer for your posting.
          </p>

          {/* How to use */}
          <div className="bg-[var(--surface-warm)] border border-[var(--border-warm)] rounded-2xl p-6 mb-10">
            <p className="text-[var(--foreground)] leading-relaxed mb-4">
              <strong className="font-semibold">How to use this pack:</strong> Replace
              everything in [SQUARE BRACKETS]. Work top to bottom the first time. The pack
              is sequenced as a workflow: find your benchmarks, deconstruct them, build from
              the patterns, then test and systemize. After that, dip in wherever you need.
            </p>
            <p className="text-[var(--foreground)] leading-relaxed mb-2 font-semibold">
              Two rules that make every prompt below work harder:
            </p>
            <ol className="list-decimal ml-6">
              <li className="text-[var(--foreground)] mb-2">
                <strong className="font-semibold">Name the constraint.</strong> "Under 500K
                followers," "last 12 months," "organic only." Constraints are what separate
                a useful answer from a generic one.
              </li>
              <li className="text-[var(--foreground)]">
                <strong className="font-semibold">Ask for the mechanics, not the topics.</strong>{" "}
                You don't want to know what they talked about. You want to know how they
                packaged it.
              </li>
            </ol>
          </div>

          {/* Parts */}
          {parts.map((part) => (
            <section key={part.title}>
              <h2 className="font-serif text-2xl md:text-3xl mt-12 mb-4 text-[var(--foreground)]">
                {part.title}
              </h2>
              {part.items.map((item) => (
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

          {/* Meta-prompt */}
          <h2 className="font-serif text-2xl md:text-3xl mt-12 mb-4 text-[var(--foreground)]">
            The meta-prompt
          </h2>
          <p className="text-[var(--foreground)] mb-4 leading-relaxed">
            When you don't know what to ask:
          </p>
          <CopyableCodeBlock code={metaPrompt} />

          {/* Habits */}
          <h2 className="font-serif text-2xl md:text-3xl mt-12 mb-4 text-[var(--foreground)]">
            Three habits that beat any prompt
          </h2>
          {habits.map((habit) => (
            <p key={habit.lead} className="text-[var(--foreground)] mb-4 leading-relaxed">
              <strong className="font-semibold">{habit.lead}</strong> {habit.body}
            </p>
          ))}
        </article>
      </main>
      <Footer />
    </>
  );
}
