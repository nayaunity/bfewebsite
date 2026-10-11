"use client";

import { useState, useEffect } from "react";

// Saturday, October 24, 2026 at 3:00 PM Eastern (daylight time in October).
export const WORKSHOP_START = new Date("2026-10-24T15:00:00-04:00");
// Three hours live, then the recording goes out to registrants.
export const WORKSHOP_END = new Date(WORKSHOP_START.getTime() + 3 * 60 * 60 * 1000);

export function workshopRegistrationOpen(now = Date.now()): boolean {
  return now < WORKSHOP_START.getTime();
}

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

/**
 * Workshop-only countdown. Lives inside the workshop card and section, never
 * page-wide: the plugin and the membership do not expire when the live
 * session begins.
 */
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

  if (state.phase === "over") {
    return (
      <p className={`text-sm ${muted}`}>
        The live workshop has ended. Registrants receive the{" "}
        <strong className={strong}>full recording</strong>.
      </p>
    );
  }

  if (state.phase === "live") {
    return (
      <p className={`text-sm ${muted}`}>
        <strong className={strong}>The workshop is live right now.</strong>{" "}
        Registration is closed.
      </p>
    );
  }

  const label =
    state.days > 0
      ? `${state.days} ${state.days === 1 ? "day" : "days"}${
          state.hours > 0 ? ` ${state.hours}h` : ""
        }`
      : `${state.hours}h ${state.minutes}m`;

  return (
    <p className={`text-sm ${muted}`}>
      Workshop countdown: <strong className={strong}>{label}</strong>.
      Registration closes when the session starts.
    </p>
  );
}
