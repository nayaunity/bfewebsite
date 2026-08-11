"use client";

import { useState } from "react";

const ROLE_OPTIONS = [
  "Healthcare / nursing",
  "Education / teaching",
  "Finance / accounting",
  "Recruiting / HR",
  "Legal / paralegal",
  "Marketing",
  "Operations / project management",
  "Engineering / IT",
  "Something else",
];

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          tags: ["skool-waitlist", `skool-role:${role}`],
        }),
      });

      const data = await res.json();
      if (res.ok || data.alreadySubscribed) {
        setSubmitted(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-svh bg-[#f3f3f1] text-[#2a2828]"
      style={{ paddingBottom: 0 }}
    >
      <div className="mx-auto max-w-[580px] px-6 pt-12 pb-8 md:pt-20 md:pb-12">
        <p className="text-xs tracking-[0.25em] uppercase text-[#897075] mb-8">
          Doors open August 17
        </p>

        <h1 className="font-serif text-[2rem] md:text-[2.75rem] leading-[1.15] text-[#4d1b27] mb-6">
          You already have the skill.
          <br />
          The next part is making it sellable.
        </h1>

        <p className="text-lg leading-relaxed text-[#4d383b] mb-12">
          A private community for professionals turning what they already know
          into an income stream, with AI doing the heavy lifting. First cohort
          opens August 17.
        </p>

        <hr className="border-[#4d1b27]/15 mb-10" />

        <ol className="space-y-4 mb-10 list-none p-0 m-0">
          {[
            "Pick one skill you already get paid for.",
            "Turn it into one thing people can buy.",
            "Ninety days, start to first sale.",
          ].map((text, i) => (
            <li key={i} className="flex gap-4 items-baseline">
              <span className="font-serif text-lg text-[#4d1b27] flex-shrink-0 w-6 text-right">
                {i + 1}.
              </span>
              <span className="font-serif text-lg">{text}</span>
            </li>
          ))}
        </ol>

        <hr className="border-[#4d1b27]/15 mb-10" />

        <div>
          <p className="font-medium mb-1">Get in before the public launch.</p>
          <p className="text-sm text-[#897075] mb-6">
            Founding members lock their rate for life.
          </p>

          {submitted ? (
            <div className="rounded-xl p-6 bg-[#4d1b27]/[0.06]">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#4d1b27]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-base leading-relaxed">
                  You&apos;re in. Check your inbox for a confirmation, and watch
                  for the next email tomorrow.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="waitlist-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-lg text-base bg-white border border-[#d4ccc4] text-[#2a2828] placeholder:text-[#897075] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d1b27] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f3f1]"
                />
              </div>
              <div className="relative">
                <label htmlFor="waitlist-role" className="sr-only">
                  What do you do right now?
                </label>
                <select
                  id="waitlist-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  disabled={loading}
                  className={`w-full px-4 py-3 pr-10 rounded-lg text-base bg-white border border-[#d4ccc4] appearance-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d1b27] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f3f1] ${
                    role ? "text-[#2a2828]" : "text-[#897075]"
                  }`}
                >
                  <option value="" disabled>
                    What do you do right now?
                  </option>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 text-[#897075]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg text-base font-medium bg-[#4d1b27] text-[#f3f3f1] hover:bg-[#3d1520] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d1b27] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f3f1] cursor-pointer"
              >
                {loading ? (
                  <svg
                    className="w-5 h-5 mx-auto motion-safe:animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-label="Submitting"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  "I want in"
                )}
              </button>
              {error && <p className="text-sm text-red-700">{error}</p>}
            </form>
          )}
        </div>

        <footer className="mt-16 pt-6 border-t border-[#d4ccc4]">
          <p className="text-xs text-[#808080]">
            The Black Female Engineer ·{" "}
            <a
              href="/privacy"
              className="underline hover:no-underline text-[#808080]"
            >
              Privacy Policy
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
