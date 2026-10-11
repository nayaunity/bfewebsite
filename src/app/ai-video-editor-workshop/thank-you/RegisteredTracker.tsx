"use client";

import { useEffect } from "react";
import { THANK_YOU_SLUGS, type ThankYouOffer } from "./slugs";

export default function RegisteredTracker({ offer }: { offer: ThankYouOffer }) {
  useEffect(() => {
    const { slug, title } = THANK_YOU_SLUGS[offer];
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, title }),
    }).catch(() => {});
  }, [offer]);

  return null;
}
