"use client";

import Link from "next/link";

export default function LandingNav() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-[#f0e6d6]"
      style={{ background: "rgba(253,250,246,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-8">
        <div className="flex items-baseline gap-3.5">
          <div className="font-serif text-[22px] font-bold tracking-tight">
            BFE<span className="text-[#ef562a]">.</span>
          </div>
          <div className="text-xs text-[#9a3412] tracking-[1.2px] font-semibold hidden sm:block">
            AUTO·APPLY
          </div>
        </div>

        <nav className="hidden md:flex gap-7 text-sm text-[#3a3a3a]">
          <a href="#how" className="hover:text-[#1a1a1a] transition-colors">How it works</a>
          <a href="#companies" className="hover:text-[#1a1a1a] transition-colors">Companies</a>
          <a href="#pricing" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-[#1a1a1a] transition-colors">FAQ</a>
        </nav>

        <Link
          href="/auto-apply/get-started"
          className="bg-[#1a1a1a] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#333] transition-colors"
        >
          Start free →
        </Link>
      </div>
    </header>
  );
}
