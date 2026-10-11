"use client";

import { useEffect } from "react";

export default function RegisteredTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "ai-video-editor-workshop-registered",
        title: "AI Video Editing Team Workshop: Registered",
      }),
    }).catch(() => {});
  }, []);

  return null;
}
