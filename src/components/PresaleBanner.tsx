"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PRESALE_END = new Date("2026-03-25T08:00:00-06:00");
const TOTAL_SPOTS = 19;

function getTimeLeft() {
  const now = new Date();
  const diff = PRESALE_END.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { days, hours, minutes };
}

export default function PresaleBanner() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const pathname = usePathname();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const expired =
    timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0;

  // Hide on admin pages
  if (expired || pathname.startsWith("/admin")) return null;

  return (
    <Link
      href="/claudecode"
      className="fixed top-0 left-0 right-0 z-[9999] bg-[#ef562a] text-white py-3 px-4 text-center block hover:bg-[#d94a22] transition-colors cursor-pointer"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 sm:gap-6 font-serif text-base sm:text-lg tracking-wide">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ffe500] animate-pulse" />
        <span className="italic">
          Presale closes in{" "}
          <span className="not-italic font-bold">
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
          </span>
        </span>
        <span className="opacity-40">|</span>
        <span>
          <strong className="text-white text-xl sm:text-2xl font-bold">{TOTAL_SPOTS}</strong>{" "}
          <span className="italic">spots remaining</span>
        </span>
      </div>
    </Link>
  );
}
