"use client";

import ResumeDrop from "./ResumeDrop";
import LiveFeedCard from "./LiveFeedCard";

const AVATARS = [
  { bg: "#fb923c", initials: "MK" },
  { bg: "#fbbf24", initials: "JT" },
  { bg: "#a78bfa", initials: "PS" },
  { bg: "#34d399", initials: "AW" },
];

export default function HeroSection() {
  return (
    <section className="pt-16 md:pt-[70px] pb-16 md:pb-[100px] px-4 sm:px-8 max-w-[1280px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-[60px] items-center">
        {/* Left column */}
        <div>
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-[7px] bg-white border border-[#f0e6d6] rounded-full text-[13px] text-[#3a3a3a] font-medium mb-7">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: "#10b981", boxShadow: "0 0 0 4px rgba(16,185,129,0.18)" }}
            />
            <span>1,847 applications sent this month alone</span>
          </div>

          {/* Headline */}
          <h1
            className="font-serif font-medium leading-[0.98] tracking-[-2px] m-0"
            style={{ fontSize: "clamp(48px, 6.5vw, 92px)" }}
          >
            Your job hunt,<br />
            done while you<br />
            <span className="italic text-[#4d1b27]">do literally</span><br />
            <span className="italic text-[#4d1b27]">anything else.</span>
          </h1>

          {/* Lede */}
          <p className="text-[19px] leading-relaxed text-[#3a3a3a] mt-7 max-w-[540px]">
            Drop your resume. We find roles that actually fit you, tailor an
            application for each one, and submit them to <b>real careers pages</b> at
            Stripe, Figma, Anthropic, and 200+ more.
          </p>

          {/* Resume Drop */}
          <div className="mt-7 max-w-[540px]">
            <ResumeDrop theme="light" />
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3.5 mt-6">
            <div className="flex">
              {AVATARS.map((a, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full text-xs text-white font-bold grid place-items-center"
                  style={{
                    background: a.bg,
                    border: "2px solid #fff7ed",
                    marginLeft: i ? -10 : 0,
                  }}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <div className="text-[13px] text-[#52525b] leading-snug">
              <b className="text-[#2a2828]">100+</b> people stopped staring<br />at LinkedIn this week.
            </div>
          </div>
        </div>

        {/* Right column: Live Feed */}
        <div className="lg:rotate-[1.5deg]">
          <LiveFeedCard />
        </div>
      </div>
    </section>
  );
}
