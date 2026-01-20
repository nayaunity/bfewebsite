"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function AuthButton() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const pathname = usePathname();

  // Loading state
  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--gray-200)] animate-pulse" />
    );
  }

  // Not signed in
  if (!session) {
    return (
      <Link
        href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`}
        className="text-sm font-medium text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors"
      >
        Sign In
      </Link>
    );
  }

  // Signed in - show user menu
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        className="flex items-center gap-2 text-sm font-medium text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors"
      >
        {/* User avatar/initial */}
        <div className="w-8 h-8 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center text-xs font-medium">
          {session.user.email?.[0]?.toUpperCase() || "U"}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--card-bg)] rounded-lg shadow-lg border border-[var(--card-border)] py-2 z-50">
          {/* Email display */}
          <div className="px-4 py-2 border-b border-[var(--card-border)]">
            <p className="text-sm text-[var(--gray-600)]">Signed in as</p>
            <p className="text-sm font-medium text-[var(--foreground)] truncate">
              {session.user.email}
            </p>
          </div>

          {/* Sign out button */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left px-4 py-2 text-sm text-[var(--gray-600)] hover:bg-[var(--gray-50)] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
