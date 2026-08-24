"use client";

import { useEffect } from "react";

export default function PromptPackPageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "skool-prompt-pack-1",
        title: "AI Income Lab: Prompt Pack #1",
      }),
    }).catch(() => {});
  }, []);

  return null;
}
