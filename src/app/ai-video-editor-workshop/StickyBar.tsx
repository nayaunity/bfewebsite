"use client";

import { useEffect, useState } from "react";
import OfferButton from "./OfferButton";

/**
 * Floating plugin purchase pill. Appears once the hero scrolls out, hides
 * while the three-option comparison is on screen (it has its own buttons),
 * and sits above the mobile bottom nav.
 */
export default function StickyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const compare = document.getElementById("choose-your-option");
      const hero = document.getElementById("hero");
      const pastHero = hero
        ? hero.getBoundingClientRect().bottom < 0
        : window.scrollY > 700;
      const atCompare = compare
        ? compare.getBoundingClientRect().top < window.innerHeight * 0.6 &&
          compare.getBoundingClientRect().bottom > 0
        : false;
      setVisible(pastHero && !atCompare);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-20 md:bottom-6 z-[9998] flex justify-center px-4 pointer-events-none transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto flex items-center gap-3 sm:gap-5 bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[0_12px_40px_rgba(42,38,37,0.18)] rounded-full pl-5 pr-2 py-2 max-w-full">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)] leading-tight whitespace-nowrap">
            <span className="sm:hidden">AI editing plugin · $97</span>
            <span className="hidden sm:inline">AI Video Editing Plugin</span>
          </p>
          <p className="hidden sm:block text-xs text-[var(--gray-600)] leading-tight whitespace-nowrap">
            $97 one time · runs in Grok Bot
          </p>
        </div>
        <OfferButton
          offer="plugin"
          location="sticky"
          label="Get the plugin"
          wrapperClassName="flex-shrink-0"
          className="inline-flex items-center justify-center gap-2 bg-[var(--cta-bg)] text-white px-5 py-2.5 rounded-full font-medium hover:bg-[var(--accent-hover)] transition-colors text-sm whitespace-nowrap disabled:opacity-70"
        />
      </div>
    </div>
  );
}
