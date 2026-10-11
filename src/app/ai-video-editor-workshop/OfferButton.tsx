"use client";

import { useEffect, useState } from "react";

export type Offer = "plugin" | "workshop" | "membership";

export const OFFER_LABELS: Record<Offer, string> = {
  plugin: "Get the plugin · $97",
  workshop: "Get plugin + workshop · $147",
  membership: "Join Disgustingly Paid · $99/month",
};

const OFFERS: Record<
  Offer,
  { endpoint: string; body: Record<string, string>; linkPrefix: string; title: string }
> = {
  plugin: {
    endpoint: "/api/stripe/plugin-checkout",
    body: {},
    linkPrefix: "aive-plugin-buy",
    title: "AI Video Editing Plugin buy",
  },
  workshop: {
    endpoint: "/api/stripe/workshop-checkout",
    body: { workshop: "aiVideoEditor" },
    linkPrefix: "aive-workshop-register",
    title: "AI Video Editor Workshop register",
  },
  membership: {
    endpoint: "/api/stripe/community-checkout",
    body: { source: "sales-page" },
    linkPrefix: "aive-membership-join",
    title: "Disgustingly Paid join",
  },
};

const SOLID =
  "inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-[var(--cta-bg)] text-white px-8 py-4 rounded-full font-medium hover:bg-[var(--accent-hover)] transition-colors text-lg disabled:opacity-70 disabled:cursor-not-allowed";

export default function OfferButton({
  offer,
  location,
  label,
  className,
  wrapperClassName = "w-full sm:w-auto",
}: {
  offer: Offer;
  location: string;
  label?: string;
  className?: string;
  wrapperClassName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = OFFERS[offer];
  const text = label ?? OFFER_LABELS[offer];

  // Safari and Chrome restore this page from the back-forward cache when the
  // visitor presses Back on Stripe Checkout, which would leave the button
  // stuck on "Opening secure checkout...". Reset it on restore.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setLoading(false);
        setError(null);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    // Fire-and-forget click tracking (never blocks checkout).
    fetch("/api/links/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        linkId: `${config.linkPrefix}-${location}`,
        linkTitle: `${config.title} (${location})`,
        linkUrl: config.endpoint,
      }),
    }).catch(() => {});

    try {
      const res = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config.body),
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
        className={className ?? SOLID}
      >
        {loading ? "Opening secure checkout..." : text}
        {!loading && (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
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
