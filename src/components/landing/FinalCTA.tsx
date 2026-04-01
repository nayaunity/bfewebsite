import Link from "next/link";
import { COMPANIES } from "./companyData";

export default function FinalCTA() {
  return (
    <section className="relative py-24 md:py-32 bg-[#1a1a1a] overflow-hidden">
      {/* Background scattered company names */}
      <div className="absolute inset-0 select-none pointer-events-none" aria-hidden="true">
        {COMPANIES.map((company, i) => (
          <span
            key={company}
            className="absolute font-serif font-bold text-white"
            style={{
              top: `${10 + (i * 17) % 80}%`,
              left: `${5 + (i * 23) % 90}%`,
              fontSize: `${1 + (i % 3) * 0.5}rem`,
              opacity: 0.04 + (i % 4) * 0.01,
              transform: `rotate(${-5 + (i % 10)}deg)`,
            }}
          >
            {company.toUpperCase()}
          </span>
        ))}
      </div>

      {/* Foreground content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
          Land your dream job,
          <br />
          <span className="italic text-[#ef562a]">10x easier</span>.
        </h2>

        <Link
          href="/auto-apply/get-started"
          className="inline-flex items-center gap-2 mt-10 bg-[#ffe500] text-black px-10 py-4 rounded-full text-lg font-medium hover:bg-[#f0d800] transition-colors"
        >
          Get Started
        </Link>

        <p className="mt-6 text-sm text-white/40">
          Free to start. No credit card required.
        </p>
      </div>
    </section>
  );
}
