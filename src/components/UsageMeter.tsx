"use client";

export function UsageMeter({
  used,
  limit,
  tier,
  status,
  onUpgrade,
}: {
  used: number;
  limit: number;
  tier?: string;
  status?: string;
  onUpgrade?: (tier: "starter" | "pro") => void;
}) {
  const isUnlimited = limit === Infinity || limit > 9999;
  const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const atLimit = !isUnlimited && used >= limit;
  const remaining = limit - used;
  const isFree = tier === "free";
  // Trialing users at cap see TrialCapReachedBanner above the dashboard;
  // suppress the generic "Limit reached. Upgrade for more." line here so the
  // single high-intent CTA owns the moment (Fogg: one clear prompt, not two).
  const isTrialAtCap = status === "trialing" && atLimit;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--gray-600)]">Applications this month</span>
        <span className="text-[var(--foreground)] font-medium">
          {used} {isUnlimited ? "(unlimited)" : `/ ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              atLimit
                ? "bg-red-500"
                : percentage > 80
                ? "bg-yellow-500"
                : "bg-[#ef562a]"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {atLimit && !isFree && !isTrialAtCap && (
        <p className="text-xs text-red-500">
          Limit reached.{" "}
          <a href="/pricing" className="underline">
            Upgrade
          </a>{" "}
          for more.
        </p>
      )}
      {!atLimit && !isFree && percentage >= 80 && (
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-[var(--gray-600)]">
            {remaining} application{remaining !== 1 ? "s" : ""} remaining
          </p>
          {onUpgrade ? (
            <button
              onClick={() => onUpgrade("pro")}
              className="text-xs font-medium text-[#ef562a] hover:underline"
            >
              Upgrade to 300/mo
            </button>
          ) : (
            <a href="/pricing" className="text-xs font-medium text-[#ef562a] hover:underline">
              Upgrade to 300/mo
            </a>
          )}
        </div>
      )}
      {/* Free-tier copy removed: free users see TrialRequiredBanner instead. */}
    </div>
  );
}
