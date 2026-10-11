"use client";

import { useEffect, useState } from "react";

const WINDOW_MS = 10 * 60 * 1000;

// A fresh 10-minute window starts on every page load. The copy always asks
// the visitor to register in the next 10 minutes; the clock just makes it
// concrete and disappears once it reaches zero.
function useBonusClock(): number | null {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const deadline = Date.now() + WINDOW_MS;
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

  if (variant === "compact") {
    return (
      <div className="rounded-2xl border border-[var(--accent)]/40 bg-[var(--surface-warm)] px-4 py-3 text-sm">
        <div className="flex items-start gap-3">
          <span className="text-xl leading-none" aria-hidden="true">🎁</span>
          <p className="flex-1 min-w-0 text-[var(--foreground)] leading-snug">
            Register in the next{" "}
            {running ? (
              <strong className="font-serif text-base text-[var(--accent)] tabular-nums">
                {format(left)}
              </strong>
            ) : (
              <strong>10 minutes</strong>
            )}{" "}
            and I&apos;ll send you{" "}
            <strong>the exact setup behind my AI editing team</strong>: the
            exact instructions I use to make AI find my best clips, assemble
            my voiceover, and edit my videos.{" "}
            <strong>
              It lands in your inbox right away, so you can start building
              your team tonight instead of waiting for the session.
            </strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-xl rounded-3xl border-2 border-[var(--accent)] bg-[var(--card-bg)] p-6 shadow-[0_16px_40px_rgba(42,38,37,0.12)]">
      <span className="absolute -top-3 left-6 inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full font-medium bg-[var(--cta-bg)] text-white tracking-wide">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        {running ? (
          <>
            BONUS ENDS IN{" "}
            <span className="font-serif text-sm tabular-nums">{format(left)}</span>
          </>
        ) : (
          "10-MINUTE BONUS"
        )}
      </span>
      <div className="flex items-start gap-4 mt-1">
        <span className="text-3xl leading-none" aria-hidden="true">🎁</span>
        <div>
          <p className="text-[var(--foreground)] leading-relaxed">
            Register in the next 10 minutes and I&apos;ll send you{" "}
            <strong>the exact setup behind my AI editing team</strong>.
          </p>
          <p className="mt-3 text-sm text-[var(--gray-600)] leading-relaxed">
            You&apos;ll get the exact instructions I use to make AI find my
            best clips, assemble my voiceover, and edit my videos, so you
            don&apos;t have to figure it all out from scratch.
          </p>
          <p className="mt-3 text-sm text-[var(--gray-600)] leading-relaxed">
            Start setting up your own team today. Then we&apos;ll customize it
            to your content and style together in the workshop. 🤎
          </p>
        </div>
      </div>
    </div>
  );
}
