"use client";

import { useState } from "react";

interface Props {
  /**
   * Current subscription status. Determines copy: "active"/"trialing" =
   * cancel-at-period-end (you keep access through periodEnd); "past_due"/
   * "unpaid" = immediate cancel (no payment due, access ends now).
   */
  subscriptionStatus: "trialing" | "active" | "past_due" | "unpaid";
  /** ISO date string — only used in copy for active/trialing users. */
  periodEnd: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CancelSubscriptionButton({
  subscriptionStatus,
  periodEnd,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    | { kind: "scheduled"; endsAt: string | null }
    | { kind: "canceled" }
    | { kind: "error"; message: string }
    | null
  >(null);

  const isImmediate =
    subscriptionStatus === "past_due" || subscriptionStatus === "unpaid";

  const headline = isImmediate
    ? "Cancel your subscription?"
    : "Cancel your subscription?";

  const body = isImmediate ? (
    <p className="text-sm text-[var(--gray-600)] leading-relaxed">
      Your last payment didn&apos;t go through, so no charge is due. Canceling
      now will stop Stripe from retrying your card and move you to the free
      tier. You can resubscribe any time from{" "}
      <span className="font-medium">/pricing</span>.
    </p>
  ) : (
    <p className="text-sm text-[var(--gray-600)] leading-relaxed">
      You&apos;ll keep access to all paid features
      {periodEnd ? (
        <>
          {" "}
          until <span className="font-medium">{formatDate(periodEnd)}</span>
        </>
      ) : (
        " until the end of your current billing period"
      )}
      . After that you&apos;ll move to the free tier with no further charges.
      You can resubscribe any time from{" "}
      <span className="font-medium">/pricing</span>.
    </p>
  );

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResult({
          kind: "error",
          message: data.error || "Something went wrong. Please try again.",
        });
        return;
      }
      if (data.mode === "immediate") {
        setResult({ kind: "canceled" });
      } else {
        setResult({ kind: "scheduled", endsAt: data.endsAt ?? null });
      }
    } catch {
      setResult({
        kind: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (result?.kind === "canceled") {
    return (
      <div
        className="rounded-2xl border p-4 sm:p-5"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <p className="font-serif text-lg text-[var(--foreground)]">
          Your subscription is canceled.
        </p>
        <p className="text-sm text-[var(--gray-600)] mt-1">
          You&apos;ve been moved to the free tier. Refresh to see the updated
          status.
        </p>
      </div>
    );
  }

  if (result?.kind === "scheduled") {
    return (
      <div
        className="rounded-2xl border p-4 sm:p-5"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--card-border)",
        }}
      >
        <p className="font-serif text-lg text-[var(--foreground)]">
          Cancellation scheduled.
        </p>
        <p className="text-sm text-[var(--gray-600)] mt-1">
          You&apos;ll keep paid access
          {result.endsAt ? (
            <>
              {" "}
              until <span className="font-medium">{formatDate(result.endsAt)}</span>
            </>
          ) : (
            " until the end of your current billing period"
          )}
          . No further charges will be made.
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
        style={{
          borderColor: "var(--card-border)",
          color: "var(--gray-800)",
        }}
      >
        Cancel subscription
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => !loading && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border p-5 sm:p-6"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <h2 className="font-serif text-xl text-[var(--foreground)]">
              {headline}
            </h2>
            <div className="mt-3">{body}</div>

            {result?.kind === "error" && (
              <p className="mt-3 text-sm" style={{ color: "#b91c1c" }}>
                {result.message}
              </p>
            )}

            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  color: "var(--foreground)",
                  background: "var(--gray-50)",
                }}
              >
                Never mind
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleCancel}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ background: "#4d1b27" }}
              >
                {loading
                  ? "Canceling..."
                  : isImmediate
                    ? "Cancel subscription"
                    : "Cancel at period end"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
