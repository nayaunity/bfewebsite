"use client";

import { useEffect } from "react";

export default function CohortPageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "cohort",
        title: "Fall 2026 Cohort",
      }),
    }).catch(() => {});
  }, []);

  return null;
}
