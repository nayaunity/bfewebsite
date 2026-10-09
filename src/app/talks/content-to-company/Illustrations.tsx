import React from "react";

/*
 * Flat illustrations for the keynote deck, drawn in the deck palette.
 * Colors come from the --deck-* variables so they stay fixed in both themes.
 */

const P = {
  primary: "var(--deck-primary)",
  deep: "var(--deck-primary-deep)",
  ink: "var(--deck-ink)",
  cream: "var(--deck-cream)",
  rose: "var(--deck-rose)",
  soft: "var(--deck-rose-soft)",
  text: "var(--deck-text)",
};

type SvgProps = { className?: string };

/** Microphone on a stand plus a boxy camera. Title slide. */
export function MicAndCamera({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 420 420" className={className} aria-hidden="true">
      {/* mic stand */}
      <rect x="196" y="190" width="14" height="110" rx="7" fill={P.ink} />
      <rect x="150" y="296" width="106" height="16" rx="8" fill={P.ink} />
      {/* mic head */}
      <rect x="150" y="30" width="106" height="170" rx="53" fill={P.rose} />
      <g fill={P.ink}>
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2].map((c) => (
            <circle key={`${r}-${c}`} cx={176 + c * 27} cy={70 + r * 30} r="6" />
          ))
        )}
      </g>
      <rect x="140" y="150" width="126" height="22" rx="11" fill={P.cream} />
      {/* camera */}
      <rect x="40" y="240" width="200" height="150" rx="20" fill={P.cream} />
      <rect x="40" y="240" width="200" height="34" rx="17" fill={P.soft} />
      <circle cx="120" cy="320" r="46" fill={P.ink} />
      <circle cx="120" cy="320" r="26" fill={P.rose} />
      <circle cx="112" cy="312" r="7" fill={P.cream} />
      <rect x="178" y="296" width="40" height="30" rx="8" fill={P.ink} />
      <circle cx="198" cy="350" r="7" fill={P.rose} />
      <circle cx="220" cy="350" r="7" fill={P.rose} />
      <circle cx="198" cy="370" r="7" fill={P.rose} />
      <circle cx="220" cy="370" r="7" fill={P.rose} />
      {/* sparkle */}
      <path d="M340 110 l10 26 26 10 -26 10 -10 26 -10 -26 -26 -10 26 -10z" fill={P.cream} />
      <path d="M372 220 l6 16 16 6 -16 6 -6 16 -6 -16 -16 -6 16 -6z" fill={P.soft} />
    </svg>
  );
}

/** Phone on a desk mount. Opening hook. */
export function PhoneOnStand({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 420 420" className={className} aria-hidden="true">
      {/* base and arm */}
      <rect x="150" y="360" width="140" height="26" rx="13" fill={P.ink} />
      <rect x="206" y="300" width="28" height="70" rx="10" fill={P.ink} />
      <rect x="150" y="286" width="140" height="30" rx="15" fill={P.ink} />
      {/* clamps */}
      <rect x="92" y="150" width="28" height="90" rx="10" fill={P.ink} />
      <rect x="300" y="150" width="28" height="90" rx="10" fill={P.ink} />
      {/* phone */}
      <rect x="120" y="40" width="180" height="270" rx="30" fill={P.cream} />
      <rect x="132" y="52" width="156" height="246" rx="22" fill={P.rose} />
      <rect x="180" y="58" width="60" height="12" rx="6" fill={P.cream} />
      {/* person silhouette on screen */}
      <circle cx="210" cy="150" r="30" fill={P.soft} />
      <path d="M150 250 c0 -45 30 -70 60 -70 s60 25 60 70z" fill={P.soft} />
      {/* side button */}
      <rect x="304" y="190" width="20" height="40" rx="8" fill={P.cream} />
    </svg>
  );
}

/** Film camera with a clapperboard. Media companies. */
export function FilmCamera({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 420 420" className={className} aria-hidden="true">
      {/* reels */}
      <circle cx="150" cy="110" r="60" fill={P.rose} />
      <circle cx="260" cy="110" r="60" fill={P.rose} />
      {[150, 260].map((cx) => (
        <g key={cx} fill={P.ink}>
          <circle cx={cx} cy={110} r="14" />
          <circle cx={cx - 30} cy={110} r="9" />
          <circle cx={cx + 30} cy={110} r="9" />
          <circle cx={cx} cy={80} r="9" />
          <circle cx={cx} cy={140} r="9" />
        </g>
      ))}
      {/* body */}
      <rect x="110" y="170" width="200" height="130" rx="20" fill={P.cream} />
      <rect x="40" y="210" width="80" height="60" rx="14" fill={P.ink} />
      <circle cx="235" cy="250" r="12" fill={P.ink} />
      <circle cx="265" cy="250" r="12" fill={P.ink} />
      <circle cx="250" cy="280" r="12" fill={P.ink} />
      {/* clapperboard */}
      <rect x="230" y="290" width="160" height="100" rx="12" fill={P.cream} />
      <rect x="230" y="262" width="160" height="40" rx="10" fill={P.ink} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={240 + i * 40} y="262" width="20" height="40" fill={P.cream} transform={`skewX(-20) translate(${(262 * 0.364).toFixed(1)} 0)`} />
      ))}
      <circle cx="310" cy="340" r="14" fill={P.rose} />
    </svg>
  );
}

/** Rising bars with a star. The reveal. */
export function RisingBars({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 420 420" className={className} aria-hidden="true">
      <rect x="40" y="300" width="70" height="80" rx="14" fill={P.soft} />
      <rect x="130" y="240" width="70" height="140" rx="14" fill={P.rose} />
      <rect x="220" y="150" width="70" height="230" rx="14" fill={P.cream} />
      <rect x="310" y="60" width="70" height="320" rx="14" fill={P.cream} />
      <path d="M345 20 l9 24 24 9 -24 9 -9 24 -9 -24 -24 -9 24 -9z" fill={P.rose} />
      <text x="40" y="408" fill={P.text} fontSize="22" fontWeight="700" opacity="0.7">$170K</text>
      <text x="300" y="408" fill={P.text} fontSize="22" fontWeight="700" opacity="0.7">$700K</text>
    </svg>
  );
}

/** Magnifying glass over a chart. Job 1. */
export function MagnifierChart({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 420 420" className={className} aria-hidden="true">
      <rect x="40" y="60" width="260" height="200" rx="22" fill={P.cream} />
      <polyline points="70,210 130,160 180,185 240,110 280,130" fill="none" stroke={P.primary} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="240" cy="110" r="12" fill={P.rose} />
      <circle cx="280" cy="230" r="80" fill={P.rose} opacity="0.95" />
      <circle cx="280" cy="230" r="58" fill={P.cream} />
      <polyline points="240,250 265,225 290,238 318,200" fill="none" stroke={P.primary} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="326" y="282" width="34" height="110" rx="17" fill={P.ink} transform="rotate(-45 343 337)" />
    </svg>
  );
}

/** Play button with a stack of cards. Job 2. */
export function PlayAndCards({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 420 420" className={className} aria-hidden="true">
      {/* vertical phone card */}
      <rect x="40" y="80" width="150" height="260" rx="26" fill={P.rose} />
      <circle cx="115" cy="170" r="48" fill={P.ink} />
      <path d="M102 146 l42 24 -42 24z" fill={P.cream} />
      <rect x="70" y="250" width="90" height="14" rx="7" fill={P.cream} />
      <circle cx="80" cy="300" r="9" fill={P.cream} />
      {/* stacked photo cards */}
      <rect x="230" y="150" width="150" height="110" rx="16" fill={P.soft} transform="rotate(8 305 205)" />
      <rect x="220" y="130" width="150" height="110" rx="16" fill={P.cream} transform="rotate(3 295 185)" />
      <rect x="210" y="110" width="150" height="110" rx="16" fill={P.cream} />
      <path d="M225 205 l40 -44 32 30 24 -20 34 34z" fill={P.rose} />
      <circle cx="330" cy="140" r="12" fill={P.rose} />
      <circle cx="250" cy="290" r="9" fill={P.cream} />
      <circle cx="280" cy="290" r="9" fill={P.cream} />
      <circle cx="310" cy="290" r="9" fill={P.cream} />
    </svg>
  );
}

/** Compass-style target with rays. Advice slide. */
export function Target({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 420 420" className={className} aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x="204"
          y="20"
          width="12"
          height="46"
          rx="6"
          fill={P.rose}
          opacity={i % 2 ? 0.5 : 1}
          transform={`rotate(${i * 30} 210 210)`}
        />
      ))}
      <circle cx="210" cy="210" r="110" fill={P.cream} />
      <circle cx="210" cy="210" r="76" fill={P.rose} />
      <circle cx="210" cy="210" r="42" fill={P.cream} />
      <circle cx="210" cy="210" r="14" fill={P.ink} />
    </svg>
  );
}

/** Two sparkles for the close. */
export function Sparkles({ className = "" }: SvgProps) {
  return (
    <svg viewBox="0 0 420 420" className={className} aria-hidden="true">
      <path d="M210 40 l30 80 80 30 -80 30 -30 80 -30 -80 -80 -30 80 -30z" fill={P.rose} />
      <path d="M330 250 l16 42 42 16 -42 16 -16 42 -16 -42 -42 -16 42 -16z" fill={P.cream} />
      <path d="M80 280 l10 26 26 10 -26 10 -10 26 -10 -26 -26 -10 26 -10z" fill={P.soft} />
    </svg>
  );
}
