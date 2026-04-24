"use client";

import { useState } from "react";

type TierKey = "selfGuided" | "groupCoaching" | "privateCoaching";

const TIER_LABELS: Record<TierKey, { price: string; label: string; cta: string }> = {
  selfGuided: {
    price: "$499",
    label: "Self-Guided",
    cta: "Reserve Self-Guided",
  },
  groupCoaching: {
    price: "$999",
    label: "Self-Guided + Group Coaching",
    cta: "Reserve Group Coaching",
  },
  privateCoaching: {
    price: "$1999",
    label: "All-In (1:1 Coaching)",
    cta: "Reserve 1:1 Coaching",
  },
};

export function TierEnrollButton({
  tier,
  className,
}: {
  tier: TierKey;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { cta, price, label } = TIER_LABELS[tier];

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    // Fire-and-forget click tracking (never blocks checkout).
    fetch("/api/links/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        linkId: `bta-presale-${tier}`,
        linkTitle: `Building a Tech Audience presale - ${label} (${price})`,
        linkUrl: "/api/stripe/course-checkout",
      }),
    }).catch(() => {});

    try {
      const res = await fetch("/api/stripe/course-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }

      setError("We couldn't start checkout. Please try again.");
      setLoading(false);
    } catch {
      setError("We couldn't start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={
          className ??
          "inline-flex items-center justify-center gap-2 bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors text-lg w-full disabled:opacity-70 disabled:cursor-not-allowed"
        }
      >
        {loading ? "Redirecting to checkout..." : cta}
        {!loading && (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs text-[#ef562a] text-center">{error}</p>
      )}
    </div>
  );
}

export default function EnrollCTA({ className }: { className?: string }) {
  return (
    <a
      href="#pricing"
      className={
        className ??
        "inline-flex items-center gap-2 bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors text-lg"
      }
    >
      Reserve Your Seat
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
        />
      </svg>
    </a>
  );
}
