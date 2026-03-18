import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import EnrollCTA from "./EnrollCTA";
import FAQAccordion from "./FAQAccordion";
import CountdownBadge from "./CountdownBadge";

export const metadata = {
  title: "Build with Claude Code | The Black Female Engineer",
  description:
    "The first structured Claude Code course for career switchers. 6 modules, a deployed portfolio app, and a verifiable digital badge. Presale: $399 (30 seats).",
  openGraph: {
    title:
      "Build with Claude Code | The Black Female Engineer",
    description:
      "The first structured Claude Code course for career switchers. Self-paced. Hands-on. Portfolio-ready. Presale limited to 30 seats at $399.",
    url: "/certification",
    type: "website",
    images: [
      { url: "/images/bfeimage2.png", alt: "Build with Claude Code" },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title:
      "Build with Claude Code | The Black Female Engineer",
    description:
      "The first structured Claude Code course for career switchers. Self-paced. Hands-on. Portfolio-ready. Presale limited to 30 seats at $399.",
    images: ["/images/bfeimage2.png"],
  },
};

const modules = [
  {
    number: 1,
    title: "Environment Setup",
    topics: [
      "Install and configure Claude Code",
      "Set up your dev workspace",
      "CLI essentials and first commands",
    ],
  },
  {
    number: 2,
    title: "Developer-Grade Prompting",
    topics: [
      "Prompt patterns that actually ship",
      "CLAUDE.md and project context",
      "Slash commands and plan mode",
    ],
  },
  {
    number: 3,
    title: "Building Your First AI App",
    topics: [
      "Full-stack app from scratch with Claude Code",
      "Plan mode vs direct execution",
      "Debugging and iterating with AI",
    ],
  },
  {
    number: 4,
    title: "The Anthropic API",
    topics: [
      "API keys and the Messages API",
      "Tool use and structured output",
      "Integrating AI into your app",
    ],
  },
  {
    number: 5,
    title: "Deploy and Ship",
    topics: [
      "Deploy to Vercel or your platform",
      "CI/CD basics for your project",
      "Making your app production-ready",
    ],
  },
  {
    number: 6,
    title: "Career Translation",
    topics: [
      "Portfolio presentation and storytelling",
      "Earning your BFE digital badge",
      "Interview prep for AI-native roles",
    ],
  },
];

const deliverables = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.466.733-3.559" />
      </svg>
    ),
    title: "Deployed Portfolio App",
    description:
      "A real AI-powered app you built, deployed, and can demo in interviews.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    title: "BFE Digital Badge",
    description:
      "A verifiable digital credential for your LinkedIn and resume.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
      </svg>
    ),
    title: "Lifetime Access",
    description:
      "Self-paced curriculum you can revisit anytime, with all future updates included.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    title: "6 Hands-On Modules",
    description:
      "Each module includes a project you build from start to finish.",
  },
];

const pricingFeatures = [
  "6 modules with hands-on projects",
  "Self-paced, lifetime access",
  "Deployed portfolio app",
  "Verifiable BFE digital badge",
  "Hands-on project every module",
  "Founding member exclusive access",
  "14-day full refund guarantee",
];

export default function CertificationPage() {
  return (
    <>
      <Navigation />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: "Build with Claude Code",
          description:
            "The first structured Claude Code course for career switchers. 6 modules, a deployed portfolio app, and a verifiable digital badge.",
          provider: {
            "@type": "Organization",
            name: "The Black Female Engineer",
            url: "https://www.theblackfemaleengineer.com",
          },
          offers: {
            "@type": "Offer",
            price: "399",
            priceCurrency: "USD",
            availability: "https://schema.org/LimitedAvailability",
          },
        }}
      />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        {/* Hero */}
        <section className="bg-[var(--background)] pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <span className="inline-block text-xs font-medium px-4 py-1.5 rounded-full bg-[#ffe500] text-black mb-6 tracking-wide">
                  PRESALE · ONLY 30 SEATS
                </span>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
                  Build with{" "}
                  <span className="italic text-[#ef562a]">Claude Code</span>.
                  <br />
                  Get hired.
                </h1>
                <p className="mt-6 text-xl text-[var(--gray-600)] leading-relaxed">
                  The first structured course for career switchers who
                  want to build, deploy, and get hired using the fastest-growing
                  AI development tool. Self-paced. Hands-on. Portfolio-ready.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <EnrollCTA />
                </div>
                <div className="mt-4">
                  <CountdownBadge />
                </div>
              </div>
              <div className="relative rounded-3xl aspect-square overflow-hidden">
                <Image
                  src="/images/nyaradzo.jpg"
                  alt="Nyaradzo, BFE Course Instructor"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Why This Course */}
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white">
              <span className="italic">why this</span> COURSE
            </h2>
            <div className="w-px h-12 bg-[#ffe500] mx-auto my-8"></div>
            <div className="space-y-8 text-left max-w-2xl mx-auto">
              {[
                "Claude Code is the fastest-growing AI development tool on the market, and there is no structured, beginner-accessible course for it. Until now.",
                "Career switchers who can build and deploy with AI are getting hired over candidates who can\u2019t. This is the skill gap that matters right now.",
                "This course gives you the portfolio project, the credential, and the hands-on skills to prove you belong in the room.",
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

        {/* What You'll Learn — 6 Modules */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl">
                <span className="italic">what you&apos;ll</span> LEARN
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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

        {/* What You Get — Deliverables */}
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl text-white">
                <span className="italic">what you</span> GET
              </h2>
              <div className="w-px h-12 bg-[#ffe500] mx-auto my-8"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {deliverables.map((item, i) => (
                <div
                  key={i}
                  className="border border-white/10 rounded-2xl p-8"
                >
                  <div className="w-14 h-14 rounded-full bg-[#ffe500] flex items-center justify-center text-black mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-serif text-xl text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About the Instructor */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl mb-6">
                  <span className="italic">your</span> INSTRUCTOR
                </h2>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-4">
                  I&apos;m Nyaradzo: engineer, educator, and{" "}
                  <strong className="text-[var(--foreground)]">
                    Anthropic Claude Ambassador
                  </strong>
                  . I&apos;ve spent 5+ years making technology accessible to
                  over 200K professionals.
                </p>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-4">
                  I&apos;ve delivered Claude Code workshops for teams at
                  Anthropic, Microsoft, HP, and AMD. This course is the
                  productized version of that expertise, built to give career
                  switchers the same structured, hands-on training.
                </p>
                <p className="text-lg text-[var(--gray-600)] leading-relaxed">
                  No fluff. No toy demos. Real skills, real projects, a real
                  credential.
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
            <div className="text-center mt-16">
              <p className="text-sm tracking-widest mb-8">
                TRAINED TEAMS AT
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

        {/* Testimonials */}
        <section className="bg-[#1a1a1a] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl text-white">
                <span className="italic">what students</span> SAY
              </h2>
              <div className="w-px h-12 bg-[#ffe500] mx-auto my-8"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[
                { quote: "The walkthrough was super easy and beneficial! I've watched videos on Youtube but this hands-on experience was much more fun!", name: "Priya M.", title: "Software Engineer" },
                { quote: "The real-time walk-through was very informative. It was a helpful and practical example, and Naya was very personable and engaged.", name: "Jesus O.", title: "Operations" },
                { quote: "I loved the clear explanation and also the slow flow to make sure everyone stays at same point.", name: "Samuel C.", title: "Backend Engineer" },
                { quote: "The near-immediate feedback was really helpful for my learning!", name: "David T.", title: "Full-Stack Engineer" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="border border-white/10 rounded-2xl p-8"
                >
                  <svg
                    className="w-8 h-8 text-[#ffe500] mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-white/80 font-serif italic text-lg mb-4">
                    {item.quote}
                  </p>
                  <p className="text-white/60 text-sm">
                    <span className="text-white/90 font-medium">{item.name}</span> &middot; {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl">
                <span className="italic">the</span> INVESTMENT
              </h2>
            </div>
            <div className="max-w-lg mx-auto">
              <div className="bg-[var(--card-bg)] border-2 border-[#ffe500] rounded-2xl p-8 md:p-10 relative text-center">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-block text-xs px-4 py-1 rounded-full font-medium bg-[#ffe500] text-black tracking-wide">
                  FOUNDING CLASS
                </span>
                <div className="mb-6">
                  <span className="text-[var(--gray-600)] line-through text-xl">
                    $499
                  </span>
                </div>
                <div className="font-serif text-5xl md:text-6xl text-[#ef562a] mb-8">
                  $399
                </div>
                <ul className="space-y-3 text-left mb-8">
                  {pricingFeatures.map((feature, i) => (
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
                      <span className="text-[var(--gray-600)]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <EnrollCTA className="inline-flex items-center justify-center gap-2 bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors text-lg w-full" />
                <div className="mt-4 flex justify-center">
                  <CountdownBadge />
                </div>
                <p className="mt-4 text-xs text-[var(--gray-600)]">
                  14-day money-back guarantee. Full refund, no questions asked.
                </p>
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
              Secure your founding seat
            </h2>
            <p className="text-white/60 mb-8 text-lg max-w-2xl mx-auto">
              30 presale seats. $399 presale price. Once they&apos;re gone, the
              price goes to $499.
            </p>
            <EnrollCTA />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
