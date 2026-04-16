"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SendButton({ token, count }: { token: string; count: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!confirm(`Send ${count} conversion email${count === 1 ? "" : "s"}? This creates a fresh 72h Stripe coupon per user.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/cap-conversion/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setResult(data);
      setTimeout(() => router.refresh(), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="px-5 py-3 rounded-lg border border-green-300 bg-green-50 text-green-900 text-sm">
        Sent {result.sent} · skipped {result.skipped} · failed {result.failed}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleSend}
        disabled={loading || count === 0}
        className="px-6 py-3 bg-[#ef562a] text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d94921] transition"
      >
        {loading ? "Sending..." : `Send all ${count}`}
      </button>
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
