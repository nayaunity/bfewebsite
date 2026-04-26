"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Shown to users who were auto-flagged as internship-only by the backfill
 * (graduation year in the future + low YOE). Lets them confirm or undo the
 * change before the next browse session runs.
 *
 * Server is responsible for only mounting this when:
 *   user.seekingInternship === true
 *   AND user.preferenceBannerDismissedAt === null
 */
export function InternshipPreferenceBanner() {
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState<"keep" | "switch" | null>(null);

  if (hidden) return null;

  async function dismiss(action: "keep" | "switch") {
    setBusy(action);
    try {
      const body: Record<string, unknown> = { preferenceBannerDismissedAt: true };
      if (action === "switch") body.seekingInternship = false;
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setHidden(true);
    } catch {
      setBusy(null);
    }
  }

  return (
    <div className="mb-6 px-5 py-4 rounded-2xl border border-[var(--card-border)] bg-[var(--accent-blue-bg,var(--gray-50))]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <p className="font-semibold mb-1">We set you to internships only</p>
          <p className="text-sm text-[var(--gray-600)]">
            Based on your graduation year, we updated your preferences so you only get
            matched to Internship and Co-op roles. You can switch back to full-time
            anytime from{" "}
            <Link href="/profile" className="underline">
              Job Preferences
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => dismiss("keep")}
            disabled={busy !== null}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#ef562a] text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy === "keep" ? "Saving..." : "Sounds good"}
          </button>
          <button
            onClick={() => dismiss("switch")}
            disabled={busy !== null}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-[var(--card-border)] hover:bg-[var(--gray-50)] disabled:opacity-50"
          >
            {busy === "switch" ? "Saving..." : "Switch to full-time"}
          </button>
        </div>
      </div>
    </div>
  );
}
