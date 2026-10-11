"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkButton({
  subscriptionId,
  action,
  label,
}: {
  subscriptionId: string;
  action: "invited" | "removed";
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const onClick = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/community-members/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, action }),
      });
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setErr("Could not save. Try again.");
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="text-xs font-medium px-3 py-1.5 rounded-full bg-[var(--cta-bg)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
      >
        {busy ? "Saving..." : label}
      </button>
      {err && <span className="text-[11px] text-[var(--accent)]">{err}</span>}
    </span>
  );
}
