"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function AuthButton() {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  // Loading state
  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse" />
    );
  }

  // Not signed in
  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
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
        className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
      >
        {/* User avatar/initial */}
        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-medium">
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
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
          {/* Email display */}
          <div className="px-4 py-2 border-b border-neutral-100">
            <p className="text-sm text-neutral-500">Signed in as</p>
            <p className="text-sm font-medium text-neutral-900 truncate">
              {session.user.email}
            </p>
          </div>

          {/* Sign out button */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
