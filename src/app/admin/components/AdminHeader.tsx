"use client";

import { signOut } from "next-auth/react";

interface AdminHeaderProps {
  user: {
    email: string;
  };
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2">
          <span className="font-serif text-xl font-bold">BFE</span>
          <span className="text-xs bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 rounded">
            Admin
          </span>
        </div>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* User info and sign out */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
            {user.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
