"use client";

import { useRef, useState } from "react";

export default function DemoVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  return (
    <div className="relative aspect-video rounded-2xl md:rounded-3xl overflow-hidden bg-[var(--dark-card-bg)] ring-1 ring-[var(--card-border)] shadow-[0_24px_80px_rgba(42,38,37,0.18)]">
      <video
        ref={ref}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        src="/videos/grok-editor-demo.mp4"
        poster="/videos/grok-editor-demo-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-label="Walkthrough of Naya's AI Video Editor Bot in Grok Bot, from footage to final cut"
      />
      {!playing && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Play walkthrough"
          className="absolute inset-0 flex items-center justify-center bg-black/30"
        >
          <span className="w-16 h-16 rounded-full bg-[var(--cta-bg)] text-white flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
      <span className="absolute bottom-3 right-3 md:bottom-4 md:right-4 bg-black/55 backdrop-blur text-white text-[11px] font-medium px-2.5 py-1 rounded-full pointer-events-none">
        53 sec · no sound
      </span>
    </div>
  );
}
