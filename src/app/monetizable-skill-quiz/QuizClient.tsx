"use client";

import { useEffect, useRef, useState } from "react";
import {
  COMBO_NOTES,
  ENTRY_COPY,
  ENTRY_QUESTIONS,
  EVIDENCE_HOMEWORK,
  EVIDENCE_PROMPT_LINE,
  FAMILIES,
  FAMILY_ORDER,
  FAMILY_QUESTIONS,
  MODES,
  REPEATABILITY_QUESTIONS,
  VISIBILITY_QUESTIONS,
  type Evidence,
  type EntryPhase,
  type Family,
  type FamilyKey,
  type Mode,
  type ModeKey,
} from "./quizData";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

type Step = {
  part: string;
  partBlurb?: string;
  q: string;
  options: { text: string }[];
};

const STEPS: Step[] = [
  ...FAMILY_QUESTIONS.map((fq, i) => ({
    part: "Part A · Your skill family",
    partBlurb:
      i === 0
        ? "What you can do determines what you sell."
        : undefined,
    q: fq.q,
    options: fq.options,
  })),
  ...VISIBILITY_QUESTIONS.map((vq, i) => ({
    part: "Part B · How you deliver",
    partBlurb:
      i === 0 ? "How you're wired determines how you sell it." : undefined,
    q: vq.q,
    options: vq.options,
  })),
  ...REPEATABILITY_QUESTIONS.map((rq) => ({
    part: "Part B · How you deliver",
    q: rq.q,
    options: rq.options,
  })),
  ...ENTRY_QUESTIONS.map((eq, i) => ({
    part: "Part C · Your entry point",
    partBlurb:
      i === 0
        ? "This is why two people get the same result and different homework."
        : undefined,
    q: eq.q,
    options: eq.options,
  })),
];

const TOTAL = STEPS.length;
const FAMILY_COUNT = FAMILY_QUESTIONS.length; // 6
const VIS_START = FAMILY_COUNT; // 6..8
const REP_START = VIS_START + VISIBILITY_QUESTIONS.length; // 9..11
const ENTRY_START = REP_START + REPEATABILITY_QUESTIONS.length; // 12..13

type QuizResult = {
  family: Family;
  mode: Mode;
  tally: Record<FamilyKey, number>;
  comboNote: string | null;
  comboPartner: Family | null;
  kNote: boolean;
  entry: EntryPhase;
  evidence: Evidence;
  q2Text: string;
  q3Text: string;
};

function computeResult(answers: (number | null)[]): QuizResult {
  const tally: Record<FamilyKey, number> = {
    s: 0,
    w: 0,
    v: 0,
    p: 0,
    t: 0,
    k: 0,
  };
  FAMILY_QUESTIONS.forEach((fq, i) => {
    const a = answers[i];
    if (a !== null) tally[fq.options[a].family] += 1;
  });

  const max = Math.max(...FAMILY_ORDER.map((f) => tally[f]));
  let leaders = FAMILY_ORDER.filter((f) => tally[f] === max);

  let winner: FamilyKey;
  let comboNote: string | null = null;
  let comboPartner: FamilyKey | null = null;

  if (leaders.length === 1) {
    winner = leaders[0];
  } else {
    // Tie-break 1: Q6 decides. Money already earned beats aptitude.
    const q6Answer = answers[5];
    const q6Letter =
      q6Answer !== null ? FAMILY_QUESTIONS[5].options[q6Answer].family : null;
    if (q6Letter && leaders.includes(q6Letter)) {
      winner = q6Letter;
    } else {
      // Tie-break 2: take the pair as a combination. The spec says Insider
      // Knowledge nearly always beats the other letter, so K leads a combo.
      if (leaders.includes("k")) {
        leaders = ["k", ...leaders.filter((f) => f !== "k")];
      }
      winner = leaders[0];
      comboPartner = leaders[1];
      const comboKeys = [winner, comboPartner].sort(
        (a, b) => FAMILY_ORDER.indexOf(a) - FAMILY_ORDER.indexOf(b)
      );
      comboNote =
        COMBO_NOTES[`${comboKeys[0]}+${comboKeys[1]}`] ??
        `${FAMILIES[comboKeys[0]].letter}+${FAMILIES[comboKeys[1]].letter} is a combination worth naming in your offer.`;
    }
  }

  let visibleVotes = 0;
  VISIBILITY_QUESTIONS.forEach((vq, i) => {
    const a = answers[VIS_START + i];
    if (a !== null && vq.options[a].value === "visible") visibleVotes += 1;
  });
  let repeatableVotes = 0;
  REPEATABILITY_QUESTIONS.forEach((rq, i) => {
    const a = answers[REP_START + i];
    if (a !== null && rq.options[a].value === "repeatable")
      repeatableVotes += 1;
  });
  const visibility = visibleVotes >= 2 ? "visible" : "invisible";
  const repeatability = repeatableVotes >= 2 ? "repeatable" : "bespoke";
  const modeKey = `${visibility}-${repeatability}` as ModeKey;

  const entryAnswer = answers[ENTRY_START];
  const entry: EntryPhase =
    entryAnswer !== null
      ? (ENTRY_QUESTIONS[0].options[entryAnswer].value as EntryPhase)
      : "phase2";
  const evidenceAnswer = answers[ENTRY_START + 1];
  const evidence: Evidence =
    evidenceAnswer !== null
      ? (ENTRY_QUESTIONS[1].options[evidenceAnswer].value as Evidence)
      : "none";

  const q2Text =
    answers[1] !== null ? FAMILY_QUESTIONS[1].options[answers[1]].text : "";
  const q3Text =
    answers[2] !== null ? FAMILY_QUESTIONS[2].options[answers[2]].text : "";

  return {
    family: FAMILIES[winner],
    mode: MODES[modeKey],
    tally,
    comboNote,
    comboPartner: comboPartner ? FAMILIES[comboPartner] : null,
    kNote: winner !== "k" && tally.k > 0,
    entry,
    evidence,
    q2Text,
    q3Text,
  };
}

function stripQuotes(text: string): string {
  return text.replace(/[“”"]/g, "");
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

// Q3 options are written in second person; flip to first person when the
// answer is inlined into the Phase 2 prompt.
function firstPerson(text: string): string {
  return text.replace(/\byou know\b/g, "I know");
}

function buildPhase2Prompt(r: QuizResult): string {
  const skillLine = `I have this skill: ${r.family.label} (${r.family.name}). People come to me with "${stripQuotes(r.q2Text)}" and more than five times I've ${firstPerson(lowerFirst(r.q3Text))}.`;
  const modeLine = `I want to sell it as: ${r.mode.label}. ${r.family.builds[r.mode.key]}.`;
  const evidenceLine = `I've already done it for: ${EVIDENCE_PROMPT_LINE[r.evidence]}.`;
  return `${skillLine}
${modeLine}
${evidenceLine}

Give me 10 specific buyer types. For each one:
- who she is, in one line specific enough that I'd recognise her
- what she's already paying for instead
- roughly what she can spend
- where she already gathers online
- why she'd buy now rather than someday

Rule out anyone I couldn't find 20 of by Friday.
Do not give me demographics. Give me situations.`;
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

function ResultCard({
  label,
  children,
  variant = "default",
}: {
  label: string;
  children: React.ReactNode;
  variant?: "default" | "warm" | "dark";
}) {
  const shell =
    variant === "dark"
      ? "bg-[var(--dark-section-bg)] border border-[var(--card-border)]"
      : variant === "warm"
        ? "bg-[var(--surface-warm)] border border-[var(--border-warm)]"
        : "bg-[var(--card-bg)] border border-[var(--card-border)]";
  const labelColor =
    variant === "dark" ? "text-[#f3f3f1]/70" : "text-[var(--accent)]";
  const bodyColor =
    variant === "dark" ? "text-[#f3f3f1]" : "text-[var(--gray-700)]";
  return (
    <div className={`${shell} rounded-2xl p-6 md:p-7 mb-4`}>
      <h2
        className={`text-xs tracking-[0.2em] uppercase font-bold mb-2 ${labelColor}`}
      >
        {label}
      </h2>
      <div className={`text-base leading-relaxed ${bodyColor}`}>{children}</div>
    </div>
  );
}

function ResultView({
  result,
  onRestart,
}: {
  result: QuizResult;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { family, mode } = result;
  const prompt = buildPhase2Prompt(result);
  const postTitle = `My path: ${family.name} + ${mode.label}`;

  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "monetizable-skill-quiz-complete",
        title: `PHASE Path: ${family.name} + ${mode.label}`,
      }),
    }).catch(() => {});
  }, [family.name, mode.label]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard unavailable; the prompt is still selectable.
    }
  }

  return (
    <div>
      <p className="text-xs tracking-[0.25em] uppercase text-[var(--accent)] font-bold mb-4">
        Your PHASE path
      </p>

      <h1 className="font-serif text-[2.5rem] md:text-[3.25rem] leading-[1.1] text-[var(--foreground)] mb-3">
        <span className="italic text-[var(--accent)]">{family.name}</span>
      </h1>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-xs font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full bg-[var(--cta-bg)] text-[#f3f3f1]">
          {family.letter} · {family.label}
        </span>
        <span className="text-xs font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full bg-[var(--surface-warm)] border border-[var(--border-warm)] text-[var(--accent)]">
          {mode.label}
        </span>
      </div>

      <p className="font-serif italic text-xl text-[var(--foreground)] mb-6">
        {family.oneLine}
      </p>

      <div className="flex flex-wrap gap-2 mb-10" aria-label="Your letter tally">
        {FAMILY_ORDER.map((f) => (
          <span
            key={f}
            className={`text-xs px-2.5 py-1 rounded-full border ${
              f === family.key
                ? "border-[var(--accent)] text-[var(--accent)] font-bold"
                : "border-[var(--card-border)] text-[var(--gray-600)]"
            }`}
          >
            {FAMILIES[f].letter} {result.tally[f]}
          </span>
        ))}
      </div>

      <ResultCard label="The thing you undersell">
        {family.undersell}
      </ResultCard>

      <ResultCard label={`Your build · ${mode.label}`}>
        <p className="mb-3 text-lg text-[var(--foreground)]">
          {family.builds[mode.key]}.
        </p>
        <p className="mb-3">
          You sell: {mode.sells.toLowerCase().replace("a gpt", "a GPT")}. Price
          shape: {mode.priceShape.toLowerCase()}.
        </p>
        <p className="text-sm text-[var(--gray-600)]">{mode.gptRule}</p>
      </ResultCard>

      <ResultCard label="Where your buyers already gather">
        {family.gathers}
      </ResultCard>

      <ResultCard label="Price band">{family.priceBand}</ResultCard>

      <ResultCard label="Your trap" variant="warm">
        {family.trap}
      </ResultCard>

      {result.comboNote && result.comboPartner && (
        <ResultCard label={`You're a combination: ${family.letter} + ${result.comboPartner.letter}`}>
          Your {family.label.toLowerCase()} and{" "}
          {result.comboPartner.label.toLowerCase()} scores tied.{" "}
          {result.comboNote} Combinations sell for more than single families,
          because fewer people have both.
        </ResultCard>
      )}

      {result.kNote && (
        <ResultCard label="You scored K. Read this." variant="warm">
          Insider Knowledge nearly always beats whichever other letter you
          scored. Years inside nursing, recruitment, teaching, logistics or law
          is a harder-to-copy asset than being good at spreadsheets, and it
          comes with a buyer you already understand. Most people score K and
          dismiss it as &ldquo;just my job&rdquo;. Don&apos;t.
        </ResultCard>
      )}

      <ResultCard label="Your entry point" variant="dark">
        <p className="mb-2">{ENTRY_COPY[result.entry]}</p>
        <p>{EVIDENCE_HOMEWORK[result.evidence]}</p>
      </ResultCard>

      <div className="mt-10 mb-8">
        <h2 className="font-serif text-2xl text-[var(--foreground)] mb-2">
          Your tailored Phase 2 prompt
        </h2>
        <p className="text-base leading-relaxed text-[var(--gray-700)] mb-5">
          This result isn&apos;t an identity, it&apos;s homework with the first
          field already typed. Paste this into ChatGPT or Claude today:
        </p>

        <div className="rounded-xl overflow-hidden border border-[var(--card-border)]">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--dark-card-bg)]">
            <p className="text-xs font-medium text-[#f3f3f1]/80">
              The buyer prompt, pre-filled from your answers
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-medium px-3 py-1 rounded-full bg-[#f3f3f1]/10 text-[#f3f3f1] hover:bg-[#f3f3f1]/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3f3f1]/60"
            >
              {copied ? "Copied" : "Copy prompt"}
            </button>
          </div>
          <pre className="p-5 bg-[var(--dark-section-bg)] text-[#f3f3f1] text-sm leading-relaxed whitespace-pre-wrap font-mono">
            {prompt}
          </pre>
        </div>
      </div>

      <div className="bg-[var(--surface-warm)] border border-[var(--border-warm)] rounded-2xl p-6 md:p-7 mb-10">
        <h2 className="text-xs tracking-[0.2em] uppercase font-bold text-[var(--accent)] mb-2">
          Then post it in the Lab
        </h2>
        <p className="text-base leading-relaxed text-[var(--gray-700)]">
          Category: Phase 1. Title:{" "}
          <span className="font-medium text-[var(--foreground)]">
            {postTitle}
          </span>
          . Include your letter tally, your mode, and your 10 buyers. That post
          is your Phase 2 gate, and it&apos;s the single biggest predictor of
          whether you finish.
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
    () => new Array(TOTAL).fill(null)
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
      if (current < TOTAL - 1) {
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
    setAnswers(new Array(TOTAL).fill(null));
    setCurrent(0);
    setScreen("intro");
    window.scrollTo(0, 0);
  }

  const step = STEPS[current];
  const result = screen === "result" ? computeResult(answers) : null;

  return (
    <main className="min-h-svh bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-[640px] px-6 pt-10 pb-16 md:pt-16">
        <Masthead />

        {screen === "intro" && (
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-[var(--gray-600)] mb-4">
              The Skill Diagnostic
            </p>
            <h1 className="font-serif text-[2.25rem] md:text-[3rem] leading-[1.1] text-[var(--foreground)] mb-6">
              What&apos;s your{" "}
              <span className="italic text-[var(--accent)]">PHASE path?</span>
            </h1>
            <p className="text-lg leading-relaxed text-[var(--gray-700)] mb-4">
              Most skill quizzes only ask what you&apos;re good at, then hand
              everyone the same advice. What you can do determines what you
              sell. How you&apos;re wired determines how you sell it.
            </p>
            <p className="text-lg leading-relaxed text-[var(--gray-700)] mb-8">
              14 questions, all about evidence: what people already ask you
              for, what you&apos;ve already done, what you&apos;ve already been
              paid for. You&apos;ll leave with your skill family, your delivery
              mode, and a buyer-finding prompt pre-filled from your answers.
            </p>
            <p className="font-serif italic text-xl text-[var(--accent)] border-l-[3px] border-[var(--accent)] pl-4 mb-10">
              There is no losing result.
            </p>
            <button
              type="button"
              onClick={() => {
                setScreen("quiz");
                window.scrollTo(0, 0);
              }}
              className="px-8 py-3.5 rounded-full text-base font-medium bg-[var(--cta-bg)] text-[#f3f3f1] hover:bg-[var(--accent-hover)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              Start the diagnostic
            </button>
            <p className="text-sm text-[var(--gray-600)] mt-5">
              3 minutes. No email required.
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
                Question {current + 1} of {TOTAL}
              </p>
            </div>

            <div
              className="h-1.5 rounded-full bg-[var(--surface-warm)] border border-[var(--border-warm)] overflow-hidden mb-8"
              role="progressbar"
              aria-label="Quiz progress"
              aria-valuemin={0}
              aria-valuemax={TOTAL}
              aria-valuenow={current + 1}
            >
              <div
                className="h-full rounded-full bg-[var(--cta-bg)] transition-all duration-300"
                style={{ width: `${((current + 1) / TOTAL) * 100}%` }}
              />
            </div>

            <p className="text-xs tracking-[0.2em] uppercase font-bold text-[var(--accent)] mb-1">
              {step.part}
            </p>
            {step.partBlurb && (
              <p className="text-sm text-[var(--gray-600)] mb-4">
                {step.partBlurb}
              </p>
            )}

            <h2 className="font-serif text-2xl md:text-3xl leading-[1.2] text-[var(--foreground)] mt-3 mb-8">
              {step.q}
            </h2>

            <div className="space-y-3" role="group" aria-label={step.q}>
              {step.options.map((option, i) => {
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
          <ResultView result={result} onRestart={handleRestart} />
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
