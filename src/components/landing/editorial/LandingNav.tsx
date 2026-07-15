"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function LandingNav() {
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b border-[#f0e6d6]"
      style={{ background: "rgba(253,250,246,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-8">
        <div className="flex items-baseline gap-3.5">
          <Link href="/" className="font-serif text-[22px] font-bold tracking-tight no-underline text-[#2a2828]">
            BFE<span className="text-[var(--accent)]">.</span>
          </Link>
          <div className="text-xs text-[#9a3412] tracking-[1.2px] font-semibold hidden sm:block">
            AUTO·APPLY
          </div>
        </div>

        <nav className="hidden md:flex gap-7 text-sm text-[#3a3a3a]">
          <a href="#how" className="hover:text-[#2a2828] transition-colors">How it works</a>
          <a href="#companies" className="hover:text-[#2a2828] transition-colors">Companies</a>
          <a href="#pricing" className="hover:text-[#2a2828] transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-[#2a2828] transition-colors">FAQ</a>
        </nav>

        {status === "loading" ? (
          <div className="w-8 h-8 rounded-full bg-[#f0e6d6] animate-pulse" />
        ) : session ? (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              onBlur={() => setTimeout(() => setShowMenu(false), 150)}
              className="flex items-center gap-2 text-sm font-medium text-[#3a3a3a] hover:text-[#2a2828] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#2a2828] text-white flex items-center justify-center text-xs font-semibold">
                {session.user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${showMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showMenu && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#f0e6d6] py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-[#f0e6d6]">
                  <p className="text-xs text-[#78716c]">Signed in as</p>
                  <p className="text-sm font-medium text-[#2a2828] truncate">
                    {session.user?.email}
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="block px-4 py-2.5 text-sm text-[#3a3a3a] hover:bg-[#fdfaf6] transition-colors"
                >
                  Profile
                </Link>
                <Link
                  href="/profile/applications"
                  className="block px-4 py-2.5 text-sm text-[#3a3a3a] hover:bg-[#fdfaf6] transition-colors"
                >
                  Applications
                </Link>
                <Link
                  href="/auto-apply"
                  className="block px-4 py-2.5 text-sm text-[#3a3a3a] hover:bg-[#fdfaf6] transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#78716c] hover:bg-[#fdfaf6] transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/auto-apply/get-started"
            className="bg-[#2a2828] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#333] transition-colors"
          >
            Start free →
          </Link>
        )}
      </div>
    </header>
  );
}
