"use client";

import { useEffect } from "react";

/**
 * Records a page view for /profile/account. Mirrors the pattern used by the
 * other profile-area pages so the slug shows up in /admin/analytics.
 */
export function PageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "profile-account", title: "Account" }),
    }).catch(() => {
      // analytics is best-effort; never block the page
    });
  }, []);
  return null;
}
