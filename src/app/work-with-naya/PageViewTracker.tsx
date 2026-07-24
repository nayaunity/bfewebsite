"use client";

import { useEffect } from "react";

export default function PageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "work-with-naya", title: "Work With Naya" }),
    }).catch(() => {});
  }, []);

  return null;
}
