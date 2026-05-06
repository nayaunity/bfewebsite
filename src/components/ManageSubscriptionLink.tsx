"use client";

import { useState } from "react";

interface Props {
  className?: string;
  label?: string;
}

export function ManageSubscriptionLink({ className, label }: Props = {}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className || "text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"}
    >
      {loading ? "Loading..." : (label || "Manage Billing")}
    </button>
  );
}
