"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CommunityUpsell() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const joined = params.get("community") === "joined";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (joined) {
    return (
      <div className="bg-[var(--cta-bg)] text-white rounded-2xl p-6 mb-8 text-left flex items-start gap-4">
        <span className="text-3xl leading-none" aria-hidden="true">🤎</span>
        <div>
          <p className="font-medium">You&apos;re in Disgustingly Paid too.</p>
          <p className="text-sm text-white/85 leading-relaxed mt-1">
            Your membership is set: $49 today, then $99 a month, billed through
            Stripe. Your Skool invite comes from Naya within 24 hours. Look for
            an email from Skool with a Join button. You never pay anything on
            Skool itself.
          </p>
        </div>
      </div>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    fetch("/api/links/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        linkId: "aive-community-upsell",
        linkTitle: "Disgustingly Paid upsell (workshop thank-you)",
        linkUrl: "/api/stripe/community-checkout",
      }),
    }).catch(() => {});
    try {
      const res = await fetch("/api/stripe/community-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
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
    <div className="relative bg-[var(--card-bg)] border-2 border-[var(--accent)] rounded-2xl p-6 mb-8 text-left">
      <span className="absolute -top-3 left-6 inline-block text-xs px-3 py-1 rounded-full font-medium bg-[var(--cta-bg)] text-white tracking-wide">
        ATTENDEE OFFER
      </span>
      <div className="flex items-start gap-4 mt-1">
        <span className="text-3xl leading-none" aria-hidden="true">🤎</span>
        <div className="flex-1">
          <p className="font-poppins font-bold tracking-[-0.02em] text-[var(--foreground)] text-xl leading-snug">
            Keep building with me 🤎
          </p>
          <p className="font-medium text-[var(--foreground)] leading-snug mt-2">
            Add your first month of Disgustingly Paid for $49, normally $99.
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed">
            {[
              { lead: "Ongoing community support." },
              { lead: "My sound-effects folder", rest: " for your new editing team." },
              {
                lead: "New weekly builds.",
                rest: " Already inside:",
                items: [
                  "Content Strategist agent",
                  "Brand Deal Finder agent",
                  "Meeting Notes to Content agent",
                  "Email capture flow templates",
                ],
              },
              {
                lead: "Every improvement, the moment I make it.",
                rest: " Updates to this editing agent and the others land in your library as I keep making them better.",
              },
            ].map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                <div className="text-[var(--gray-600)]">
                  <strong className="text-[var(--foreground)]">{b.lead}</strong>
                  {b.rest}
                  {b.items && (
                    <ul className="mt-1.5 ml-1 space-y-1">
                      {b.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-[9px] w-1 h-1 rounded-full bg-[var(--accent)] flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-sm font-medium text-[var(--foreground)] mt-2">
            $49 today, then $99/month.
          </p>
          <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className="mt-4 inline-flex items-center justify-center gap-2 bg-[var(--cta-bg)] text-white px-6 py-3 rounded-full font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Opening secure checkout..." : "Join for $49 today"}
            {!loading && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            )}
          </button>
          {error && (
            <p className="mt-2 text-xs text-[var(--accent)]">{error}</p>
          )}
          <p className="mt-3 text-xs text-[var(--gray-600)]">
            Secure checkout by Stripe, about a minute. Cancel any time by
            replying to one email.
          </p>
        </div>
      </div>
    </div>
  );
}
