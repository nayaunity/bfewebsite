import { FEATURED_COMPANIES } from "./companyData";

export default function CompanyShowcase() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight mb-10">
          Our users apply to jobs at{" "}
          <span className="italic text-[#ef562a]">incredible</span> companies
          like:
        </h2>

        <div className="flex flex-wrap justify-center gap-3">
          {FEATURED_COMPANIES.map((company) => (
            <span
              key={company}
              className="px-5 py-2.5 border border-[var(--card-border)] rounded-full text-sm font-medium bg-[var(--card-bg)] text-[var(--foreground)]"
            >
              {company}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
