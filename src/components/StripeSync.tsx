"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Fires a one-time sync call after Stripe checkout redirect.
 * If the webhook missed, this ensures the user's tier gets updated.
 *
 * Prefers the session-id path (works unauthenticated, idempotent) and falls
 * back to the authenticated POST /api/stripe/sync.
 */
export function StripeSync() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("subscription") !== "success") return;

    const sessionId = searchParams.get("session_id");
    const url = sessionId
      ? `/api/stripe/sync-by-session?session_id=${encodeURIComponent(sessionId)}`
      : "/api/stripe/sync";
    const init: RequestInit = sessionId
      ? { method: "GET" }
      : { method: "POST" };

    fetch(url, init)
      .then((res) => res.json())
      .then((data) => {
        if (data?.synced) {
          router.refresh();
        }
      })
      .catch(() => {});
  }, [searchParams, router]);

  return null;
}
