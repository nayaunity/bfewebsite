"use client";

import { useEffect } from "react";

export default function WaitlistPageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "skool-waitlist", title: "Community Waitlist" }),
    }).catch(() => {});
  }, []);

  return null;
}
