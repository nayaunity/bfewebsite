"use client";

export function UsageMeter({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const isUnlimited = limit === Infinity || limit > 9999;
  const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const atLimit = !isUnlimited && used >= limit;

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
      {atLimit && (
        <p className="text-xs text-red-500">
          Limit reached.{" "}
          <a href="/pricing" className="underline">
            Upgrade
          </a>{" "}
          for more.
        </p>
      )}
    </div>
  );
}
