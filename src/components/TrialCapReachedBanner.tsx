"use client";

import { useState } from "react";

/**
 * Renders for trialing users who have hit their 5-app trial cap.
 *
 * Caller must only render this when subscriptionStatus === "trialing" AND
 * monthlyAppCount >= 5. We do not gate inside this component because the
 * caller already has that data.
 *
 * Copy applies the marketing-skill copywriting + marketing-psychology
 * frameworks. Headline acknowledges what they did (endowment) and points
 * forward; subline names the honest day-8 reality (loss aversion: every
 * day waited is a day of lost applies); CTA is single, action+outcome,
 * one click. Anchored pricing in the footnote.
 *
 * The CTA POSTs to /api/stripe/end-trial which calls
 * stripe.subscriptions.update({ trial_end: 'now' }). Stripe charges the
 * card on file and the existing webhook flips status trialing→active,
 * unlocking the full 100/mo Starter cap.
 */
export function TrialCapReachedBanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgradeNow = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/end-trial", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not upgrade. Please try again.");
        setLoading(false);
        return;
      }
      // Webhook propagation can take a couple seconds; reload so the UI
      // re-fetches subscriptionStatus and the banner unmounts.
      window.location.reload();
    } catch {
      setError("Could not upgrade. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 mb-6"
      style={{
        background: "var(--accent-amber-bg, #fef3c7)",
        borderColor: "var(--accent-amber-border, #fcd34d)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <p className="font-serif text-lg sm:text-xl text-[var(--gray-800)]">
            You've used all 5 trial applications. Want to keep going?
          </p>
          <p className="text-sm text-[var(--gray-600)] mt-2 leading-relaxed">
            Unlock the full Starter plan today and pick up where you left off. Every day
            you wait is a day of matches that won't get applied to.
          </p>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-1.5">
          <button
            onClick={handleUpgradeNow}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg font-medium text-white whitespace-nowrap disabled:opacity-50"
            style={{ background: "#ef562a" }}
          >
            {loading ? "Upgrading..." : "Upgrade now for $29"}
          </button>
          <p className="text-[11px] text-[var(--gray-600)] text-center sm:text-right">
            Unlocks 100 applications/mo. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
