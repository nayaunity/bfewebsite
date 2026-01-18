"use client";

import { MICRO_WIN_PROMPTS, formatRelativeTime } from "@/lib/micro-wins";

interface MicroWinCardProps {
  content: string;
  promptType: string;
  authorName: string | null;
  createdAt: string;
}

export function MicroWinCard({
  content,
  promptType,
  authorName,
  createdAt,
}: MicroWinCardProps) {
  const prompt =
    MICRO_WIN_PROMPTS[promptType as keyof typeof MICRO_WIN_PROMPTS];

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 hover:border-[#ffe500] transition-colors">
      {/* Prompt badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{prompt?.emoji || "✨"}</span>
        <span className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wide">
          {prompt?.prompt || "Micro-win"}
        </span>
      </div>

      {/* Content */}
      <p className="text-[var(--foreground)] leading-relaxed">{content}</p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-[var(--gray-600)]">
        <span>{authorName || "Anonymous"}</span>
        <span>{formatRelativeTime(createdAt)}</span>
      </div>
    </div>
  );
}
