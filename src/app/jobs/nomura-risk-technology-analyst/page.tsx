import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ReminderForm from "./ReminderForm";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import BackToJobs from "../BackToJobs";

export const metadata = {
  title: "Nomura 2026 IT Full-Time Analyst - Risk Technology | The Black Female Engineer",
  description:
    "Full-time analyst position at Nomura in Risk Technology. Develop applications for business stakeholders with a 2-year global cohort program. $95k-$105k salary.",
};

export default function NomuraRiskTechnologyAnalyst() {
  return (
    <>
      <PagePresenceTracker page="nomura-risk-technology-analyst" />
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
                Nomura
              </span>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                Now Hiring
              </span>
              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                Full-Time
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--foreground)] mb-4">
              2026 IT Full-Time Analyst - Risk Technology
            </h1>
            <div className="flex flex-wrap gap-4 text-[var(--gray-600)]">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                New York, NY
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                2-Year Program
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                $95k - $105k
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-10">
            {/* About */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">About the Role</h2>
              <p className="text-[var(--foreground)] leading-relaxed mb-4">
                Join Nomura&apos;s Risk Technology team as a Full-Time Analyst where you&apos;ll develop and integrate
                applications for direct use by business stakeholders. This hands-on development role involves
                collaborating with quality assurance and business analysis teams on testing and requirements gathering.
              </p>
              <p className="text-[var(--foreground)] leading-relaxed">
                The position includes a <strong>two-week onboarding</strong>, participation in a curated
                <strong> two-year global cohort</strong>, and networking opportunities across Nomura offices in
                London, Mumbai, Singapore, Hong Kong, and Tokyo.
              </p>
            </section>

            {/* Reminder Signup */}
            <ReminderForm />

            {/* Requirements */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Requirements</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">1</span>
                  <span>Bachelor&apos;s or Master&apos;s degree in Computer Science or related field</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">2</span>
                  <span>Outstanding academic qualifications with a strong GPA</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">3</span>
                  <span>On-track to graduate between December 2025 and June 2026</span>
                </li>
              </ul>
            </section>

            {/* Desired Skills */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Desired Skills</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Programming</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Experience with Java or Python programming languages
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Web Technologies</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    HTML, JavaScript, JSP, ASP experience preferred
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Unix Scripting</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Familiarity with Unix/Linux command line and scripting
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Financial Knowledge</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Understanding of financial products and markets is a plus
                  </p>
                </div>
              </div>
            </section>

            {/* Program Highlights */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Program Highlights</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold">1</span>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Two-Week Onboarding</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      Comprehensive introduction to Nomura&apos;s technology infrastructure and culture
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold">2</span>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">Global Cohort Experience</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      Join a curated two-year cohort with peers across the globe
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffe500] flex items-center justify-center text-black font-bold">3</span>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">International Networking</h3>
                    <p className="text-sm text-[var(--gray-600)] mt-1">
                      Connect with colleagues across Nomura offices in London, Mumbai, Singapore, Hong Kong, and Tokyo
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="pt-8 border-t border-[var(--card-border)]">
              <div className="text-center">
                <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Ready to Apply?</h2>
                <p className="text-[var(--gray-600)] mb-6 max-w-2xl mx-auto">
                  Launch your career in finance technology at one of the world&apos;s leading investment banks.
                  This is a great opportunity for new graduates interested in risk technology.
                </p>
                <a
                  href="https://nomuracampus.tal.net/vx/lang-en-GB/mobile-0/appcentre-1/brand-4/xf-3348347fc789/candidate/so/pm/1/pl/1/opp/1389-2026-Information-Technology-Full-Time-Analyst-Risk-Technology/en-GB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#ef562a] text-white px-8 py-4 rounded-lg font-medium hover:bg-[#d94a24] transition-colors text-lg"
                >
                  Apply on Nomura Careers
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
