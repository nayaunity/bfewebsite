export default function ValueProp() {
  return (
    <section className="py-16 md:py-24 bg-[var(--gray-50)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl leading-tight mb-12">
          BFE applies you to{" "}
          <span className="italic text-[#ef562a]">100s</span> of great jobs
          every month.
        </h2>

        {/* 3 Steps */}
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-16">
          {[
            { step: "1", label: "Fill Out Your Profile" },
            { step: "2", label: "Get Job Matches" },
            { step: "3", label: "Sit Back & Relax" },
          ].map(({ step, label }) => (
            <div
              key={step}
              className="flex items-center gap-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full px-6 py-3"
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#ffe500] text-black text-sm font-bold flex items-center justify-center">
                {step}
              </span>
              <span className="font-medium text-sm text-[var(--foreground)]">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
          {[
            { value: "500+", label: "Jobs Applied Monthly" },
            { value: "5-10x", label: "More Interviews" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-serif text-3xl md:text-4xl text-[#ef562a]">
                {value}
              </p>
              <p className="text-sm text-[var(--gray-600)] mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
