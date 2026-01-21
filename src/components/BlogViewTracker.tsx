"use client";

import { useEffect } from "react";

interface BlogViewTrackerProps {
  slug: string;
  title: string;
}

export function BlogViewTracker({ slug, title }: BlogViewTrackerProps) {
  useEffect(() => {
    // Track view on mount
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, title }),
    }).catch(() => {
      // Silently fail
    });
  }, [slug, title]);

  return null;
}
