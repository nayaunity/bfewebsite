"use client";

import { useEffect, useState } from "react";

interface Props {
  onApply: () => void;
}

const COMPANIES = [
  "Stripe",
  "Anthropic",
  "Figma",
  "Vercel",
  "Notion",
  "Linear",
  "OpenAI",
  "Airbnb",
];

const BENEFITS = [
  "No manual forms, ever",
  "We apply while you sleep",
  "New matches added daily",
];

const TARGET_COUNT = 300;
const COUNT_DURATION_MS = 1400;

export default function MatchedJobsPreview({ onApply }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frameId = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / COUNT_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * TARGET_COUNT));
      if (progress < 1) frameId = requestAnimationFrame(tick);
      else setCount(TARGET_COUNT);
    };
    frameId = requestAnimationFrame(tick);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    if (!prefersReducedMotion) {
      import("canvas-confetti").then(({ default: confetti }) => {
        const colors = ["#ef562a", "#ffe500", "#ffffff"];
        timeouts.push(
          setTimeout(
            () =>
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.3 },
                colors,
                scalar: 0.9,
              }),
            150,
          ),
        );
        timeouts.push(
          setTimeout(
            () =>
              confetti({
                particleCount: 60,
                spread: 90,
                origin: { x: 0.3, y: 0.3 },
                colors,
                scalar: 0.9,
              }),
            550,
          ),
        );
        timeouts.push(
          setTimeout(
            () =>
              confetti({
                particleCount: 60,
                spread: 90,
                origin: { x: 0.7, y: 0.3 },
                colors,
                scalar: 0.9,
              }),
            700,
          ),
        );
      });
    }

    return () => {
      cancelAnimationFrame(frameId);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <section className="text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#ef562a]/10 px-4 py-2 text-sm font-medium text-[#ef562a]">
        <span>✨</span>
        <span>Your matches are ready</span>
      </div>

      <h1 className="font-serif text-7xl italic leading-none text-[#ef562a] tabular-nums sm:text-8xl md:text-[10rem]">
        {count}+
      </h1>

      <p className="mt-4 font-serif text-2xl sm:text-3xl">
        jobs matched to your resume
      </p>
      <p className="mt-3 text-[var(--gray-600)]">
        We apply to every role that matches your background — starting today.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {COMPANIES.map((company) => (
          <span
            key={company}
            className="inline-flex items-center rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--gray-800)]"
          >
            {company}
          </span>
        ))}
        <span className="inline-flex items-center rounded-full bg-[var(--gray-50)] px-4 py-2 text-sm font-medium text-[var(--gray-600)]">
          + 300 more
        </span>
      </div>

      <ul className="mx-auto mt-10 inline-flex flex-col gap-3 text-left">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-center gap-3 text-[var(--gray-800)]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ef562a] text-xs font-bold text-white">
              ✓
            </span>
            <span className="text-base">{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onApply}
          className="rounded-full bg-[#ef562a] px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-[#ef562a]/30 transition hover:bg-[#d84a21] hover:shadow-xl"
        >
          Start 7-day free trial
        </button>
        <p className="text-xs text-[var(--gray-600)]">$0 today · Cancel anytime before day 8</p>
      </div>
    </section>
  );
}
