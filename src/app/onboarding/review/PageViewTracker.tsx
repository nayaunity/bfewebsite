"use client";

import { useEffect } from "react";

export default function PageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "onboarding-review", title: "Onboarding Review" }),
      keepalive: true,
    }).catch(() => {});
  }, []);
  return null;
}
