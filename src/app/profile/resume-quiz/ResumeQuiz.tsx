"use client";

import { useState } from "react";
import Link from "next/link";

interface QuizQuestion {
  id: string;
  number: number;
  label: string;
  question: string;
  placeholder: string;
  hint?: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "doePlatformUsers",
    number: 1,
    label: "The Big Picture at DoE",
    question:
      "How many people across the Department of Energy could potentially use the Salesforce platform you work on? Think total headcount across all the labs and offices your work touches.",
    placeholder: 'e.g., "around 5,000" or "just the OCIO team of ~200"',
  },
  {
    id: "agentAccuracy",
    number: 2,
    label: "Your AI Agents in Action",
    question:
      "When someone uses one of the AI agents you built, how often does it actually get the answer right without a human stepping in? Like if 10 people asked it something, how many would get a usable answer?",
    placeholder: 'e.g., "maybe 7 or 8 out of 10"',
  },
  {
    id: "llmBakeoff",
    number: 3,
    label: "The LLM Bake-Off",
    question:
      "You evaluated Claude 3.7 Sonnet against other models. How many models were in the running, and what were they?",
    placeholder: 'e.g., "We tested 4 \u2014 GPT-4, Gemini, Claude, and Llama 3"',
  },
  {
    id: "dealsPipeline",
    number: 4,
    label: "Show Me the Money",
    question:
      "When you helped shape deals with the sales and demand team, roughly how many opportunities did you contribute to? And do you have any sense of the total dollar value of those deals?",
    placeholder: 'e.g., "I helped shape 3 proposals, probably worth $2\u20133M combined"',
  },
  {
    id: "onboardingSpeed",
    number: 5,
    label: "Speeding Things Up",
    question:
      "After you created your deployment playbooks and enablement materials, did onboarding new AI features get noticeably faster? If a new feature used to take X weeks to roll out, what does it take now?",
    placeholder:
      'e.g., "Used to take a month to get people up to speed, now it\'s about a week"',
  },
  {
    id: "uspsScale",
    number: 6,
    label: "Your USPS Chapter",
    question:
      "How many people actually used the Salesforce system you owned as Product Owner at USPS? And roughly how many releases/sprints did you ship during those 7 months?",
    placeholder: 'e.g., "Maybe 500 users, and we did biweekly sprints so like 14 releases"',
  },
  {
    id: "integrationCount",
    number: 7,
    label: "The Integration Web",
    question:
      "For the Mulesoft APIs you designed at USPS \u2014 how many different systems were you connecting together?",
    placeholder:
      'e.g., "3 systems \u2014 Salesforce, the legacy mail tracking system, and SAP"',
  },
  {
    id: "slalomWins",
    number: 8,
    label: "Slalom Client Wins",
    question:
      "Across your 5 enterprise clients at Slalom, did any of your recommendations lead to a measurable outcome? Cost savings, time saved, adoption increase \u2014 anything with a number?",
    placeholder:
      'e.g., "Sentara reduced manual processing time by about 30% after our redesign"',
  },
  {
    id: "pegaTeamScale",
    number: 9,
    label: "The Accenture Pega Days",
    question:
      "Back in your first Accenture stint \u2014 how big was the engineering team you were managing the backlog for? And roughly how many releases did you support over those ~2.5 years?",
    placeholder: 'e.g., "Team of 8 engineers, probably 20+ releases"',
  },
  {
    id: "superpowerMoment",
    number: 10,
    label: "Your Superpower Question",
    question:
      "If your manager at DoE had to brag about one thing you accomplished this year to their boss, what would they say?",
    placeholder: "This one\u2019s open-ended \u2014 whatever comes to mind, we\u2019ll turn it into resume gold.",
    hint: "Don\u2019t be modest. Think about what actually moved the needle.",
  },
];

export function ResumeQuiz({ firstName }: { firstName: string | null }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const q = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  const isLast = currentStep === QUESTIONS.length - 1;
  const canProceed = (answers[q?.id] || "").trim().length > 0;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile/resume-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#ef562a]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif text-[var(--foreground)] mb-3">
            You&apos;re all set!
          </h2>
          <p className="text-[var(--gray-600)] mb-8">
            We&apos;ve got everything we need to build you a resume that actually lands interviews.
            Our team will use your answers to craft a PM-optimized version tailored to your experience.
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ef562a] text-white rounded-xl hover:bg-[#d44a22] transition-colors font-medium"
          >
            Back to Dashboard
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--gray-600)]">
            Question {currentStep + 1} of {QUESTIONS.length}
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
          <h3 className="text-lg font-serif text-[var(--foreground)]">{q.label}</h3>
        </div>

        <p className="text-[var(--foreground)] mb-6 leading-relaxed">{q.question}</p>

        <textarea
          value={answers[q.id] || ""}
          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
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
          <p className="mt-2 text-xs text-[var(--gray-600)] italic">{q.hint}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-2">
          {/* Skip button */}
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
              disabled={!canProceed || submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#ef562a] text-white rounded-xl hover:bg-[#d44a22] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  Submit
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-[var(--gray-600)]/60 mt-4">
        Press <kbd className="px-1.5 py-0.5 bg-[var(--gray-100)] rounded text-[10px] font-mono">Cmd + Enter</kbd> to continue
      </p>
    </div>
  );
}
