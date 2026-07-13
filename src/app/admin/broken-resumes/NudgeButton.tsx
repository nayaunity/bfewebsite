"use client";

import { useState } from "react";

export function NudgeButton({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const send = async () => {
    setState("sending");
    setErrorMessage(null);
    try {
      const r = await fetch("/api/admin/broken-resumes/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setErrorMessage(data.error || `HTTP ${r.status}`);
        setState("error");
        return;
      }
      setState("sent");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <span className="text-xs text-green-700 font-medium">
        Nudge sent
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={send}
        disabled={state === "sending"}
        className="rounded-lg bg-[#4d1b27] text-white px-3 py-1.5 text-xs font-medium hover:bg-[#d34d23] disabled:opacity-50 transition-colors"
      >
        {state === "sending" ? "Sending..." : "Send nudge"}
      </button>
      {errorMessage && (
        <span className="text-xs text-red-600">{errorMessage}</span>
      )}
    </div>
  );
}
