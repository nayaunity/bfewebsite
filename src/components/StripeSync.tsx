"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Fires a one-time sync call after Stripe checkout redirect.
 * If the webhook missed, this ensures the user's tier gets updated.
 */
export function StripeSync() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("subscription") === "success") {
      fetch("/api/stripe/sync", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.synced) {
            // Refresh the page to show updated tier
            router.refresh();
          }
        })
        .catch(() => {});
    }
  }, [searchParams, router]);

  return null;
}
