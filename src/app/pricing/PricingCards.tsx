"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const tiers = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    trialBlurb: "7-day free trial, $0 today",
    key: "starter" as const,
    features: [
      "100 applications per month",
      "Unlimited tailored resumes",
      "Upload up to 5 resumes to your profile",
      "30+ companies",
      "Smart resume matching",
      "Application tracking",
      "Priority queue",
    ],
    cta: "Start 7-day trial",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$59",
    period: "/month",
    trialBlurb: null,
    key: "pro" as const,
    features: [
      "300 applications per month",
      "Unlimited tailored resumes",
      "Upload up to 10 resumes to your profile",
      "30+ companies",
      "Smart resume matching",
      "Application tracking",
      "Priority queue",
      "Daily auto-apply",
    ],
    cta: "Subscribe",
    highlighted: false,
  },
];

export function PricingCards({
  currentTier,
  isSignedIn,
}: {
  currentTier: string;
  isSignedIn: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSubscribe = async (tier: "starter" | "pro") => {
    if (!isSignedIn) {
      // Logged-out users: bounce through signup, then auto-fire the trial
      // checkout via the ?startTrial=1 deep-link on the dashboard.
      const next =
        tier === "starter"
          ? "/profile/applications?startTrial=1"
          : "/pricing";
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(next)}`);
      return;
    }

    setLoading(tier);
    try {
      if (currentTier !== "free") {
        // Existing subscriber — open portal to change plan
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      } else {
        // New subscriber — create checkout session
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
    } catch {
      // silently fail
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {tiers.map((tier) => {
        const isCurrent = currentTier === tier.key;

        return (
          <div
            key={tier.key}
            className={`relative bg-[var(--card-bg)] border-2 rounded-2xl p-8 flex flex-col ${
              tier.highlighted
                ? "border-[#ef562a]"
                : "border-[var(--card-border)]"
            }`}
          >
            {tier.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ffe500] text-black text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}

            <h3 className="font-serif text-2xl text-[var(--foreground)]">
              {tier.name}
            </h3>
            <div className="mt-3 mb-2">
              <span className="text-4xl font-bold text-[var(--foreground)]">
                {tier.price}
              </span>
              <span className="text-sm text-[var(--gray-600)]">
                {tier.period}
              </span>
            </div>
            {tier.trialBlurb && (
              <p className="text-xs font-medium text-[#ef562a] mb-6">
                {tier.trialBlurb}
              </p>
            )}
            {!tier.trialBlurb && <div className="mb-6" />}

            <ul className="space-y-3 mb-8 flex-1">
              {tier.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[15px] text-[var(--gray-600)]"
                >
                  <svg
                    className="w-5 h-5 text-[#ef562a] mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {isCurrent ? (
              <button
                disabled
                className="w-full py-3 text-sm font-medium rounded-lg bg-[var(--gray-100)] text-[var(--gray-600)] cursor-default"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleSubscribe(tier.key)}
                disabled={loading === tier.key}
                className={`w-full py-3 text-sm font-medium rounded-lg transition-opacity disabled:opacity-50 ${
                  tier.highlighted
                    ? "bg-[#ef562a] text-white hover:opacity-90"
                    : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
                }`}
              >
                {loading === tier.key ? "Loading..." : tier.cta}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
