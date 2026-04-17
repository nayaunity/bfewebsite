"use client";

import { useEffect, useState } from "react";

const SLIDE_MS = 3500;

const SLIDES = [
  { key: "match", render: () => <MatchSlide /> },
  { key: "apply", render: () => <ApplySlide /> },
  { key: "autopilot", render: () => <AutopilotSlide /> },
  { key: "handled", render: () => <HandledSlide /> },
];

export default function ExtractingLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center py-10">
      <div className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--gray-50)] px-5 py-3">
        <div className="font-serif text-base font-bold">
          the<span className="text-[#ef562a]">BFE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#ef562a]" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#ef562a]" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#ef562a]" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      <div key={index} className="w-full max-w-xl animate-fade-in">
        {SLIDES[index].render()}
      </div>

      <div className="mt-8 flex gap-2">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-8 bg-[#ef562a]" : "w-1.5 bg-[var(--gray-200)]"
            }`}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        div[class*="animate-fade-in"] { animation: fade-in 400ms ease-out; }
      `}</style>
    </section>
  );
}

function SlideFrame({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--gray-600)]">{eyebrow}</p>
      <h2 className="mb-2 font-serif text-2xl sm:text-3xl">{title}</h2>
      <p className="mb-5 text-sm text-[var(--gray-600)] sm:text-base">{subtitle}</p>
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--gray-50)] p-5 text-left sm:p-6">
        {children}
      </div>
    </div>
  );
}

function MatchSlide() {
  return (
    <SlideFrame
      eyebrow="How it works"
      title="We find + match you to the best jobs"
      subtitle="Our system scans listings across the web — surfacing roles that match your skills, goals, and pay range."
    >
      <div className="mb-4 flex gap-2 text-xs">
        <span className="font-medium">Job Matches</span>
        <span className="text-[var(--gray-600)]">&gt;</span>
        <span className="text-[var(--gray-600)]">Applying</span>
        <span className="text-[var(--gray-600)]">&gt;</span>
        <span className="text-[var(--gray-600)]">Applied</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3">
          <div className="space-y-1.5">
            <div className="h-2 w-32 rounded bg-[var(--gray-200)]" />
            <div className="h-2 w-24 rounded bg-[var(--gray-100)]" />
          </div>
          <span className="text-xs font-medium text-green-600">96% match</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3">
          <div className="space-y-1.5">
            <div className="h-2 w-28 rounded bg-[var(--gray-200)]" />
            <div className="h-2 w-20 rounded bg-[var(--gray-100)]" />
          </div>
          <span className="text-xs font-medium text-green-600">95% match</span>
        </div>
      </div>
    </SlideFrame>
  );
}

function ApplySlide() {
  return (
    <SlideFrame
      eyebrow="How it works"
      title="We fill out applications for you"
      subtitle="You get applied to vetted, high-match jobs — directly on the company website, tailoring each application."
    >
      <div className="mb-4 flex gap-2 text-xs">
        <span className="text-[var(--gray-600)]">Job Matches</span>
        <span className="text-[#ef562a]">&gt;</span>
        <span className="font-medium text-[#ef562a]">Applying</span>
        <span className="text-[var(--gray-600)]">&gt;</span>
        <span className="text-[var(--gray-600)]">Applied</span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3">
        <div className="space-y-1.5">
          <div className="h-2 w-32 rounded bg-[var(--gray-200)]" />
          <div className="h-2 w-24 rounded bg-[var(--gray-100)]" />
        </div>
        <span className="flex items-center gap-1.5 text-xs text-[var(--gray-600)]">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--gray-200)] border-t-[#ef562a]" />
          Applying...
        </span>
      </div>
    </SlideFrame>
  );
}

function AutopilotSlide() {
  return (
    <SlideFrame
      eyebrow="How it works"
      title="Autopilot applies while you sleep"
      subtitle="BFE works around the clock — you wake up to fresh applications submitted overnight. Being early gives you a real edge."
    >
      <div className="mb-4 flex items-center justify-center gap-2">
        <div className="relative h-5 w-10 rounded-full bg-[#ef562a]">
          <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
        </div>
        <span className="text-sm font-medium">Autopilot on</span>
      </div>
      <div className="space-y-2">
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 h-2 w-28 rounded bg-[var(--gray-200)]" />
              <span className="text-[10px] text-[var(--gray-600)]">
                Applied at <strong>3:42 AM</strong>
              </span>
            </div>
            <span className="text-xs font-medium text-green-600">Applied</span>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 h-2 w-32 rounded bg-[var(--gray-200)]" />
              <span className="text-[10px] text-[var(--gray-600)]">
                Applied at <strong>5:18 AM</strong>
              </span>
            </div>
            <span className="text-xs font-medium text-green-600">Applied</span>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}

function HandledSlide() {
  return (
    <SlideFrame
      eyebrow="How it works"
      title="Your job search, handled for you"
      subtitle="We apply, track, and manage everything so interviews come to you. You focus on what matters."
    >
      <div className="mb-4 flex gap-2 text-xs">
        <span className="text-[var(--gray-600)]">Job Matches</span>
        <span className="text-[var(--gray-600)]">&gt;</span>
        <span className="text-[var(--gray-600)]">Applying</span>
        <span className="text-green-600">&gt;</span>
        <span className="font-medium text-green-600">Applied</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3">
          <div className="h-2 w-32 rounded bg-[var(--gray-200)]" />
          <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">Applied</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3">
          <div className="h-2 w-28 rounded bg-[var(--gray-200)]" />
          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">Interview</span>
        </div>
      </div>
    </SlideFrame>
  );
}
