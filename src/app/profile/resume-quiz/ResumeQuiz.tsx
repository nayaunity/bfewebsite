"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface QuizQuestion {
  id: string;
  number: number;
  label: string;
  question: string;
  placeholder: string;
  hint?: string;
}

type Phase = "loading" | "quiz" | "submitting" | "rewriting" | "done" | "upgrade" | "error";

export function ResumeQuiz({ firstName }: { firstName: string | null }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [rewriteUrl, setRewriteUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    try {
      const res = await fetch("/api/profile/resume-quiz/generate");
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to generate questions");
        setPhase("error");
        return;
      }
      const data = await res.json();
      setQuestions(data.questions);
      setPhase("quiz");
    } catch {
      setErrorMsg("Failed to load quiz. Please try again.");
      setPhase("error");
    }
  }

  async function handleSubmit() {
    setPhase("submitting");
    try {
      // Save answers
      const saveRes = await fetch("/api/profile/resume-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!saveRes.ok) {
        setPhase("quiz");
        return;
      }

      // Trigger rewrite
      setPhase("rewriting");
      const rewriteRes = await fetch("/api/profile/resume-quiz/rewrite", {
        method: "POST",
      });

      if (rewriteRes.ok) {
        const data = await rewriteRes.json();
        setRewriteUrl(data.htmlUrl);
        setPhase("done");
      } else if (rewriteRes.status === 403) {
        const data = await rewriteRes.json();
        if (data.error === "upgrade_required") {
          setPhase("upgrade");
        } else {
          setPhase("done");
        }
      } else {
        setPhase("done");
      }
    } catch {
      setPhase("done");
    }
  }

  if (phase === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ef562a]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#ef562a] animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-serif text-[var(--foreground)] mb-2">
            Analyzing your resume...
          </h2>
          <p className="text-sm text-[var(--gray-600)]">
            We&apos;re reading your resume and crafting personalized questions to
            help quantify your impact. This takes about 10 seconds.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-serif text-[var(--foreground)] mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-[var(--gray-600)] mb-6">{errorMsg}</p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ef562a] text-white rounded-xl hover:bg-[#d44a22] transition-colors font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "upgrade") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#ef562a]/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[#ef562a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-serif text-[var(--foreground)] mb-3">
            Your answers are saved!
          </h2>
          <p className="text-[var(--gray-600)] mb-3">
            We&apos;ve captured all the impact data we need from your
            experience. Upgrade to Starter to unlock your AI-rewritten resume
            that leads with measurable results.
          </p>
          <p className="text-sm text-[var(--gray-600)] mb-8">
            Your rewritten resume will be generated instantly after upgrading.
          </p>
          <div className="flex flex-col gap-3 items-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ef562a] text-white rounded-xl hover:bg-[#d44a22] transition-colors font-medium"
            >
              Upgrade to Unlock
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-6 py-3 text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors font-medium text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "rewriting") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ef562a]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#ef562a] animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-serif text-[var(--foreground)] mb-2">
            Building your impact resume...
          </h2>
          <p className="text-sm text-[var(--gray-600)]">
            We&apos;re rewriting your resume to lead with the numbers and
            outcomes you just shared. This takes about 15 seconds.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#ef562a]/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[#ef562a]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-serif text-[var(--foreground)] mb-3">
            Your impact resume is ready!
          </h2>
          <p className="text-[var(--gray-600)] mb-8">
            We&apos;ve rewritten your resume to lead with measurable results.
            {rewriteUrl
              ? " Open it below to review, then save as PDF using your browser's Print function (Cmd+P)."
              : " Our team will use your answers to craft an optimized version tailored to your experience."}
          </p>
          <div className="flex flex-col gap-3 items-center">
            {rewriteUrl && (
              <a
                href={rewriteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ef562a] text-white rounded-xl hover:bg-[#d44a22] transition-colors font-medium"
              >
                View Rewritten Resume
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-6 py-3 text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors font-medium text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Quiz phase
  const q = questions[currentStep];
  if (!q) return null;

  const progress = ((currentStep + 1) / questions.length) * 100;
  const isLast = currentStep === questions.length - 1;
  const canProceed = (answers[q.id] || "").trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--gray-600)]">
            Question {currentStep + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#ef562a] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ef562a] text-white flex items-center justify-center text-sm font-bold">
            {q.number}
          </span>
          <h3 className="text-lg font-serif text-[var(--foreground)]">
            {q.label}
          </h3>
        </div>

        <p className="text-[var(--foreground)] mb-6 leading-relaxed">
          {q.question}
        </p>

        <textarea
          value={answers[q.id] || ""}
          onChange={(e) =>
            setAnswers({ ...answers, [q.id]: e.target.value })
          }
          placeholder={q.placeholder}
          rows={4}
          className="w-full px-4 py-3 text-sm rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--gray-600)]/50 focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a] resize-none transition-all"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey && canProceed) {
              if (isLast) handleSubmit();
              else setCurrentStep((s) => s + 1);
            }
          }}
        />

        {q.hint && (
          <p className="mt-2 text-xs text-[var(--gray-600)] italic">
            {q.hint}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-2">
          {!isLast && (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              className="px-4 py-2.5 text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors"
            >
              Skip
            </button>
          )}

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed || phase === "submitting"}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#ef562a] text-white rounded-xl hover:bg-[#d44a22] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
            >
              {phase === "submitting" ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  Submit
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canProceed}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#ef562a] text-white rounded-xl hover:bg-[#d44a22] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
            >
              Next
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-[var(--gray-600)]/60 mt-4">
        Press{" "}
        <kbd className="px-1.5 py-0.5 bg-[var(--gray-100)] rounded text-[10px] font-mono">
          Cmd + Enter
        </kbd>{" "}
        to continue
      </p>
    </div>
  );
}
