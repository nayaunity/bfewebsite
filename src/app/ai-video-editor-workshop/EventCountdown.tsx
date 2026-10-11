"use client";

import { useState, useEffect } from "react";

// Saturday, October 24, 2026 at 3:00 PM Eastern (daylight time in October).
export const WORKSHOP_START = new Date("2026-10-24T15:00:00-04:00");
// Assume roughly two hours live, then the replay goes out to registrants.
const WORKSHOP_END = new Date(WORKSHOP_START.getTime() + 2 * 60 * 60 * 1000);

type State =
  | { phase: "upcoming"; days: number; hours: number; minutes: number }
  | { phase: "live" }
  | { phase: "over" };

function getState(): State {
  const now = Date.now();
  if (now >= WORKSHOP_END.getTime()) return { phase: "over" };
  if (now >= WORKSHOP_START.getTime()) return { phase: "live" };
  const diff = WORKSHOP_START.getTime() - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { phase: "upcoming", days, hours, minutes };
}

export default function EventCountdown({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const [state, setState] = useState<State>(getState);

  useEffect(() => {
    const interval = setInterval(() => setState(getState()), 60000);
    return () => clearInterval(interval);
  }, []);

  const muted = variant === "dark" ? "text-white/70" : "text-[var(--gray-600)]";
  const strong = variant === "dark" ? "text-white" : "text-[var(--foreground)]";
  const dot = variant === "dark" ? "bg-[var(--deck-rose)]" : "bg-[var(--cta-bg)]";

  if (state.phase === "over") {
    return (
      <div className={`flex items-center gap-2 text-sm ${muted}`}>
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
        <span>
          The live session has ended. Registrants get the{" "}
          <strong className={strong}>full recording</strong>.
        </span>
      </div>
    );
  }

  if (state.phase === "live") {
    return (
      <div className={`flex items-center gap-2 text-sm ${muted}`}>
        <span className={`inline-block w-2 h-2 rounded-full ${dot} animate-pulse`} />
        <span>
          <strong className={strong}>Happening right now.</strong> Register to
          get the recording.
        </span>
      </div>
    );
  }

  const label =
    state.days > 0
      ? `${state.days} ${state.days === 1 ? "day" : "days"}${
          state.hours > 0 ? ` ${state.hours}h` : ""
        }`
      : `${state.hours}h ${state.minutes}m`;

  return (
    <div className={`flex items-center gap-2 text-sm ${muted}`}>
      <span className={`inline-block w-2 h-2 rounded-full ${dot} animate-pulse`} />
      <span>
        We go live in <strong className={strong}>{label}</strong>. Seats close
        when the session starts.
      </span>
    </div>
  );
}
