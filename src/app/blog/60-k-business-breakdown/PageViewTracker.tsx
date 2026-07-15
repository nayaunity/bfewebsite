"use client";

import { useEffect } from "react";

export default function BlueprintPageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "60-k-business-breakdown",
        title: "The $60K/Month Blueprint Breakdown",
      }),
    }).catch(() => {});
  }, []);

  return null;
}
