"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FilmCamera,
  MagnifierChart,
  MicAndCamera,
  PhoneOnStand,
  RisingBars,
  Sparkles,
  Target,
} from "./Illustrations";

export const SLIDE_COUNT = 10;

/* Shared type styles. Headings are heavy sans to match the reference deck. */
const H = "font-black tracking-tight leading-[0.95]";
const eyebrow = "text-xs md:text-sm font-semibold uppercase tracking-[0.18em] text-[var(--deck-rose)]";

/** One 16:9 card. In present mode only the active card renders, sized to the screen. */
function Card({
  index,
  presenting,
  active,
  children,
  className = "",
}: {
  index: number;
  presenting: boolean;
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  if (presenting && !active) return null;
  const size = presenting
    ? "w-[min(94vw,calc(90vh*16/9))] aspect-video"
    : "w-full md:min-h-[540px] snap-start scroll-mt-28 md:scroll-mt-32";
  return (
    <section
      data-slide={index}
      aria-label={`Slide ${index + 1} of ${SLIDE_COUNT}`}
      className={`relative ${size} flex flex-col rounded-lg md:rounded-xl overflow-hidden shadow-[0_10px_40px_-15px_rgba(42,38,40,0.35)] ${presenting ? "ring-1 ring-white/10" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

/** A left-bordered list row, like the reference's Job 2 slide. */
function Row({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-[3px] border-[var(--deck-rose)] pl-4 md:pl-5">
      <p className="text-base md:text-lg lg:text-xl font-semibold text-[var(--deck-text)]">{title}</p>
      <p className="mt-1 text-sm md:text-base lg:text-lg text-[var(--deck-text)] opacity-85 leading-snug">{body}</p>
    </div>
  );
}

function PresentIcon({ exit = false }: { exit?: boolean }) {
  return exit ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v4m0-4h4m7 5l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4m7-5l5 5m0 0v-4m0 4h-4" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  );
}

export default function Deck() {
  const [current, setCurrent] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const presentingRef = useRef(false);
  useEffect(() => {
    presentingRef.current = presenting;
  }, [presenting]);

  const clamp = (i: number) => Math.max(0, Math.min(SLIDE_COUNT - 1, i));

  const goTo = useCallback((i: number) => {
    const target = clamp(i);
    if (presentingRef.current) {
      setCurrent(target);
      return;
    }
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-slide="${target}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const enterPresent = useCallback(() => {
    setPresenting(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  const exitPresent = useCallback(() => {
    setPresenting(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }, []);

  // Leaving browser fullscreen (for example via Esc) also leaves present mode
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement && presentingRef.current) setPresenting(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // After leaving present mode, land the page on the slide you were viewing
  const wasPresenting = useRef(false);
  useEffect(() => {
    if (wasPresenting.current && !presenting) {
      rootRef.current
        ?.querySelector<HTMLElement>(`[data-slide="${current}"]`)
        ?.scrollIntoView({ behavior: "auto", block: "start" });
    }
    wasPresenting.current = presenting;
  }, [presenting, current]);

  // Keep the page from scrolling behind the overlay
  useEffect(() => {
    if (!presenting) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [presenting]);

  // Keyboard: left/right (and up/down, space, page keys) move slides. Esc exits present mode. P or F enters it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        goTo(current + 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        goTo(current - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(SLIDE_COUNT - 1);
      } else if (e.key === "Escape" && presenting) {
        e.preventDefault();
        exitPresent();
      } else if ((e.key === "p" || e.key === "f") && !presenting && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        enterPresent();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, presenting, goTo, enterPresent, exitPresent]);

  // Track which card is in view while scrolling
  useEffect(() => {
    if (presenting) return;
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((en) => en.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setCurrent(Number((visible.target as HTMLElement).dataset.slide));
      },
      { threshold: [0.5, 0.75] }
    );
    root.querySelectorAll<HTMLElement>("[data-slide]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [presenting]);

  const rootClass = presenting
    ? "fixed inset-0 z-[100] bg-[var(--deck-backdrop)] flex items-center justify-center p-4"
    : "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-6 md:space-y-8";

  return (
    <div ref={rootRef} className={rootClass}>
      {!presenting && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--gray-600)]">
            Keynote · October 8, 2026 · Arrow keys move between slides.
          </p>
          <button
            type="button"
            onClick={enterPresent}
            className="inline-flex items-center gap-2 bg-[var(--cta-bg)] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            <PresentIcon />
            Present
          </button>
        </div>
      )}

      {/* 1. Title */}
      <Card index={0} presenting={presenting} active={current === 0} className="bg-[var(--deck-primary)] text-[var(--deck-text)]">
        <div className="flex-1 grid md:grid-cols-[1.15fr_1fr]">
          <div className="p-8 md:p-12 lg:p-12 flex flex-col justify-between min-h-[420px] md:min-h-0">
            <p className={eyebrow}>A keynote by Naya Bere</p>
            <div>
              <h1 className={`${H} text-5xl sm:text-6xl md:text-7xl lg:text-8xl`}>
                Content
                <br />
                to Company
              </h1>
              <p className="mt-6 text-lg md:text-xl lg:text-2xl opacity-90 max-w-sm">
                Using AI to Build the
                <br />
                Next-Gen Media Company
              </p>
            </div>
          </div>
          <div className="relative hidden md:block border-l border-[var(--deck-text)]/15">
            <MicAndCamera className="absolute inset-0 w-full h-full p-6" />
          </div>
        </div>
      </Card>

      {/* 2. Opening hook */}
      <Card index={1} presenting={presenting} active={current === 1} className="bg-[var(--deck-primary)] text-[var(--deck-text)]">
        <div className="flex-1 grid md:grid-cols-[0.9fr_1.1fr] items-center">
          <div className="hidden md:block h-full p-8">
            <PhoneOnStand className="w-full h-full" />
          </div>
          <div className="p-8 md:p-12 lg:pr-14 flex flex-col justify-center">
            <h2 className={`${H} text-3xl md:text-4xl lg:text-5xl`}>
              $170K to $700K:
              <br />
              same me, one difference
            </h2>
            <p className="mt-5 text-base md:text-lg lg:text-xl opacity-90">Same me. Same niche. Same platforms.</p>
            <p className={`${H} mt-5 text-5xl md:text-6xl lg:text-7xl`}>
              One
              <br />
              difference:
              <br />
              <span className="text-[var(--deck-rose)]">AI.</span>
            </p>
            <p className="mt-6 text-sm md:text-base opacity-75">Last year: $170K. This year, so far: $700K.</p>
          </div>
        </div>
      </Card>

      {/* 3. My story */}
      <Card index={2} presenting={presenting} active={current === 2} className="bg-[var(--deck-primary)] text-[var(--deck-text)]">
        <div className="flex-1 grid md:grid-cols-[1.25fr_0.75fr]">
          <div className="p-8 md:p-12 lg:p-12 flex flex-col justify-center">
            <p className={eyebrow}>My story</p>
            <h2 className={`${H} mt-4 text-4xl md:text-5xl lg:text-6xl`}>
              I&apos;m an engineer who happens to run a media company.
            </h2>
            <ul className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm md:text-base">
              {[
                ["2020", "Taught myself to code. No CS degree."],
                ["First builds", "Tools for my dad's small business, then 2 to 3 person teams. Those became my resume."],
                ["Studios", "DreamWorks Animation. NBCUniversal."],
                ["Startup", "CTO at a venture-backed company. Left to build my own media company."],
              ].map(([k, v]) => (
                <li key={k} className="border-l-[3px] border-[var(--deck-rose)] pl-4">
                  <p className="font-semibold">{k}</p>
                  <p className="opacity-85 leading-snug">{v}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[var(--deck-ink)] p-8 md:p-10 flex flex-col justify-end">
            <p className="text-lg md:text-xl lg:text-2xl font-semibold leading-snug">
              Not a creator who picked up AI tools.
            </p>
            <p className="mt-3 text-base md:text-lg opacity-85 leading-snug">
              An engineer who could see what AI made possible here before most creators could.
            </p>
          </div>
        </div>
      </Card>

      {/* 4. What media companies are */}
      <Card index={3} presenting={presenting} active={current === 3} className="bg-[var(--deck-primary)] text-[var(--deck-text)]">
        <div className="flex-1 grid grid-rows-[1fr_auto]">
          <div className="grid md:grid-cols-[1.3fr_0.7fr]">
            <div className="p-8 md:p-12 lg:p-12 flex flex-col justify-center">
              <h2 className={`${H} text-4xl md:text-5xl lg:text-6xl`}>
                Media companies get paid for great content
              </h2>
              <p className="mt-6 text-base md:text-lg lg:text-xl opacity-85">
                Disney. Netflix. NBCUniversal.
                <br />I worked there.
              </p>
            </div>
            <div className="relative hidden md:block">
              <FilmCamera className="absolute inset-0 w-full h-full p-6" />
            </div>
          </div>
          <div className="grid md:grid-cols-3">
            <div className="bg-[var(--deck-cream)] text-[var(--deck-ink)] p-6 md:p-8">
              <p className="text-xl md:text-2xl font-bold">Great content</p>
              <p className="mt-2 text-sm md:text-base opacity-80">Quality earns attention.</p>
            </div>
            <div className="bg-[var(--deck-muted)] text-[var(--deck-text)] p-6 md:p-8">
              <p className="text-xl md:text-2xl font-bold">Attention</p>
              <p className="mt-2 text-sm md:text-base opacity-90">Without quality, it doesn&apos;t convert.</p>
            </div>
            <div className="bg-[var(--deck-ink)] text-[var(--deck-text)] p-6 md:p-8">
              <p className="text-xl md:text-2xl font-bold">Brand dollars</p>
              <p className="mt-2 text-sm md:text-base opacity-90">Brands pay for the attention content commands.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 5. The reveal */}
      <Card index={4} presenting={presenting} active={current === 4} className="bg-[var(--deck-primary)] text-[var(--deck-text)]">
        <div className="flex-1 grid md:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 md:p-12 lg:p-12 flex flex-col justify-center">
            <h2 className={`${H} text-5xl md:text-6xl lg:text-7xl`}>
              A 4X jump, and AI was the only variable
            </h2>
            <p className="mt-6 text-base md:text-lg lg:text-xl opacity-85 max-w-md">
              The media-company model you just saw is now buildable by one person.
            </p>
          </div>
          <div className="relative min-h-[260px]">
            <div className="absolute right-0 bottom-0 w-[85%] h-[80%] bg-[var(--deck-cream)] rounded-tl-[48px]" />
            <RisingBars className="absolute inset-0 w-full h-full p-8" />
          </div>
        </div>
      </Card>

      {/* 6. Two jobs */}
      <Card index={5} presenting={presenting} active={current === 5} className="bg-[var(--deck-primary)] text-[var(--deck-text)]">
        <div className="flex-1 grid md:grid-rows-[auto_1fr]">
          <div className="p-8 md:p-12 lg:p-12 md:pb-6">
            <p className={eyebrow}>The system</p>
            <h2 className={`${H} mt-4 text-4xl md:text-5xl lg:text-6xl`}>Two jobs, not a tool list</h2>
            <p className="mt-4 text-base md:text-lg opacity-85 max-w-2xl">
              The tool names are proof this is real. The job each one serves is the lesson.
            </p>
          </div>
          <div className="grid md:grid-cols-2">
            <div className="bg-[var(--deck-cream)] text-[var(--deck-ink)] p-8 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--deck-primary)]">Job 1</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold">Knowing what to make</p>
              <p className="mt-3 text-sm md:text-base opacity-80">
                What is working, what is decaying, and which partnerships are worth the next year.
              </p>
            </div>
            <div className="bg-[var(--deck-ink)] text-[var(--deck-text)] p-8 md:p-10">
              <p className={eyebrow}>Job 2</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold">Getting it out fast</p>
              <p className="mt-3 text-sm md:text-base opacity-85">
                One brand look, scaled across every format, in a voice that still sounds like me.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 7. Job 1 */}
      <Card index={6} presenting={presenting} active={current === 6} className="bg-[var(--deck-primary)] text-[var(--deck-text)]">
        <div className="flex-1 grid md:grid-cols-[1.3fr_0.7fr]">
          <div className="p-8 md:p-12 lg:p-12 flex flex-col justify-center">
            <p className={eyebrow}>Job 1</p>
            <h2 className={`${H} mt-3 text-4xl md:text-5xl lg:text-6xl`}>Knowing what to make</h2>
            <div className="mt-6 space-y-4">
              <Row
                title="Content strategy agent, built with Perplexity"
                body="Tells me what is actually working before I film anything. No more guessing."
              />
              <Row title="Monthly audits with Perplexity" body="Catch what is decaying before the numbers do." />
              <Row
                title="Claude for partnerships"
                body="Identifies long-term brand partnerships worth pursuing, not one-off deals."
              />
            </div>
            <p className="mt-6 text-sm md:text-base opacity-85">
              <span className="text-[var(--deck-rose)] font-semibold">Proof it is real:</span> the strategy agent was the first thing I built inside Disgustingly Paid, and it became the most-used tool there.
            </p>
          </div>
          <div className="relative bg-[var(--deck-ink)] hidden md:block">
            <MagnifierChart className="absolute inset-0 w-full h-full p-8" />
          </div>
        </div>
      </Card>

      {/* 8. Job 2 + result */}
      <Card index={7} presenting={presenting} active={current === 7} className="bg-[var(--deck-primary)] text-[var(--deck-text)]">
        <div className="flex-1 grid md:grid-cols-[1.3fr_0.7fr]">
          <div className="p-8 md:p-12 lg:p-12 flex flex-col justify-between">
            <div>
              <p className={eyebrow}>Job 2</p>
              <h2 className={`${H} mt-3 text-4xl md:text-5xl lg:text-6xl`}>Get it out fast, in my voice</h2>
              <div className="mt-6 space-y-4">
                <Row title="Grok Bot" body="One human-designed brand look. Carousels and videos at scale." />
                <Row title="&ldquo;Future Me&rdquo; GPT" body="Decisions aligned with where the brand is headed." />
                <Row title="AI trained on my voice" body="Repurpose across platforms without sounding synthetic." />
              </div>
            </div>
            <p className="mt-6 text-xl md:text-2xl lg:text-3xl font-semibold">
              <span className="text-[var(--deck-rose)]">$200K+</span> in long-term brand deals alone
            </p>
          </div>
          <div className="relative bg-[var(--deck-ink)] min-h-[360px] md:min-h-0">
            <video
              src="/videos/ai-edited-reel.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="A reel from my feed, edited by AI, playing muted"
              className="absolute inset-0 w-full h-full object-contain p-5 md:p-6 pb-10 md:pb-12"
            />
            <p className="absolute bottom-3 left-5 md:left-6 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--deck-rose)]">
              Real example: an AI-edited reel, muted
            </p>
          </div>
        </div>
      </Card>

      {/* 9. Advice */}
      <Card index={8} presenting={presenting} active={current === 8} className="bg-[var(--deck-primary)] text-[var(--deck-text)]">
        <div className="flex-1 grid md:grid-rows-[auto_1fr]">
          <div className="grid md:grid-cols-[0.6fr_1.4fr] items-end">
            <div className="relative hidden md:block h-40">
              <Target className="absolute left-6 -bottom-16 w-56 h-56" />
            </div>
            <div className="p-8 md:p-12 lg:p-12 md:pb-6">
              <h2 className={`${H} text-4xl md:text-5xl lg:text-6xl`}>
                Starting today: keep it simple, make it easy
              </h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2">
            <div className="bg-[var(--deck-cream)] text-[var(--deck-ink)] p-8 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--deck-primary)]">Keep it simple</p>
              <p className="mt-2 text-2xl md:text-3xl font-bold">Pick one clear person to talk to.</p>
              <p className="mt-3 text-sm md:text-base opacity-80">
                Mine: disgustingly ambitious professionals who want to use AI to build skills, wealth, and freedom.
              </p>
            </div>
            <div className="bg-[var(--deck-ink)] text-[var(--deck-text)] p-8 md:p-10">
              <p className={eyebrow}>Make it easy</p>
              <ul className="mt-2 space-y-1 text-xl md:text-2xl font-bold">
                <li>AI tells me what to post next.</li>
                <li>AI edits for me.</li>
                <li>AI repurposes everything, in my voice.</li>
              </ul>
              <p className="mt-4 text-sm md:text-base opacity-85">
                The editing tool is the one I&apos;m proudest of. It replaced the slowest step in my week and gave me that time back.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 10. Close */}
      <Card index={9} presenting={presenting} active={current === 9} className="bg-[var(--deck-primary)] text-[var(--deck-text)]">
        <div className="flex-1 grid md:grid-cols-[1.3fr_0.7fr]">
          <div className="p-8 md:p-12 lg:p-12 flex flex-col justify-center">
            <p className="text-base md:text-lg opacity-85 max-w-xl">
              Now, like any traditional media company, brands pay me for the content I can create and the attention I can bring to their products.
            </p>
            <h2 className={`${H} mt-6 text-4xl md:text-5xl lg:text-6xl`}>
              I built the thing those companies are built on.{" "}
              <span className="text-[var(--deck-rose)]">A media company.</span>
            </h2>
            <p className={`${H} mt-6 text-2xl md:text-3xl lg:text-4xl`}>
              And with what&apos;s available right now, so can you.
            </p>
            <p className="font-script text-3xl md:text-4xl mt-8 text-[var(--deck-rose)]">Naya</p>
          </div>
          <div className="relative bg-[var(--deck-ink)] hidden md:block">
            <Sparkles className="absolute inset-0 w-full h-full p-10" />
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="fixed bottom-5 right-5 z-[110] flex items-center gap-2 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] px-3 py-2 shadow-lg">
        <button
          type="button"
          onClick={presenting ? exitPresent : enterPresent}
          aria-label={presenting ? "Exit presentation" : "Present"}
          title={presenting ? "Exit (Esc)" : "Present (P)"}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--gray-100)] transition-colors"
        >
          <PresentIcon exit={presenting} />
        </button>
        <span className="w-px h-5 bg-[var(--card-border)]" aria-hidden="true" />
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          aria-label="Previous slide"
          disabled={current === 0}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--gray-100)] disabled:opacity-30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <span className="text-sm tabular-nums text-[var(--gray-600)] px-1">
          {current + 1} / {SLIDE_COUNT}
        </span>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          aria-label="Next slide"
          disabled={current === SLIDE_COUNT - 1}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--gray-100)] disabled:opacity-30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
