"use client";

import { useEffect } from "react";
import { usePagePresence } from "@/hooks/usePagePresence";

interface BlogViewTrackerProps {
  slug: string;
  title: string;
}

export function BlogViewTracker({ slug, title }: BlogViewTrackerProps) {
  // Track presence in live activity feed
  usePagePresence(`blog/${slug}`);

  useEffect(() => {
    // Track view for analytics
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
