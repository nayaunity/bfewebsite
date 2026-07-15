import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import CohortPageViewTracker from "./PageViewTracker";
import CohortSignup from "./CohortSignup";

export const metadata = {
  title: "Fall 2026 Cohort | The Black Female Engineer",
  description:
    "Learn how to use AI to optimize your life and reach your income milestones. Join the Fall 2026 cohort from The Black Female Engineer.",
};

export default function CohortPage() {
  return (
    <>
      <PagePresenceTracker page="cohort" />
      <CohortPageViewTracker />
      <Navigation />
      <main>
        {/* Hero */}
        <section className="bg-[var(--background)] pt-32 md:pt-40 pb-16 md:pb-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm tracking-[0.3em] text-[var(--gray-600)] mb-6">
              FALL 2026 COHORT
            </p>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-tight">
              Use AI to build the{" "}
              <span className="italic text-[#4d1b27]">life</span> you
              actually want.
            </h1>
            <p className="mt-8 text-lg md:text-xl text-[var(--gray-600)] max-w-2xl mx-auto">
              A guided program for people ready to use AI as a tool for optimizing their daily lives, unlocking new income streams, and reaching financial milestones they set for themselves.
            </p>
            <CohortSignup />
          </div>
        </section>

        {/* What You'll Learn */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
              What you&apos;ll <span className="italic text-[#4d1b27]">learn</span>
            </h2>
            <p className="text-center text-[var(--gray-600)] mb-12 max-w-xl mx-auto">
              This isn&apos;t a course about prompting. It&apos;s a system for
              restructuring your life with AI so the results compound.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  number: "01",
                  title: "AI life systems",
                  description:
                    "Build personal AI workflows that save you hours every week. Meal planning, scheduling, health tracking, finances, and decision-making on autopilot.",
                },
                {
                  number: "02",
                  title: "Income acceleration",
                  description:
                    "Use AI to identify, launch, and grow income streams that fit your life. Freelancing, digital products, content, consulting, and more.",
                },
                {
                  number: "03",
                  title: "Milestone mapping",
                  description:
                    "Set your own income milestone and reverse-engineer the path to get there. AI helps you plan, execute, and stay accountable.",
                },
              ].map((item) => (
                <div
                  key={item.number}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8"
                >
                  <span className="text-sm font-mono text-[#4d1b27]">
                    {item.number}
                  </span>
                  <h3 className="font-serif text-xl mt-3 mb-3">{item.title}</h3>
                  <p className="text-[var(--gray-600)] text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who This Is For */}
        <section className="bg-[var(--background)] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
              Built for people who are{" "}
              <span className="italic text-[#4d1b27]">ready</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                "You know AI is powerful but haven't figured out how to make it work for YOUR life yet.",
                "You want to increase your income but don't know where to start or what to build.",
                "You're tired of consuming content about AI and ready to actually implement it.",
                "You want a community and structure, not another course you'll never finish.",
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl"
                >
                  <div className="w-8 h-8 rounded-full bg-[#4d1b27] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-[var(--foreground)] leading-relaxed">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Details + CTA */}
        <section className="bg-[#4d1b27] py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-6">
              Launching Fall 2026
            </h2>
            <p className="text-[#897075] text-lg mb-4">
              Spots will be limited. Get on the waitlist to be first to know when
              enrollment opens, plus early pricing.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/80 mb-10">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>8-week guided program</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Small cohort, real community</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>AI tools + templates included</span>
              </div>
            </div>
            <CohortSignup variant="dark" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
