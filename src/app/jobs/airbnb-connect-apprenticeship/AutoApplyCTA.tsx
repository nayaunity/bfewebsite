export default function AutoApplyCTA({ variant = "default" }: { variant?: "default" | "alt" }) {
  const isAlt = variant === "alt";

  return (
    <section className="my-10">
      <div className="p-6 md:p-8 bg-[#ffe500]/50 border border-[#ffe500] rounded-2xl">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#ef562a] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-serif text-xl text-[var(--foreground)] mb-1">
              {isAlt ? "Don\u2019t stop at one application" : "Apply to jobs while you sleep"}
            </h3>
            <p className="text-[var(--gray-600)] text-sm">
              {isAlt
                ? "The average job search takes 100+ applications. Let us handle that \u2014 we\u2019ll auto-apply to roles that match your skills at top tech companies, every single night."
                : "Use our auto-apply tool to automatically apply to hundreds of engineering roles on your behalf. We\u2019ll match you to the right opportunities and submit applications while you focus on what matters."}
            </p>
          </div>
        </div>

        <a
          href="/auto-apply/landing"
          className="inline-flex items-center gap-2 bg-[#ef562a] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#d94a24] transition-colors"
        >
          {isAlt ? "Get Started Free" : "Start Auto-Applying"} <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </section>
  );
}
