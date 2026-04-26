"use client";

import { useState } from "react";

interface QuizQuestion {
  id: string;
  label: string;
  question: string;
}

interface QuizCardProps {
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    stage: string;
    stageLabel: string;
    stageBg: string;
    stageColor: string;
    questionCount: number;
    answeredCount: number;
    questions: QuizQuestion[];
    answers: Record<string, string>;
    rewriteUrl: string | null;
    rewriteCreatedAt: string | null;
    submittedAt: string | null;
  };
}

export function QuizCard({ user }: QuizCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasAnswers = Object.keys(user.answers).length > 0;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
      {/* Clickable header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between flex-wrap gap-2 text-left hover:bg-[var(--gray-50)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--gray-800)] flex items-center justify-center text-white text-sm font-medium">
            {(user.firstName?.[0] || "").toUpperCase()}
            {(user.lastName?.[0] || "").toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-[var(--foreground)]">
                {user.firstName} {user.lastName}
              </span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  user.subscriptionTier === "pro"
                    ? "bg-purple-100 text-purple-700"
                    : user.subscriptionTier === "starter"
                      ? "bg-[#ef562a]/10 text-[#ef562a]"
                      : "bg-[var(--gray-100)] text-[var(--gray-600)]"
                }`}
              >
                {user.subscriptionTier}
              </span>
              {user.subscriptionStatus === "trialing" && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                  trial
                </span>
              )}
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${user.stageBg} ${user.stageColor}`}
              >
                {user.stageLabel}
              </span>
            </div>
            <span className="text-xs text-[var(--gray-600)]">{user.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-xs text-[var(--gray-600)]">
            {user.answeredCount > 0 && (
              <span>
                {user.answeredCount}/{user.questionCount} answered
              </span>
            )}
            {user.submittedAt && <span>Submitted {user.submittedAt}</span>}
            {user.rewriteCreatedAt && (
              <span>Rewritten {user.rewriteCreatedAt}</span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-[var(--gray-600)] transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Expandable content */}
      {expanded && hasAnswers && (
        <div className="px-6 py-4 border-t border-[var(--card-border)] space-y-4">
          {user.questions.map((q) => {
            const answer = user.answers[q.id];
            const skipped = !answer || !answer.trim();
            return (
              <div key={q.id}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider">
                    {q.label}
                  </span>
                  {skipped && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--gray-100)] text-[var(--gray-600)]">
                      skipped
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[var(--gray-600)] italic">
                  {q.question}
                </p>
                {!skipped && (
                  <p className="mt-1.5 text-sm text-[var(--foreground)] leading-relaxed">
                    {answer}
                  </p>
                )}
              </div>
            );
          })}
          {user.rewriteUrl && (
            <div className="pt-3 border-t border-[var(--card-border)]">
              <a
                href={user.rewriteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#ef562a] hover:underline"
              >
                View Rewritten Resume
                <svg
                  className="w-3 h-3"
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
            </div>
          )}
        </div>
      )}

      {expanded && !hasAnswers && (
        <div className="px-6 py-4 border-t border-[var(--card-border)]">
          <p className="text-sm text-[var(--gray-600)] italic">
            Questions generated but quiz not yet submitted.
          </p>
        </div>
      )}
    </div>
  );
}
