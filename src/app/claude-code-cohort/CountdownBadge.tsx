"use client";

import { useState, useEffect } from "react";

const PRESALE_END = new Date("2026-03-25T08:00:00-06:00"); // March 25, 2026 at 8am MT
const TOTAL_SPOTS = 30;

function getTimeLeft() {
  const now = new Date();
  const diff = PRESALE_END.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

export function CountdownBar() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const expired =
    timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0;

  if (expired) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#1a1a1a] text-white py-3 px-4 text-center border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 sm:gap-6 font-serif text-sm sm:text-base tracking-wide">
        <span className="italic">
          Presale closes in{" "}
          <span className="not-italic font-bold">
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
          </span>
        </span>
        <span className="text-[#ffe500]">·</span>
        <span>
          <strong className="text-[#ffe500]">{TOTAL_SPOTS}</strong>{" "}
          <span className="italic">spots remaining</span>
        </span>
      </div>
    </div>
  );
}

export default function CountdownBadge() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const expired =
    timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm">
      {!expired && (
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#ef562a] animate-pulse" />
          <span className="text-[var(--gray-600)]">
            Presale ends in{" "}
            <strong className="text-[var(--foreground)]">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
            </strong>
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        {expired && (
          <span className="inline-block w-2 h-2 rounded-full bg-[#ef562a] animate-pulse" />
        )}
        <span className="text-[var(--gray-600)]">
          <strong className="text-[var(--foreground)]">{TOTAL_SPOTS}</strong>{" "}
          spots remaining
        </span>
      </div>
    </div>
  );
}
