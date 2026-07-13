"use client";

const tierStyles: Record<string, string> = {
  free: "bg-[var(--gray-100)] text-[var(--gray-600)]",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-[#4d1b27]/10 text-[#4d1b27]",
};

export function SubscriptionBadge({ tier }: { tier: string }) {
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${
        tierStyles[tier] || tierStyles.free
      }`}
    >
      {tier}
    </span>
  );
}
