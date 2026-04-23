"use client";

import { useState } from "react";

/**
 * Renders for users with subscriptionStatus in ("past_due", "unpaid").
 * Button opens a Stripe Customer Portal session so the user can update
 * their card. Stripe's dunning will retry on its own schedule too, but
 * this gives the user an immediate path to recovery.
 *
 * Caller must only render this when subscriptionStatus === "past_due" or
 * "unpaid". We do not gate inside this component because the caller
 * already has the data.
 */
export function PaymentFailedBanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateCard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Could not open the billing portal. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Could not open the billing portal. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border p-4 sm:p-5 mb-6"
      style={{
        background: "var(--accent-red-bg, #fee2e2)",
        borderColor: "var(--accent-red-border, #fca5a5)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <p className="font-serif text-lg text-[var(--gray-800)]">
            Your last payment didn&apos;t go through
          </p>
          <p className="text-sm text-[var(--gray-600)] mt-1">
            Applications are paused until your card is updated. Update your payment method to resume where you left off.
          </p>
          {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
        </div>
        <button
          onClick={handleUpdateCard}
          disabled={loading}
          className="px-5 py-2.5 rounded-lg font-medium text-white whitespace-nowrap disabled:opacity-50"
          style={{ background: "#ef562a" }}
        >
          {loading ? "Opening..." : "Update payment method"}
        </button>
      </div>
    </div>
  );
}
