"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface Alert {
  id: string;
  kind: string;
  severity: string;
  message: string;
  metadata: string | null;
  createdAt: string;
}

export function AlertBanner({ alerts }: { alerts: Alert[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNowMs(Date.now());
    const i = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(i);
  }, []);

  if (alerts.length === 0) return null;

  async function resolve(id: string) {
    try {
      await fetch(`/api/admin/alerts/${id}/resolve`, { method: "POST" });
      startTransition(() => router.refresh());
    } catch {
      /* swallow */
    }
  }

  return (
    <div className="mb-8 space-y-3">
      {alerts.map((a) => {
        const ago = nowMs == null ? "" : fmtAgo(new Date(a.createdAt), nowMs);
        return (
          <div
            key={a.id}
            className="rounded-2xl border border-red-300 bg-red-50 p-4 md:p-5 flex items-start gap-3"
          >
            <div className="mt-0.5 text-red-700 text-xl leading-none">⚠</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-800">
                  {a.kind.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-red-700">{ago}</span>
              </div>
              <p className="text-sm text-red-900">{a.message}</p>
            </div>
            <button
              onClick={() => resolve(a.id)}
              disabled={isPending}
              className="shrink-0 px-3 py-1.5 rounded-full border border-red-300 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
            >
              Mark resolved
            </button>
          </div>
        );
      })}
    </div>
  );
}

function fmtAgo(d: Date, nowMs: number): string {
  const diff = nowMs - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
