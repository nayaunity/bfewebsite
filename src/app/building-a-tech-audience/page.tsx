import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import PageViewTracker from "./PageViewTracker";
import EnrollCTA, { TierEnrollButton } from "./EnrollCTA";
import FAQAccordion from "./FAQAccordion";
import CountdownBadge from "./CountdownBadge";

export const metadata = {
  title: "Building a Tech Audience | The Black Female Engineer",
  description:
    "A course for engineers and technical professionals who want to build an audience that opens doors to SaaS products, speaking, consulting, and income outside of a corporate job. Doors open May 15.",
  openGraph: {
    title: "Building a Tech Audience | The Black Female Engineer",
    description:
      "Turn your technical credibility into an audience that opens doors to SaaS products, speaking, consulting, and real creator income. Doors open May 15.",
    url: "/building-a-tech-audience",
    type: "website",
    images: [
      {
        url: "/images/bfeimage2.png",
        alt: "Building a Tech Audience",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Building a Tech Audience | The Black Female Engineer",
    description:
      "Turn your technical credibility into an audience that opens doors to SaaS products, speaking, consulting, and real creator income. Doors open May 15.",
    images: ["/images/bfeimage2.png"],
  },
};

const whyItMatters = [
  {
    title: "Launch a SaaS",
    description:
      "An audience is your cheapest distribution channel. The first hundred users of every indie product that works come from the founder's audience.",
  },
  {
    title: "Corporate Leverage",
    description:
      "Promotions, raises, and inbound recruiter offers move faster when your name comes up before the interview. Visibility is the career moat nobody puts on a resume.",
  },
  {
    title: "Speaking Opportunities",
    description:
      "Conferences, podcasts, and keynote invitations go to the people who are already talking publicly. An audience is the shortest path to a stage.",
  },
  {
    title: "Income Off the Corporate Ladder",
    description:
      "In this economy, one income stream is a liability. A creator business gives you consulting, sponsorships, and products that keep paying even when a company decides to cut headcount.",
  },
];

const modules = [
  {
    number: 1,
    title: "Why Building an Audience Is the Career Move",
    topics: [
      "The four wealth paths an audience unlocks",
      "Why technical credibility is the unfair advantage",
      "How to reframe audience-building as career strategy, not vanity",
    ],
  },
  {
    number: 2,
    title: "Picking Your Niche",
    topics: [
      "Define your dream job in one sentence",
      "Find your differentiator (why you, not someone else)",
      "Nail your audience definition so every post is written to one person",
    ],
  },
  {
    number: 3,
    title: "Choosing Your Platform and Cadence",
    topics: [
      "YouTube, LinkedIn, Instagram, TikTok, X: which one fits your niche",
      "How often to post (and why most creators get cadence wrong)",
      "What to post in the first 30 days when you have no data",
    ],
  },
  {
    number: 4,
    title: "Instagram Mastery",
    topics: [
      "Reels, Carousels, Single Posts, Stories, and Bio",
      "What gets reach versus what gets saves",
      "The profile setup that converts visitors into followers",
    ],
  },
  {
    number: 5,
    title: "Hooks and Measuring Engagement",
    topics: [
      "Hook formulas that work for technical content",
      "The real engagement hierarchy: likes, comments, saves, shares, reposts",
      "How to read your own analytics without lying to yourself",
    ],
  },
  {
    number: 6,
    title: "Content Workflows",
    topics: [
      "Claude Skills: turn one idea into ten pieces of content",
      "The repurposing stack (long form to short form to email)",
      "Manychat, CapCut, and the email list you should have started yesterday",
    ],
  },
  {
    number: 7,
    title: "Making Money",
    topics: [
      "Brand deals: pricing, negotiation, and red flags",
      "Building and launching your own product",
      "Consulting and speaking as higher-leverage paths",
    ],
  },
  {
    number: 8,
    title: "Mindset and Staying in the Game",
    topics: [
      "Overcoming imposter syndrome as a technical person",
      "You don't need to be an expert. You need to be one step ahead.",
      "Handling slow growth and being a beginner in public",
    ],
  },
];

const tiers = [
  {
    key: "selfGuided" as const,
    price: "$499",
    name: "Self-Guided",
    tagline: "Work through the full curriculum at your own pace.",
    features: [
      "All 8 modules, lifetime access",
      "Community access",
      "All future updates included",
    ],
    highlight: false,
  },
  {
    key: "groupCoaching" as const,
    price: "$999",
    name: "Group Coaching",
    tagline: "Everything in Self-Guided, plus six weeks of direct access.",
    features: [
      "Everything in Self-Guided",
      "6 weeks of weekly group office hours with Naya",
      "Custom GPTs for content creation",
      "Live content audits on your posts",
      "Template library (hooks, captions, email sequences)",
    ],
    highlight: true,
    badge: "MOST POPULAR",
  },
  {
    key: "privateCoaching" as const,
    price: "$1999",
    name: "All-In (1:1 Coaching)",
    tagline: "Everything above plus private strategy sessions.",
    features: [
      "Everything in Group Coaching",
      "4 one-hour 1:1 coaching sessions with Naya",
      "Personal content strategy review",
      "Priority DM support for the duration of the cohort",
    ],
    highlight: false,
  },
];

export default function BuildingATechAudiencePage() {
  return (
    <>
      <PagePresenceTracker page="building-a-tech-audience" />
      <PageViewTracker />
      <Navigation />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: "Building a Tech Audience",
          description:
            "A course for engineers and technical professionals who want to turn their expertise into an audience that unlocks SaaS, speaking, consulting, and income outside of a corporate job.",
          provider: {
            "@type": "Organization",
            name: "The Black Female Engineer",
            url: "https://www.theblackfemaleengineer.com",
          },
          offers: [
            {
              "@type": "Offer",
              name: "Self-Guided",
              price: "499",
              priceCurrency: "USD",
              availability: "https://schema.org/PreOrder",
            },
            {
              "@type": "Offer",
              name: "Group Coaching",
              price: "999",
              priceCurrency: "USD",
              availability: "https://schema.org/PreOrder",
            },
            {
              "@type": "Offer",
              name: "All-In (1:1 Coaching)",
              price: "1999",
              priceCurrency: "USD",
              availability: "https://schema.org/PreOrder",
            },
          ],
        }}
      />
      <main className="pt-42 md:pt-50 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero */}
        <section className="bg-[var(--background)] pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <span className="inline-block text-xs font-medium px-4 py-1.5 rounded-full bg-[#ffe500] text-black mb-6 tracking-wide">
                  PRESALE · DOORS OPEN MAY 15
                </span>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                  Building a{" "}
                  <span className="italic text-[#ef562a]">Tech Audience</span>.
                </h1>
                <p className="mt-6 text-xl text-[var(--gray-600)] leading-relaxed">
                  The course for engineers who want their technical expertise
                  to open doors. SaaS launches, speaking stages, consulting
                  offers, and income that does not depend on a corporate job.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[var(--gray-600)]">
                  <span>
                    <strong className="text-[var(--foreground)] font-serif text-2xl">
                      $500k+
                    </strong>{" "}
                    earned as a creator
                  </span>
                  <span>
                    <strong className="text-[var(--foreground)] font-serif text-2xl">
                      200k+
                    </strong>{" "}
                    followers across platforms
                  </span>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <EnrollCTA />
                </div>
                <div className="mt-4">
                  <CountdownBadge />
                </div>
              </div>
              <div className="relative rounded-3xl aspect-square overflow-hidden">
                <Image
                  src="/images/work-with-us.jpg"
                  alt="Nyaradzo being filmed for a creator shoot"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Why This Matters */}
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl text-white">
                <span className="italic">why this</span> MATTERS
              </h2>
              <div className="w-px h-12 bg-[#ffe500] mx-auto my-8"></div>
              <p className="max-w-2xl mx-auto text-white/70 text-lg leading-relaxed">
                An audience is not a vanity metric. It is the single highest
                leverage asset a technical person can build this decade.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {whyItMatters.map((item, i) => (
                <div
                  key={i}
                  className="border border-white/10 rounded-2xl p-8"
                >
                  <h3 className="font-serif text-xl text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Curriculum */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl">
                <span className="italic">the</span> CURRICULUM
              </h2>
              <p className="mt-4 text-[var(--gray-600)] max-w-2xl mx-auto">
                Eight modules. No fluff.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {modules.map((mod) => (
                <div
                  key={mod.number}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8"
                >
                  <div className="w-12 h-12 rounded-full bg-[#ffe500] flex items-center justify-center font-serif text-xl font-bold text-black mb-4">
                    {mod.number}
                  </div>
                  <h3 className="font-serif text-xl mb-4">{mod.title}</h3>
                  <ul className="space-y-2">
                    {mod.topics.map((topic, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <svg
                          className="w-4 h-4 text-[#ef562a] flex-shrink-0 mt-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-[var(--gray-600)] text-sm">
                          {topic}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="bg-[var(--gray-50)] py-16 md:py-24 scroll-mt-32"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl">
                <span className="italic">the</span> INVESTMENT
              </h2>
              <p className="mt-4 text-[var(--gray-600)] max-w-2xl mx-auto">
                Three tiers. Pick the one that matches how much live support
                you want.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {tiers.map((tier) => (
                <div
                  key={tier.key}
                  className={`relative bg-[var(--card-bg)] rounded-2xl p-8 flex flex-col ${
                    tier.highlight
                      ? "border-2 border-[#ffe500] md:scale-105 md:shadow-xl"
                      : "border border-[var(--card-border)]"
                  }`}
                >
                  {tier.highlight && tier.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-block text-xs px-4 py-1 rounded-full font-medium bg-[#ffe500] text-black tracking-wide">
                      {tier.badge}
                    </span>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="font-serif text-xl mb-2">{tier.name}</h3>
                    <p className="text-sm text-[var(--gray-600)] min-h-[2.5em]">
                      {tier.tagline}
                    </p>
                  </div>
                  <div className="font-serif text-5xl text-[#ef562a] text-center mb-8">
                    {tier.price}
                  </div>
                  <ul className="space-y-3 text-left mb-8 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-[#ef562a] flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-[var(--gray-600)] text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <TierEnrollButton
                    tier={tier.key}
                    className={
                      tier.highlight
                        ? "inline-flex items-center justify-center gap-2 bg-[#ffe500] text-black px-6 py-3 rounded-full font-medium hover:bg-[#f5dc00] transition-colors text-base w-full"
                        : "inline-flex items-center justify-center gap-2 bg-[var(--foreground)] text-[var(--background)] px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity text-base w-full"
                    }
                  />
                </div>
              ))}
            </div>
            <p className="mt-10 text-center text-sm text-[var(--gray-600)]">
              14-day refund on the Self-Guided tier. Pro-rated refunds on the
              coaching tiers.
            </p>
          </div>
        </section>

        {/* Your Instructor */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl mb-6">
                  <span className="italic">your</span> INSTRUCTOR
                </h2>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-4">
                  I'm Naya. I built a 200,000+ person audience across Instagram,
                  LinkedIn, YouTube, and TikTok while working as a software
                  engineer, then as an AI engineer and educator.
                </p>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-4">
                  That audience has paid me over $500,000 through brand deals,
                  consulting, and speaking. It has put me on stages at
                  conferences, in partnerships with Microsoft, Adobe, HP, and
                  Anthropic, and into rooms I would never have been invited to
                  through a resume alone.
                </p>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed">
                  This course is the system I used to do it, stripped of the
                  parts that did not work and the parts that only apply to
                  non-technical creators.
                </p>
              </div>
              <div className="relative rounded-3xl aspect-square overflow-hidden">
                <Image
                  src="/images/naya-yellow-headshot.png"
                  alt="Nyaradzo"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="text-center mt-16">
              <p className="text-sm tracking-widest mb-8 text-[var(--gray-600)]">
                PREVIOUS PARTNERSHIPS
              </p>
              <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 font-serif text-3xl md:text-5xl lg:text-6xl text-[var(--gray-400)]">
                <span>AMAZON</span>
                <span className="text-[#ef562a]">MICROSOFT</span>
                <span>ADOBE</span>
                <span className="text-[#ef562a]">LINKEDIN</span>
                <span>HP</span>
                <span className="text-[#ef562a]">ANTHROPIC</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl text-white">
                <span className="italic">frequently asked</span> QUESTIONS
              </h2>
              <div className="w-px h-12 bg-[#ffe500] mx-auto my-8"></div>
            </div>
            <FAQAccordion />
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#1a1a1a] border-t border-white/10 py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4 text-white">
              Your audience is waiting.
            </h2>
            <p className="text-white/60 mb-8 text-lg max-w-2xl mx-auto">
              Doors open May 15. Lock in a tier now and start on day one.
            </p>
            <div className="flex justify-center">
              <EnrollCTA />
            </div>
            <div className="mt-6 flex justify-center">
              <CountdownBadge />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
