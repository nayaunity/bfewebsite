"use client";

import { useState } from "react";

const PRICE_LABEL = "$147";

export default function RegisterButton({
  location,
  label = `Save my seat for ${PRICE_LABEL}`,
  className,
  wrapperClassName = "w-full sm:w-auto",
}: {
  location: string;
  label?: string;
  className?: string;
  wrapperClassName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    // Fire-and-forget click tracking (never blocks checkout).
    fetch("/api/links/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        linkId: `aive-workshop-register-${location}`,
        linkTitle: `AI Video Editor Workshop register (${location})`,
        linkUrl: "/api/stripe/workshop-checkout",
      }),
    }).catch(() => {});

    try {
      const res = await fetch("/api/stripe/workshop-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshop: "aiVideoEditor" }),
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
    <div className={wrapperClassName}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={
          className ??
          "inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-[var(--cta-bg)] text-white px-8 py-4 rounded-full font-medium hover:bg-[var(--accent-hover)] transition-colors text-lg disabled:opacity-70 disabled:cursor-not-allowed"
        }
      >
        {loading ? "Opening secure checkout..." : label}
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
        <p className="mt-2 text-xs text-[var(--accent)] text-center">{error}</p>
      )}
    </div>
  );
}
