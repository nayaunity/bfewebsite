"use client";

import { useEffect } from "react";

export default function PageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "onboarding-self-identification",
        title: "Onboarding Self-Identification",
      }),
      keepalive: true,
    }).catch(() => {});
  }, []);
  return null;
}
