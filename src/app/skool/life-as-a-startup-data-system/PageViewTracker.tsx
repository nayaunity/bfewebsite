"use client";

import { useEffect } from "react";

export default function LifeStartupPageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "skool-life-as-a-startup",
        title: "Life as a Startup: The Obsidian + Claude + Wisprflow Data System",
      }),
    }).catch(() => {});
  }, []);

  return null;
}
