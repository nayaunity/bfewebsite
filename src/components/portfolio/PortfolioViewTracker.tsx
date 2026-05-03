"use client";

import { useEffect } from "react";

export function PortfolioViewTracker({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: `portfolio-${slug}`, title }),
    }).catch(() => {});
  }, [slug, title]);

  return null;
}
