import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Link from "next/link";

// DEV-ONLY preview of applications dashboard with Resume Quiz CTA — no auth
export default function DashboardPreview() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)] pt-[88px] md:pt-[120px] pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          {/* Header — matches real applications page */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs text-[var(--gray-600)] mb-2">
                <Link href="/" className="hover:text-[var(--foreground)] transition-colors">Home</Link>
                <span>/</span>
                <Link href="/profile" className="hover:text-[var(--foreground)] transition-colors">Profile</Link>
                <span>/</span>
                <span className="text-[var(--foreground)]">Applications</span>
              </div>
              <h1 className="font-serif text-2xl md:text-3xl text-[var(--foreground)]">
                Welcome back, Anika
              </h1>
              <p className="mt-1 text-sm text-[var(--gray-600)]">
                Track and manage your auto-applied job applications
              </p>
            </div>
          </div>

          {/* Resume Quiz CTA */}
          <Link
            href="/preview/resume-quiz"
            className="group flex items-center justify-between w-full mb-6 px-5 py-4 bg-gradient-to-r from-[#ffe500] to-[#f0d000] text-black rounded-2xl hover:opacity-95 transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-black/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="text-base font-serif font-bold">Boost Your Resume</span>
                <p className="text-sm text-black/70 mt-0.5">Answer 10 quick questions and we&apos;ll optimize your resume for PM roles</p>
              </div>
            </div>
            <svg className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          {/* Fake Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="relative overflow-hidden rounded-2xl p-5 text-left bg-gradient-to-br from-[#ef562a] to-[#d44a22] text-white">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Total</span>
                </div>
                <p className="text-3xl font-bold">15</p>
                <p className="text-xs text-white/70 mt-1">Across 8 companies</p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
            </div>

            <div className="rounded-2xl p-5 text-left border bg-[var(--card-bg)] border-[var(--card-border)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider">Applied</span>
              </div>
              <p className="text-3xl font-bold text-green-600">4</p>
              <p className="text-xs text-[var(--gray-600)] mt-1">Successfully submitted</p>
            </div>

            <div className="rounded-2xl p-5 text-left border bg-[var(--card-bg)] border-[var(--card-border)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--gray-100)] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[var(--gray-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider">Usage</span>
              </div>
              <p className="text-3xl font-bold text-[var(--foreground)]">4/100</p>
              <p className="text-xs text-[var(--gray-600)] mt-1">Apps this month</p>
            </div>

            <div className="rounded-2xl p-5 text-left border bg-[var(--card-bg)] border-[var(--card-border)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#ef562a]/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider">Starter</span>
              </div>
              <p className="text-3xl font-bold text-[#ef562a]">100</p>
              <p className="text-xs text-[var(--gray-600)] mt-1">Apps/month limit</p>
            </div>
          </div>

          {/* Fake tip */}
          <div className="mb-8 flex items-start gap-3 px-5 py-4 rounded-2xl bg-[var(--accent-blue-bg)] border border-[var(--card-border)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--card-bg)] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider mb-1">Did you know?</p>
              <p className="text-sm text-[var(--foreground)]">The more target roles and resumes you add, the more jobs we can match you to.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
