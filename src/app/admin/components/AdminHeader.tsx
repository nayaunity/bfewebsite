"use client";

import { signOut } from "next-auth/react";

interface AdminHeaderProps {
  user: {
    email: string;
  };
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[var(--card-bg)] border-b border-[var(--card-border)]">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2">
          <span className="font-serif text-xl font-bold">BFE</span>
          <span className="text-xs bg-[#ffe500] text-black px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
        </div>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* User info and sign out */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--gray-600)] hidden sm:inline">
            {user.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-[var(--foreground)] px-4 py-2 rounded-full border border-[var(--card-border)] hover:border-black hover:text-black transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
