"use client";

import { useEffect } from "react";

export default function QuizPageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "monetizable-skill-quiz",
        title: "PHASE Path Quiz",
      }),
    }).catch(() => {});
  }, []);

  return null;
}
