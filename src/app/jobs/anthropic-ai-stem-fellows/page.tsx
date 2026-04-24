import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import AutoApplyCTA from "./AutoApplyCTA";
import BackToJobs from "../BackToJobs";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";

export const metadata = {
  title: "Anthropic AI STEM Fellowship: Applications Open | The Black Female Engineer",
  description:
    "Applications are open for the Anthropic AI STEM Fellowship: a 3-month, in-person San Francisco research fellowship applying Claude to open problems in STEM. ~$3,800/week stipend. Apply by May 15, 2026.",
};

export default function AnthropicAiStemFellows() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: "Anthropic AI STEM Fellowship",
          hiringOrganization: { "@type": "Organization", name: "Anthropic", sameAs: "https://www.anthropic.com" },
          jobLocation: [
            { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "San Francisco", addressRegion: "CA", addressCountry: "US" } },
          ],
          employmentType: "OTHER",
          datePosted: "2026-04-24",
          description:
            "3-month, in-person San Francisco fellowship applying Claude to open problems in STEM research. Weekly stipend of ~$3,800 USD with access to frontier Claude models and internal tooling, plus direct mentorship from Anthropic researchers.",
          validThrough: "2026-05-15T23:59:59Z",
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "USD",
            value: { "@type": "QuantitativeValue", value: 3800, unitText: "WEEK" },
          },
        }}
      />
      <PagePresenceTracker page="anthropic-ai-stem-fellows" />
      <Navigation />
      <main className="min-h-screen pt-32 md:pt-40 pb-20 bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <BackToJobs />
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 text-sm font-medium bg-[#ef562a] text-white rounded-full">
                Anthropic
              </span>
              <span className="px-3 py-1 text-sm font-medium bg-green-500 text-white rounded-full animate-pulse">
                Applications Open
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--foreground)] mb-4">
              Anthropic AI STEM Fellowship
            </h1>
            <div className="flex flex-wrap gap-4 text-[var(--gray-600)]">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                San Francisco (in-person)
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                3 months full-time (Jun 15 to Sep 15, 2026)
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                AI for Scientific Discovery
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-10">
            {/* About */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">About the Program</h2>
              <p className="text-[var(--foreground)] leading-relaxed">
                The Anthropic AI STEM Fellowship is a 3-month, in-person program in San Francisco for
                PhD-level researchers who want to apply Claude to real problems in their scientific
                field. Fellows get direct mentorship from Anthropic researchers, access to frontier
                Claude models and internal tooling, and a structured environment to ship evaluations,
                datasets, and scientific research artifacts that push the frontier of what AI can do
                for science.
              </p>
            </section>

            {/* Auto-Apply CTA */}
            <AutoApplyCTA />

            {/* Compensation */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Compensation &amp; Access</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <p className="text-sm text-[var(--gray-600)] mb-1">Weekly stipend</p>
                  <p className="font-serif text-2xl text-[var(--foreground)]">~$3,800 USD</p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <p className="text-sm text-[var(--gray-600)] mb-1">Model &amp; tooling access</p>
                  <p className="font-serif text-2xl text-[var(--foreground)]">Frontier Claude + internal tooling</p>
                </div>
              </div>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Eligibility Requirements</h2>
              <p className="text-[var(--foreground)] mb-4">You must meet <strong>ALL</strong> of the following criteria:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">1</span>
                  <span><strong>Background:</strong> PhD or equivalent research experience in a STEM field</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">2</span>
                  <span><strong>Availability:</strong> Full-time in-person in San Francisco, June 15 to Sep 15, 2026</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">3</span>
                  <span><strong>Tooling fluency:</strong> Already use Claude or Claude Code in your research or engineering workflow</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">4</span>
                  <span><strong>Pace:</strong> Able to move fast and ship on short cycles</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">5</span>
                  <span><strong>Motivation:</strong> Excited about AI accelerating scientific discovery</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-[var(--gray-100)] rounded-lg">
                <p className="text-[var(--foreground)] text-sm">
                  <strong>Ideal candidates:</strong> PhD researchers, postdocs, and research engineers
                  in STEM fields who already use Claude day-to-day and want to spend a focused quarter
                  pushing the frontier of AI-for-science.
                </p>
              </div>
            </section>

            {/* What You'll Get */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">What You&apos;ll Get</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Direct Mentorship</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Work alongside Anthropic researchers as your direct mentors throughout the fellowship
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Frontier Model Access</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Use frontier Claude models plus Anthropic&apos;s internal tooling to run experiments at scale
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Competitive Stipend</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    ~$3,800/week stipend for the full 3-month program so you can focus on research
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">In-Person SF Collaboration</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Sit alongside the research team in Anthropic&apos;s San Francisco office for the full program
                  </p>
                </div>
              </div>
            </section>

            {/* What You'll Work On */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">What You&apos;ll Work On</h2>
              <p className="text-[var(--foreground)] mb-4">Three types of work fellows take on:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">1</span>
                  <span>Design hard-to-game evaluations for your scientific field</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">2</span>
                  <span>Identify or create data that targets Claude&apos;s capability gaps</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">3</span>
                  <span>Apply Claude to open problems in your domain with scientific tools</span>
                </li>
              </ul>
            </section>

            {/* Research Areas */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Research Areas</h2>
              <div className="flex flex-wrap gap-2">
                {[
                  "AI for Science",
                  "Scientific Evaluations",
                  "Research Data",
                  "Frontier Models",
                  "Scientific Discovery",
                ].map((area) => (
                  <span
                    key={area}
                    className="px-4 py-2 text-sm bg-[var(--gray-100)] text-[var(--foreground)] rounded-full border border-[var(--card-border)]"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </section>

            {/* Timeline */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Application Timeline</h2>
              <div className="p-6 bg-[#ffe500]/10 border border-[#ffe500] rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#ffe500] flex items-center justify-center">
                    <span className="text-black font-bold text-sm">MAY 15</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)] text-lg">Deadline: May 15, 2026</p>
                    <p className="text-[var(--gray-600)]">
                      Program runs June 15 to September 15, 2026 in San Francisco.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Auto-Apply CTA */}
            <AutoApplyCTA variant="alt" />

            {/* Location */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Location Requirements</h2>
              <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                <p className="text-[var(--foreground)]">
                  <strong>Note:</strong> This fellowship is fully in-person in San Francisco for the
                  entire 3 months. There is no remote option. Applicants must be able to be onsite
                  for the full duration of the program.
                </p>
              </div>
            </section>

            {/* CTA */}
            <section className="pt-8 border-t border-[var(--card-border)]">
              <div className="text-center">
                <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Ready to Apply?</h2>
                <p className="text-[var(--gray-600)] mb-6 max-w-2xl mx-auto">
                  One of the most direct paths to applying frontier AI to your scientific field.
                  Applications close May 15, 2026.
                </p>
                <a
                  href="https://job-boards.greenhouse.io/anthropic/jobs/5189848008"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#ef562a] text-white px-8 py-4 rounded-lg font-medium hover:bg-[#d94a24] transition-colors text-lg"
                >
                  Apply on Anthropic Careers
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
