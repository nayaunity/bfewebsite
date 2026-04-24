"use client";

import { useState, useEffect } from "react";

// Presale closes May 1, 2026 (~7 days out from the Apr 24 announcement).
// After this, the presale tier buttons should be taken down or repriced.
const PRESALE_CLOSE_DATE = new Date("2026-05-01T23:59:00-06:00");

function getTimeLeft() {
  const now = new Date();
  const diff = PRESALE_CLOSE_DATE.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes, expired: false };
}

export default function CountdownBadge() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (timeLeft.expired) return null;

  // Show just days when more than 1 day remains; drop to hours+minutes
  // inside the last day for more urgency.
  const label =
    timeLeft.days > 0
      ? `${timeLeft.days} ${timeLeft.days === 1 ? "day" : "days"}`
      : `${timeLeft.hours}h ${timeLeft.minutes}m`;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-block w-2 h-2 rounded-full bg-[#ef562a] animate-pulse" />
      <span className="text-[var(--gray-600)]">
        Presale closes in{" "}
        <strong className="text-[var(--foreground)]">{label}</strong>
      </span>
    </div>
  );
}
