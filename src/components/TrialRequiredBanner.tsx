"use client";

import { useState } from "react";

/**
 * Prompts users without a paid subscription to upgrade to Starter.
 * The button POSTs to /api/stripe/checkout (Starter, 7-day trial)
 * and redirects to Stripe Checkout.
 */
export function TrialRequiredBanner({
  freeTierEndsAt,
}: {
  freeTierEndsAt: string | Date;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endsAt = typeof freeTierEndsAt === "string" ? new Date(freeTierEndsAt) : freeTierEndsAt;
  const now = new Date();
  const msRemaining = endsAt.getTime() - now.getTime();
  const past = msRemaining <= 0;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  const handleStartTrial = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "starter" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Could not start checkout. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Could not start checkout. Please try again.");
      setLoading(false);
    }
  };

  const headline = past
    ? "Upgrade to Starter"
    : `Your trial window closes in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;

  const subline = past
    ? "Get 100 tailored applications per month with a 7-day free trial. $0 today, $29/mo after. Cancel anytime."
    : "Lock in your 7-day free trial before it expires. $0 today, $29/mo after. Cancel anytime.";

  const accentColor = past ? "var(--accent-red-bg, #fee2e2)" : "var(--accent-amber-bg, #fef3c7)";
  const accentBorder = past ? "var(--accent-red-border, #fca5a5)" : "var(--accent-amber-border, #fcd34d)";

  return (
    <div
      className="rounded-2xl border p-4 sm:p-5 mb-6"
      style={{
        background: accentColor,
        borderColor: accentBorder,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <p className="font-serif text-lg text-[var(--gray-800)]">{headline}</p>
          <p className="text-sm text-[var(--gray-600)] mt-1">{subline}</p>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <button
          onClick={handleStartTrial}
          disabled={loading}
          className="px-5 py-2.5 rounded-lg font-medium text-white whitespace-nowrap disabled:opacity-50"
          style={{ background: "#ef562a" }}
        >
          {loading ? "Starting..." : "Start 7-day trial"}
        </button>
      </div>
    </div>
  );
}
