import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BookCallCTA from "./BookCallCTA";

export const metadata = {
  title: "Claude Code Workshop for Teams | The Black Female Engineer",
  description:
    "In-person Claude Code workshop for engineering teams. Half-day, full-day, and 2-day sprint formats. Trained teams at Anthropic, Microsoft, HP, and AMD.",
  openGraph: {
    title: "Claude Code Workshop for Teams | The Black Female Engineer",
    description:
      "In-person Claude Code workshop for engineering teams. Transform your team from AI-curious to AI-confident.",
    url: "/claude-code-workshop",
    type: "website",
    images: [
      { url: "/images/bfeimage2.png", alt: "The Black Female Engineer" },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Claude Code Workshop for Teams | The Black Female Engineer",
    description:
      "In-person Claude Code workshop for engineering teams. Transform your team from AI-curious to AI-confident.",
    images: ["/images/bfeimage2.png"],
  },
};

const pricingTiers = [
  {
    name: "Starter",
    duration: "Half-day (4 hrs)",
    price: "$15K",
    features: [
      "Foundations of Claude Code for your stack",
      "Hands-on slides + exercises",
      "Resource guide included",
      "Up to 20 engineers",
    ],
  },
  {
    name: "Core",
    duration: "Full-day (8 hrs)",
    price: "$20K",
    popular: true,
    features: [
      "Deep-dive into advanced workflows",
      "Custom workflow integration for your codebase",
      "Up to 30 engineers",
    ],
  },
  {
    name: "Sprint",
    duration: "2 days",
    price: "$35K",
    features: [
      "Full curriculum + live project sprint",
      "Custom curriculum tailored to your team",
      "Manager briefing session",
      "Up to 40 engineers",
    ],
  },
];

export default function ClaudeCodeWorkshopPage() {
  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero — Who I Am */}
        <section className="bg-[var(--background)] pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                  Your team&apos;s{" "}
                  <span className="italic text-[#ef562a]">Claude Code</span>
                  <br />
                  workshop instructor
                </h1>
                <p className="mt-6 text-xl text-[var(--gray-600)] leading-relaxed">
                  I&apos;m Nyaradzo — engineer, educator, and Anthropic partner.
                  I&apos;ve trained engineering teams at Microsoft, HP, and AMD to
                  ship production code with Claude Code.
                </p>
              </div>
              <div className="relative rounded-3xl aspect-square overflow-hidden">
                <Image
                  src="/images/nyaradzo.jpg"
                  alt="Nyaradzo"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* What the Workshop Delivers */}
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white">
              <span className="italic">what your team</span> WALKS AWAY WITH
            </h2>
            <div className="w-px h-12 bg-[#ffe500] mx-auto my-8"></div>
            <div className="space-y-8 text-left max-w-2xl mx-auto">
              {[
                "A working Claude Code setup tailored to your codebase, frameworks, and CI pipeline",
                "Muscle memory for prompt patterns that actually ship — not toy demos",
                "A repeatable playbook your team uses Monday morning, not a slide deck they forget",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <svg
                    className="w-6 h-6 text-[#ef562a] flex-shrink-0 mt-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-xl text-white/80 font-serif italic">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Proof */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="grid grid-cols-2 gap-8 md:gap-16 mb-10">
              <div>
                <div className="font-serif text-5xl md:text-7xl text-[#ef562a]">
                  93%
                </div>
                <p className="mt-2 text-[var(--gray-600)] text-sm md:text-base">
                  started uncomfortable
                </p>
              </div>
              <div>
                <div className="font-serif text-5xl md:text-7xl text-[#ef562a]">
                  100%
                </div>
                <p className="mt-2 text-[var(--gray-600)] text-sm md:text-base">
                  left confident and shipping
                </p>
              </div>
            </div>
            <p className="text-lg md:text-xl text-[var(--gray-600)] font-serif italic max-w-2xl mx-auto">
              &ldquo;93% of attendees started uncomfortable. 100% left
              confident and shipping with Claude Code.&rdquo;
            </p>
          </div>
        </section>

        {/* The Logos */}
        <section className="bg-[var(--background)] py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm tracking-widest mb-8">
                TRUSTED BY TEAMS AT
              </p>
              <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-4 font-serif text-3xl md:text-5xl lg:text-6xl text-[var(--gray-400)]">
                <span>ANTHROPIC</span>
                <span className="text-[#ef562a]">MICROSOFT</span>
                <span>HP</span>
                <span className="text-[#ef562a]">AMD</span>
              </div>
            </div>
          </div>
        </section>

        {/* The Offer — Pricing */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl">
                <span className="italic">the</span> INVESTMENT
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`bg-[var(--card-bg)] border rounded-2xl p-8 relative ${
                    tier.popular
                      ? "border-[#ffe500] border-2"
                      : "border-[var(--card-border)]"
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-block text-xs px-3 py-1 rounded-full font-medium bg-[#ffe500] text-black">
                      MOST POPULAR
                    </span>
                  )}
                  <h3 className="font-serif text-2xl mb-1">{tier.name}</h3>
                  <p className="text-[var(--gray-600)] text-sm mb-6">
                    {tier.duration}
                  </p>
                  <div className="font-serif text-4xl md:text-5xl text-[#ef562a] mb-8">
                    {tier.price}
                  </div>
                  <ul className="space-y-3">
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
                        <span className="text-[var(--gray-600)]">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4 text-white">
              Ready to upskill your team?
            </h2>
            <p className="text-white/60 mb-8 text-lg">
              15 minutes is all it takes to scope the right format for your
              team.
            </p>
            <BookCallCTA />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
