"use client";

import { useEffect } from "react";

export default function PageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "ai-video-editor-workshop",
        title: "Build Your AI Video Editing Team: Live Workshop",
      }),
    }).catch(() => {});
  }, []);

  return null;
}
