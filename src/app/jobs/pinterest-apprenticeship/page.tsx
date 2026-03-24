import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import BackToJobs from "../BackToJobs";
import EmailSignupBanner from "./EmailSignupBanner";

export const metadata = {
  title: "Pinterest Apprentice Engineer | The Black Female Engineer",
  description:
    "Pinterest Apprentice Engineer — up to 1-year program for career changers and non-traditional backgrounds. Apply by March 27, 2026. Starts July 27, 2026. $9,350–$11,000/mo.",
};

export default function PinterestApprenticeship() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: "Apprentice Engineer",
          hiringOrganization: { "@type": "Organization", name: "Pinterest", sameAs: "https://www.pinterest.com" },
          jobLocation: [
            { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "San Francisco", addressRegion: "CA", addressCountry: "US" } },
          ],
          jobLocationType: "TELECOMMUTE",
          employmentType: "FULL_TIME",
          datePosted: "2026-03-23",
          validThrough: "2026-03-27T17:00:00-07:00",
          description: "Pinterest Apprentice Engineer — up to 1-year program for career changers and non-traditional backgrounds with opportunity for conversion to full-time.",
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "USD",
            value: { "@type": "QuantitativeValue", minValue: 9350, maxValue: 11000, unitText: "MONTH" },
          },
        }}
      />
      <PagePresenceTracker page="pinterest-apprenticeship" />
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
                Pinterest
              </span>
              <span className="px-3 py-1 text-sm font-medium bg-green-500 text-white rounded-full">
                Now Accepting Applications
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--foreground)] mb-4">
              Apprentice Engineer
            </h1>
            <div className="flex flex-wrap gap-4 text-[var(--gray-600)]">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                San Francisco, CA / Remote, US
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Apprenticeship (up to 1 year)
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                $9,350 – $11,000/mo
              </span>
            </div>
          </div>

          {/* Email Signup Banner */}
          <div className="mb-10">
            <EmailSignupBanner />
          </div>

          {/* Content */}
          <div className="space-y-10">
            {/* About */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">About the Program</h2>
              <p className="text-[var(--foreground)] leading-relaxed mb-4">
                The Pinterest Apprenticeship Program is an opportunity for professionals from non-tech
                backgrounds and those who may face barriers of entry into the industry to experience
                Engineering at Pinterest. Apprenticeships are up to one year long with the opportunity
                to be considered for conversion to a full-time Engineer.
              </p>
              <p className="text-[var(--foreground)] leading-relaxed">
                At Pinterest, AI isn&apos;t just a feature — it&apos;s a powerful partner that augments creativity
                and amplifies impact. They&apos;re looking for candidates who are excited to be a part of that.
              </p>
            </section>

            {/* What You'll Do */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">What You&apos;ll Do</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold mt-0.5">1</span>
                  <span>Work alongside Pinterest Engineers and key partners on Design, Research, and Product Management teams on a high-impact project</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold mt-0.5">2</span>
                  <span>Collaborate with an assigned mentor who will help you navigate the expectations of being an Engineer at Pinterest</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold mt-0.5">3</span>
                  <span>Leverage AI in your daily engineering workflow to accelerate delivery — brainstorming approaches, writing and refining code, and producing clear documentation</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold mt-0.5">4</span>
                  <span>Continually grow through various learning and development opportunities</span>
                </li>
              </ul>
            </section>

            {/* Who Should Apply */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Who Should Apply</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ef562a] flex items-center justify-center text-white text-sm font-bold mt-0.5">&#10003;</span>
                  <span><strong>Non-tech backgrounds:</strong> Coding bootcamp grads, self-taught developers, and those without a related degree or professional engineering experience</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ef562a] flex items-center justify-center text-white text-sm font-bold mt-0.5">&#10003;</span>
                  <span><strong>Self-motivated professionals</strong> pursuing a career in tech who are curious to learn what it&apos;s like to work and succeed as an Engineer at Pinterest</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ef562a] flex items-center justify-center text-white text-sm font-bold mt-0.5">&#10003;</span>
                  <span><strong>1+ years of professional work experience</strong> collaborating and clearly communicating in a work environment (preferred)</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ef562a] flex items-center justify-center text-white text-sm font-bold mt-0.5">&#10003;</span>
                  <span><strong>Proficiency in at least one programming language</strong></span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ef562a] flex items-center justify-center text-white text-sm font-bold mt-0.5">&#10003;</span>
                  <span><strong>Familiarity using AI</strong> as a learning and productivity tool, and as an iterative coding partner</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-[var(--gray-100)] rounded-lg">
                <p className="text-[var(--foreground)] text-sm">
                  <strong>Note:</strong> Apprentices are expected to work full-time during business hours. Students currently enrolled in a Bachelor&apos;s, Master&apos;s, or PhD program are not eligible. Must be legally authorized to work in the US full-time.
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Competitive Pay</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    $9,350 – $11,000 per month based on location and experience
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Dedicated Mentorship</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    An assigned mentor to help you navigate being an Engineer at Pinterest
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">High-Impact Projects</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Work on real Pinterest features alongside Design, Research, and Product teams
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Path to Full-Time</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Opportunity to be considered for conversion to a full-time Engineer role
                  </p>
                </div>
              </div>
            </section>

            {/* How to Prepare */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">How to Prepare</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold">1</span>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Update Your Resume</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      Showcase your tech projects, skills, and highlight your non-traditional journey
                    </p>
                    <a href="/resources/resume-linkedin" className="inline-flex items-center gap-1 text-sm text-[#ef562a] hover:underline mt-2">
                      Get resume tips →
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold">2</span>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Showcase Your AI Skills</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      Pinterest emphasizes AI in their workflow. Be ready to show how you use AI as a coding partner and productivity tool
                    </p>
                    <a href="/resources/claude-code-101" className="inline-flex items-center gap-1 text-sm text-[#ef562a] hover:underline mt-2">
                      Watch our Claude Code Webinar →
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold">3</span>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Prepare Your Story</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      In their interview process, what matters most is that you can explain your approach — showing not just what you know, but how you think
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Key Dates */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Key Dates</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-6 bg-[#ef562a]/10 border border-[#ef562a]/30 rounded-xl text-center">
                  <p className="text-sm text-[var(--gray-600)] mb-1">Application Deadline</p>
                  <p className="font-serif text-2xl text-[var(--foreground)]">March 27, 2026</p>
                  <p className="text-sm text-[var(--gray-600)] mt-1">5:00 PM PDT</p>
                </div>
                <div className="p-6 bg-[#ffe500]/10 border border-[#ffe500]/50 rounded-xl text-center">
                  <p className="text-sm text-[var(--gray-600)] mb-1">Program Start Date</p>
                  <p className="font-serif text-2xl text-[var(--foreground)]">July 27, 2026</p>
                  <p className="text-sm text-[var(--gray-600)] mt-1">Full-time, up to 1 year</p>
                </div>
              </div>
            </section>

            {/* Location & Details */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Location & Details</h2>
              <div className="space-y-3">
                <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <p className="text-[var(--foreground)]">
                    <strong>Location:</strong> San Francisco, CA or Remote (US)
                  </p>
                </div>
                <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <p className="text-[var(--foreground)]">
                    <strong>Compensation:</strong> $9,350 – $11,000 per month (based on location and experience)
                  </p>
                </div>
                <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <p className="text-[var(--foreground)]">
                    <strong>Relocation:</strong> This position is not eligible for relocation assistance
                  </p>
                </div>
                <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <p className="text-[var(--foreground)]">
                    <strong>Work Authorization:</strong> Must be currently legally authorized to work in the United States full-time
                  </p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="pt-8 border-t border-[var(--card-border)]">
              <div className="text-center">
                <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Ready to Apply?</h2>
                <p className="text-[var(--gray-600)] mb-6 max-w-2xl mx-auto">
                  This is an incredible opportunity for career changers and non-traditional candidates to
                  break into big tech at Pinterest. Don&apos;t wait — applications may close as early as March 27.
                </p>
                <a
                  href="https://www.pinterestcareers.com/jobs/7558536/apprentice-engineer/?gh_jid=7558536"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#ef562a] text-white px-8 py-4 rounded-lg font-medium hover:bg-[#d94a24] transition-colors text-lg"
                >
                  Apply on Pinterest Careers
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
