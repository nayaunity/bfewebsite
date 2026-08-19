"use client";

import { useEffect, useRef, useState } from "react";
import {
  ARCHETYPES,
  QUESTIONS,
  TIEBREAK,
  type Archetype,
  type ArchetypeKey,
} from "./quizData";

const LETTERS = ["A", "B", "C", "D"];

function scoreAnswers(answers: (number | null)[]): {
  winner: Archetype;
  secondary: Archetype;
} {
  const totals: Record<ArchetypeKey, number> = {
    builder: 0,
    maker: 0,
    artist: 0,
    translator: 0,
    operator: 0,
    guide: 0,
  };
  answers.forEach((choice, qi) => {
    if (choice === null) return;
    const scores = QUESTIONS[qi].options[choice].scores;
    (Object.keys(scores) as ArchetypeKey[]).forEach((key) => {
      totals[key] += scores[key] ?? 0;
    });
  });
  const ranked = [...TIEBREAK].sort((a, b) => {
    if (totals[b] !== totals[a]) return totals[b] - totals[a];
    return TIEBREAK.indexOf(a) - TIEBREAK.indexOf(b);
  });
  return { winner: ARCHETYPES[ranked[0]], secondary: ARCHETYPES[ranked[1]] };
}

function Masthead() {
  return (
    <header className="flex items-center gap-3 mb-12">
      <svg
        className="w-8 h-8 text-[var(--accent)]"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <rect
          x="1.25"
          y="1.25"
          width="29.5"
          height="29.5"
          rx="9"
          stroke="currentColor"
          strokeWidth="2.5"
          opacity="0.35"
        />
        <path d="M8 22.5V17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M14.6 22.5V12.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M21.2 22.5V9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M8 9.5h4.2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <circle cx="24.6" cy="9" r="2.4" fill="currentColor" opacity="0.6" />
      </svg>
      <span>
        <span className="block font-serif text-lg leading-tight text-[var(--foreground)]">
          AI Income Lab
        </span>
        <span className="block text-xs text-[var(--gray-600)]">
          by Naya · The Black Female Engineer
        </span>
      </span>
    </header>
  );
}

function ResultView({
  winner,
  secondary,
  onRestart,
}: {
  winner: Archetype;
  secondary: Archetype;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "monetizable-skill-quiz-complete",
        title: `Skill Quiz Result: ${winner.name}`,
      }),
    }).catch(() => {});
  }, [winner.name]);

  const shareText = `My monetizable skill archetype is ${winner.name}: ${winner.identity} Now I'm building the AI-powered income stream. #AIIncomeLab`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard unavailable; the share line is still selectable.
    }
  }

  return (
    <div>
      <p className="text-xs tracking-[0.25em] uppercase text-[var(--accent)] font-bold mb-4">
        Your monetizable skill archetype
      </p>

      <h1 className="font-serif text-[2.5rem] md:text-[3.25rem] leading-[1.1] text-[var(--foreground)] mb-4">
        <span className="italic text-[var(--accent)]">{winner.name}</span>
      </h1>

      <p className="text-xl leading-relaxed text-[var(--foreground)] mb-10">
        {winner.identity}
      </p>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 md:p-7 mb-8">
        <h2 className="text-xs tracking-[0.2em] uppercase font-bold text-[var(--accent)] mb-2">
          What you&apos;re actually selling
        </h2>
        <p className="text-base leading-relaxed text-[var(--gray-700)]">
          {winner.selling}
        </p>
      </div>

      <div className="mb-8">
        <h2 className="font-serif text-2xl text-[var(--foreground)] mb-5">
          Your AI-powered income stream
        </h2>
        <ol className="space-y-4">
          {winner.plays.map((play, i) => (
            <li
              key={play.label}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 md:p-7"
            >
              <p className="text-xs tracking-[0.2em] uppercase font-bold text-[var(--accent)] mb-2">
                {i + 1} · {play.label}
              </p>
              <p className="text-base leading-relaxed text-[var(--gray-700)]">
                {play.text}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-[var(--dark-section-bg)] border border-[var(--card-border)] rounded-2xl p-6 md:p-7 mb-4">
        <h2 className="text-xs tracking-[0.2em] uppercase font-bold text-[#f3f3f1]/70 mb-2">
          Your first move this week
        </h2>
        <p className="text-base leading-relaxed text-[#f3f3f1]">
          {winner.firstMove}
        </p>
      </div>

      <div className="bg-[var(--surface-warm)] border border-[var(--border-warm)] rounded-2xl p-6 md:p-7 mb-4">
        <h2 className="text-xs tracking-[0.2em] uppercase font-bold text-[var(--accent)] mb-2">
          Watch out for
        </h2>
        <p className="text-base leading-relaxed text-[var(--gray-700)]">
          {winner.watchOut}
        </p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 md:p-7 mb-10">
        <h2 className="text-xs tracking-[0.2em] uppercase font-bold text-[var(--accent)] mb-2">
          Your secondary edge
        </h2>
        <p className="text-base leading-relaxed text-[var(--gray-700)]">
          Your secondary edge is {secondary.name}. That combination is your
          unfair advantage. Most people only have one. Lead with {winner.name},
          and let {secondary.name} be the reason you&apos;re impossible to
          copy.
        </p>
      </div>

      <div className="mb-10">
        <p className="text-base leading-relaxed text-[var(--gray-700)] italic border-l-[3px] border-[var(--accent)] pl-4 mb-5">
          {shareText}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="w-full py-3.5 rounded-full text-base font-medium bg-[var(--cta-bg)] text-[#f3f3f1] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          {copied ? "Copied" : "Copy my result"}
        </button>
        <p className="text-sm text-[var(--gray-600)] text-center mt-3" role="status">
          {copied
            ? "Copied. Share your result with the class."
            : "Share your result with the class."}
        </p>
      </div>

      <div className="text-center mb-10">
        <p className="text-base leading-relaxed text-[var(--gray-700)]">
          This is exactly what we do inside{" "}
          <span className="font-medium text-[var(--foreground)]">
            AI Income Lab
          </span>
          : turn one skill into an AI-powered income stream in 90 days.
        </p>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="w-full py-3 rounded-full text-base font-medium border border-[var(--card-border)] text-[var(--gray-700)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
      >
        Retake the quiz
      </button>
    </div>
  );
}

export default function QuizClient() {
  const [screen, setScreen] = useState<"intro" | "quiz" | "result">("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => new Array(QUESTIONS.length).fill(null)
  );
  const [picked, setPicked] = useState<number | null>(null);
  const advancingRef = useRef(false);

  function handlePick(index: number) {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setPicked(index);
    const next = [...answers];
    next[current] = index;
    setAnswers(next);

    setTimeout(() => {
      advancingRef.current = false;
      setPicked(null);
      if (current < QUESTIONS.length - 1) {
        setCurrent(current + 1);
        window.scrollTo(0, 0);
      } else {
        setScreen("result");
        window.scrollTo(0, 0);
      }
    }, 260);
  }

  function handleBack() {
    if (advancingRef.current) return;
    if (current === 0) {
      setScreen("intro");
      return;
    }
    setCurrent(current - 1);
  }

  function handleRestart() {
    setAnswers(new Array(QUESTIONS.length).fill(null));
    setCurrent(0);
    setScreen("intro");
    window.scrollTo(0, 0);
  }

  const question = QUESTIONS[current];
  const result = screen === "result" ? scoreAnswers(answers) : null;

  return (
    <main className="min-h-svh bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[640px] px-6 pt-10 pb-16 md:pt-16">
        <Masthead />

        {screen === "intro" && (
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-[var(--gray-600)] mb-4">
              The Monetizable Skill Quiz
            </p>
            <h1 className="font-serif text-[2.25rem] md:text-[3rem] leading-[1.1] text-[var(--foreground)] mb-6">
              What&apos;s your most{" "}
              <span className="italic text-[var(--accent)]">
                monetizable skill?
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-[var(--gray-700)] mb-8">
              Your skill doesn&apos;t have to have anything to do with AI. In
              12 questions, find the one you should be getting paid for, and
              exactly how AI turns it into income.
            </p>
            <p className="font-serif italic text-xl text-[var(--accent)] border-l-[3px] border-[var(--accent)] pl-4 mb-10">
              AI is not the brains. You are.
            </p>
            <button
              type="button"
              onClick={() => {
                setScreen("quiz");
                window.scrollTo(0, 0);
              }}
              className="px-8 py-3.5 rounded-full text-base font-medium bg-[var(--cta-bg)] text-[#f3f3f1] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              Start the quiz
            </button>
            <p className="text-sm text-[var(--gray-600)] mt-5">
              2 minutes. No email required.
            </p>
          </div>
        )}

        {screen === "quiz" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-[var(--gray-600)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                aria-label="Go back to the previous question"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 4.5 6.5 10 12 15.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Back</span>
              </button>
              <p className="text-sm text-[var(--gray-600)]" aria-live="polite">
                Question {current + 1} of {QUESTIONS.length}
              </p>
            </div>

            <div
              className="h-1.5 rounded-full bg-[var(--surface-warm)] border border-[var(--border-warm)] overflow-hidden mb-10"
              role="progressbar"
              aria-label="Quiz progress"
              aria-valuemin={0}
              aria-valuemax={QUESTIONS.length}
              aria-valuenow={current + 1}
            >
              <div
                className="h-full rounded-full bg-[var(--cta-bg)] transition-all duration-300"
                style={{
                  width: `${((current + 1) / QUESTIONS.length) * 100}%`,
                }}
              />
            </div>

            <h2 className="font-serif text-2xl md:text-3xl leading-[1.2] text-[var(--foreground)] mb-8">
              {question.q}
            </h2>

            <div
              className="space-y-3"
              role="group"
              aria-label={question.q}
            >
              {question.options.map((option, i) => {
                const isPicked =
                  picked !== null ? picked === i : answers[current] === i;
                return (
                  <button
                    key={option.text}
                    type="button"
                    onClick={() => handlePick(i)}
                    className={`w-full flex items-start gap-4 text-left px-5 py-4 rounded-xl text-base leading-relaxed border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                      isPicked
                        ? "bg-[var(--surface-warm)] border-[var(--accent)] text-[var(--foreground)]"
                        : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--gray-700)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        isPicked
                          ? "bg-[var(--cta-bg)] text-[#f3f3f1]"
                          : "bg-[var(--surface-warm)] text-[var(--accent)]"
                      }`}
                    >
                      {LETTERS[i]}
                    </span>
                    <span>{option.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {screen === "result" && result && (
          <ResultView
            winner={result.winner}
            secondary={result.secondary}
            onRestart={handleRestart}
          />
        )}

        <footer className="mt-16 pt-6 border-t border-[var(--border-warm)]">
          <p className="text-xs text-[var(--gray-600)]">
            AI Income Lab · Naya, The Black Female Engineer ·{" "}
            <a href="/privacy" className="underline hover:no-underline">
              Privacy Policy
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
