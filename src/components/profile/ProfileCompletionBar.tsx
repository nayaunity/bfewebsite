"use client";

interface ProfileCompletionBarProps {
  filled: number;
  total: number;
}

export function ProfileCompletionBar({ filled, total }: ProfileCompletionBarProps) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-6 py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--foreground)]">
          Profile Completion
        </span>
        <span className="text-sm font-medium text-[var(--foreground)]">
          {pct}%
        </span>
      </div>
      <div className="w-full h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? "var(--accent-green-text)" : "#ef562a",
          }}
        />
      </div>
      <p className="text-xs text-[var(--gray-600)] mt-2">
        {filled} of {total} fields completed
        {pct < 100 && " — fill out more to improve your auto-apply success rate"}
      </p>
    </div>
  );
}
