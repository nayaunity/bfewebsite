"use client";

import { useState, useEffect } from "react";

const LAUNCH_DATE = new Date("2026-05-15T08:00:00-06:00"); // May 15, 2026 at 8am MT

function getTimeLeft() {
  const now = new Date();
  const diff = LAUNCH_DATE.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
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

  if (expired) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-[#ef562a] animate-pulse" />
        <span className="text-[var(--gray-600)]">
          Course is now <strong className="text-[var(--foreground)]">live</strong>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-block w-2 h-2 rounded-full bg-[#ef562a] animate-pulse" />
      <span className="text-[var(--gray-600)]">
        Doors open in{" "}
        <strong className="text-[var(--foreground)]">
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
        </strong>
      </span>
    </div>
  );
}
