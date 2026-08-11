"use client";

import { useEffect } from "react";

export default function CreatorsPageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "skool-creators", title: "Creators Landing Page" }),
    }).catch(() => {});
  }, []);

  return null;
}
