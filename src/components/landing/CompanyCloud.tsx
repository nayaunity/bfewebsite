"use client";

import { COMPANIES } from "./companyData";

const POSITIONS: { top: string; left: string; size: string; rotate: string; opacity: string; highlight?: boolean }[] = [
  { top: "5%",  left: "8%",  size: "text-xl md:text-2xl", rotate: "-3deg", opacity: "0.25" },
  { top: "12%", left: "30%", size: "text-2xl md:text-4xl", rotate: "2deg",  opacity: "0.35", highlight: true },
  { top: "3%",  left: "55%", size: "text-lg md:text-xl",  rotate: "-1deg", opacity: "0.20" },
  { top: "8%",  left: "78%", size: "text-xl md:text-3xl", rotate: "4deg",  opacity: "0.30" },
  { top: "22%", left: "3%",  size: "text-2xl md:text-3xl", rotate: "1deg",  opacity: "0.30" },
  { top: "25%", left: "25%", size: "text-lg md:text-2xl", rotate: "-2deg", opacity: "0.25" },
  { top: "20%", left: "48%", size: "text-3xl md:text-5xl", rotate: "1deg",  opacity: "0.40", highlight: true },
  { top: "18%", left: "72%", size: "text-xl md:text-2xl", rotate: "-3deg", opacity: "0.25" },
  { top: "35%", left: "12%", size: "text-xl md:text-3xl", rotate: "3deg",  opacity: "0.35", highlight: true },
  { top: "38%", left: "38%", size: "text-lg md:text-xl",  rotate: "-1deg", opacity: "0.20" },
  { top: "32%", left: "60%", size: "text-2xl md:text-3xl", rotate: "2deg",  opacity: "0.30" },
  { top: "40%", left: "82%", size: "text-xl md:text-2xl", rotate: "-2deg", opacity: "0.25" },
  { top: "52%", left: "5%",  size: "text-lg md:text-2xl", rotate: "2deg",  opacity: "0.20" },
  { top: "55%", left: "28%", size: "text-2xl md:text-4xl", rotate: "-1deg", opacity: "0.35", highlight: true },
  { top: "50%", left: "52%", size: "text-xl md:text-2xl", rotate: "3deg",  opacity: "0.25" },
  { top: "48%", left: "75%", size: "text-lg md:text-3xl", rotate: "-2deg", opacity: "0.30" },
  { top: "65%", left: "15%", size: "text-xl md:text-2xl", rotate: "1deg",  opacity: "0.25" },
  { top: "68%", left: "42%", size: "text-lg md:text-xl",  rotate: "-3deg", opacity: "0.20" },
  { top: "62%", left: "65%", size: "text-2xl md:text-3xl", rotate: "2deg",  opacity: "0.35" },
  { top: "70%", left: "85%", size: "text-xl md:text-2xl", rotate: "-1deg", opacity: "0.25" },
  { top: "80%", left: "35%", size: "text-lg md:text-2xl", rotate: "1deg",  opacity: "0.20" },
];

export default function CompanyCloud() {
  return (
    <section className="relative h-[300px] md:h-[420px] overflow-hidden">
      <div className="absolute inset-0">
        {COMPANIES.map((company, i) => {
          const pos = POSITIONS[i];
          return (
            <span
              key={company}
              className={`absolute font-serif font-bold select-none transition-opacity ${pos.size} ${pos.highlight ? "text-[#ef562a]" : "text-[var(--gray-300)]"}`}
              style={{
                top: pos.top,
                left: pos.left,
                transform: `rotate(${pos.rotate})`,
                opacity: pos.opacity,
              }}
            >
              {company.toUpperCase()}
            </span>
          );
        })}
      </div>
    </section>
  );
}
