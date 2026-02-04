import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ReminderForm from "./ReminderForm";
import BackToJobs from "../BackToJobs";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";

export const metadata = {
  title: "Airbnb Connect Engineering Apprenticeship | The Black Female Engineer",
  description:
    "5-month engineering apprenticeship at Airbnb for candidates from non-traditional backgrounds. Applications open April 6th, 2026.",
};

export default function AirbnbConnectApprenticeship() {
  return (
    <>
      <PagePresenceTracker page="airbnb-connect-apprenticeship" />
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
                Airbnb
              </span>
              <span className="px-3 py-1 text-sm font-medium bg-[#ffe500] text-black rounded-full">
                Applications Open April 6th
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--foreground)] mb-4">
              Connect Engineering Apprenticeship
            </h1>
            <div className="flex flex-wrap gap-4 text-[var(--gray-600)]">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                San Francisco (Hybrid)
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ~5 months
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Software Engineering
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-10">
            {/* About */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">About the Program</h2>
              <p className="text-[var(--foreground)] leading-relaxed">
                The Connect Engineering Apprenticeship is Airbnb&apos;s initiative to bridge the opportunity gap
                for entry-level engineering candidates. The program welcomes those from underrepresented
                backgrounds and non-traditional educational paths. As an apprentice, you&apos;ll contribute to
                real projects that enhance experiences for Airbnb&apos;s guests and hosts worldwide.
              </p>
            </section>

            {/* Reminder Signup */}
            <ReminderForm />

            {/* Eligibility */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Eligibility Requirements</h2>
              <p className="text-[var(--foreground)] mb-4">You must meet <strong>ALL</strong> of the following criteria:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">1</span>
                  <span><strong>Education:</strong> No 4-year Computer Science degree</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">2</span>
                  <span><strong>Coding Background:</strong> Skills acquired through bootcamps, online courses, or community college</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">3</span>
                  <span><strong>Work Experience:</strong> Minimum 2 years total work experience with less than 1 year of professional software engineering</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">4</span>
                  <span><strong>Technical Skills:</strong> Ability to convert problems to code, implement basic functions (conditionals, loops), and experience with React, Rails, or Express</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-[var(--gray-100)] rounded-lg">
                <p className="text-[var(--foreground)] text-sm">
                  <strong>Ideal candidates:</strong> Bootcamp graduates, self-taught developers, and associate degree holders
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
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Curriculum</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Three-month foundational training on Airbnb&apos;s tech stack and large-scale codebase
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Mentorship</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Dedicated engineering mentor for technical and professional guidance
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Hands-On Projects</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Real tasks with scoping, pairing, and code review support
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Professional Development</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Leadership fireside chats and soft skills workshops
                  </p>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Application Timeline</h2>
              <div className="p-6 bg-[#ffe500]/10 border border-[#ffe500] rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#ffe500] flex items-center justify-center">
                    <span className="text-black font-bold text-xl">APR</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)] text-lg">Applications Open: April 6th, 2026</p>
                    <p className="text-[var(--gray-600)]">2026 cohort application window</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Reminder Signup */}
            <ReminderForm />

            {/* Location Restrictions */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Location Requirements</h2>
              <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                <p className="text-[var(--foreground)]">
                  <strong>Note:</strong> Airbnb cannot employ candidates residing in Alaska, Mississippi, or North Dakota.
                </p>
              </div>
            </section>

            {/* CTA */}
            <section className="pt-8 border-t border-[var(--card-border)]">
              <div className="text-center">
                <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Ready to Apply?</h2>
                <p className="text-[var(--gray-600)] mb-6 max-w-2xl mx-auto">
                  This is an incredible opportunity for bootcamp grads and self-taught developers to break into
                  big tech. Set a reminder for April 6th!
                </p>
                <a
                  href="https://careers.airbnb.com/connect-engineering-apprenticeship/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#ef562a] text-white px-8 py-4 rounded-lg font-medium hover:bg-[#d94a24] transition-colors text-lg"
                >
                  Apply on Airbnb Careers
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
