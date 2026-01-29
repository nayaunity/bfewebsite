import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ReminderForm from "./ReminderForm";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import BackToJobs from "../BackToJobs";

export const metadata = {
  title: "Nomura 2026 IT Summer Analyst - Client Services Technology | The Black Female Engineer",
  description:
    "10-week summer internship at Nomura in Client Services Technology. Work with Global Markets, Investment Banking, and Research teams. $95k-$105k annualized.",
};

export default function NomuraClientServicesSummerAnalyst() {
  return (
    <>
      <PagePresenceTracker page="nomura-client-services-summer-analyst" />
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
              <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                Internship
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--foreground)] mb-4">
              2026 IT Summer Analyst - Client Services Technology
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
                10-Week Program
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                $95k - $105k (annualized)
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-10">
            {/* About */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">About the Program</h2>
              <p className="text-[var(--foreground)] leading-relaxed mb-4">
                The Client Services Technology team supports all technology needs centered around client-facing activities.
                As a summer analyst, you&apos;ll work with <strong>Global Markets Sales</strong>, <strong>Investment Banking</strong>,
                and <strong>Research</strong> teams on projects involving Customer Relationship Management and Client Data Analytics.
              </p>
              <p className="text-[var(--foreground)] leading-relaxed">
                This 10-week summer program offers hands-on experience in one of three specialization tracks,
                giving you real responsibility and exposure to how technology drives business at a global investment bank.
              </p>
            </section>

            {/* Reminder Signup */}
            <ReminderForm />

            {/* Specialization Tracks */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Specialization Tracks</h2>
              <div className="space-y-4">
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)] mb-2">Developer</h3>
                      <p className="text-sm text-[var(--gray-600)]">
                        Focus on application creation and integration, building tools that directly support client-facing teams
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)] mb-2">Business Analyst</h3>
                      <p className="text-sm text-[var(--gray-600)]">
                        Serve as the liaison between technology and business clients, translating requirements into solutions
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#ef562a]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)] mb-2">Infrastructure</h3>
                      <p className="text-sm text-[var(--gray-600)]">
                        Work on cloud, cybersecurity, and system administration supporting the firm&apos;s technology backbone
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Requirements */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Requirements</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">1</span>
                  <span>Outstanding academic qualifications with a strong GPA</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">2</span>
                  <span>Pursuing a Bachelor&apos;s or Master&apos;s degree in Computer Science or related fields within the United States</span>
                </li>
                <li className="flex items-start gap-3 text-[var(--foreground)]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffe500] flex items-center justify-center text-black text-sm font-bold">3</span>
                  <span>Rising juniors graduating between December 2027 and June 2028</span>
                </li>
              </ul>
            </section>

            {/* Desired Skills */}
            <section>
              <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Desired Skills</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Programming Languages</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Python, Java, C#, or VBA
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Web Technologies</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    HTML, JavaScript, and modern web frameworks
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Unix/Perl Scripting</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Command line proficiency and scripting experience
                  </p>
                </div>
                <div className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                  <h3 className="font-semibold text-[var(--foreground)] mb-2">Communication</h3>
                  <p className="text-sm text-[var(--gray-600)]">
                    Strong analytical and communication skills
                  </p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="pt-8 border-t border-[var(--card-border)]">
              <div className="text-center">
                <h2 className="font-serif text-2xl text-[var(--foreground)] mb-4">Ready to Apply?</h2>
                <p className="text-[var(--gray-600)] mb-6 max-w-2xl mx-auto">
                  Get hands-on experience in client services technology at a global investment bank.
                  Perfect for rising juniors looking to build their career in fintech.
                </p>
                <a
                  href="https://nomuracampus.tal.net/vx/lang-en-GB/mobile-0/appcentre-1/brand-4/xf-3348347fc789/candidate/so/pm/1/pl/1/opp/1390-2026-Information-Technology-Summer-Analyst-Program-Client-Services-Technology/en-GB"
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
