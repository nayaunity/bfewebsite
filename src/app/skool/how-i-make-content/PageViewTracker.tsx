"use client";

import { useEffect } from "react";

export default function HowIMakeContentPageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "skool-how-i-make-content",
        title: "How I Actually Make Content: 13 Questions, Answered",
      }),
    }).catch(() => {});
  }, []);

  return null;
}
