"use client";

import { useEffect } from "react";

export default function ContentToCompanyPageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "talks-content-to-company",
        title: "Content to Company: Using AI to Build the Next-Gen Media Company",
      }),
    }).catch(() => {});
  }, []);

  return null;
}
