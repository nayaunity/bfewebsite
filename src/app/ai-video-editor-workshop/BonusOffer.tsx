"use client";

import { useEffect, useState } from "react";

const WINDOW_MS = 10 * 60 * 1000;
const KEY = "aive-bonus-deadline";
// Once the window has run out, keep it closed for this long before a
// returning visitor gets a fresh 10 minutes.
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

// The 10-minute window starts on the visitor's first view and is stored in
// the browser, so a refresh or a second tab keeps the same deadline instead
// of restarting from 10:00. The copy always asks the visitor to register in
// the next 10 minutes; the clock makes it concrete and disappears at zero.
function useBonusClock(): number | null {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    let deadline = 0;
    try {
      const stored = Number(window.localStorage.getItem(KEY));
      const now = Date.now();
      if (stored && stored > now - COOLDOWN_MS) {
        deadline = stored;
      } else {
        deadline = now + WINDOW_MS;
        window.localStorage.setItem(KEY, String(deadline));
      }
    } catch {
      deadline = Date.now() + WINDOW_MS;
    }
    const tick = () => setLeft(Math.max(0, deadline - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return left;
}

function format(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BonusOffer({
  variant = "card",
}: {
  variant?: "card" | "compact";
}) {
  const left = useBonusClock();
  const running = left !== null && left > 0;
  const closed = left === 0;

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--surface-warm)] px-4 py-3.5 text-sm">
        <div className="flex items-start gap-3">
          <span className="text-xl leading-none" aria-hidden="true">🎁</span>
          <div className="flex-1 min-w-0">
            {running && (
              <p className="text-xs font-medium text-[var(--accent)] mb-1">
                Bonus ends in{" "}
                <span className="font-poppins font-bold tabular-nums">{format(left)}</span>
              </p>
            )}
            {closed ? (
              <p className="text-[var(--gray-600)] leading-snug">
                The 10-minute bonus window has closed. Your seat still includes
                everything listed, and the live build is where we set up your
                team together.
              </p>
            ) : (
              <p className="text-[var(--foreground)] leading-snug">
                Register in the next 10 minutes and I&apos;ll send you{" "}
                <strong>the exact setup behind my AI editing team</strong> NOW:
                my AI Video Editor Bot with the five roles, the hand-offs, and my
                rules already written.{" "}
                <strong>
                  It lands in your inbox right away, so you can start building
                  your team tonight instead of waiting for the session.
                </strong>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--accent)] bg-[var(--card-bg)] p-6 md:p-7">
      <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1 rounded-full bg-[var(--cta-bg)] text-white">
        {running ? (
          <>
            Bonus ends in{" "}
            <span className="font-poppins font-bold tabular-nums">{format(left)}</span>
          </>
        ) : closed ? (
          "Bonus window closed"
        ) : (
          "10-minute bonus"
        )}
      </span>
      <div className="mt-4">
        {closed ? (
          <p className="text-[var(--foreground)] leading-relaxed">
            The 10-minute bonus window has closed. Your seat still includes
            everything in the stack below, and the live build on October 24
            is where we set up your team together.
          </p>
        ) : (
          <>
            <p className="text-lg text-[var(--foreground)] leading-relaxed">
              <span className="mr-2" aria-hidden="true">🎁</span>
              Register in the next 10 minutes and I&apos;ll send you{" "}
              <strong>the exact setup behind my AI editing team</strong> NOW.
            </p>
            <p className="mt-3 text-sm text-[var(--gray-600)] leading-relaxed">
              It is my AI Video Editor Bot, ready to use: the five roles already
              written, the hand-offs between them, and my rules for picking
              clips, assembling the voiceover, and placing captions. Open it,
              point it at your footage, and it starts working. No blank page.
            </p>
            <p className="mt-3 text-sm text-[var(--gray-600)] leading-relaxed">
              Start setting up your own team today. Then we&apos;ll customize it
              to your content and style together in the workshop. 🤎
            </p>
          </>
        )}
      </div>
    </div>
  );
}
