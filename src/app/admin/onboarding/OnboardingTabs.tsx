"use client";

import { useState, type ReactNode } from "react";

export function OnboardingTabs({
  funnelTab,
  usersTab,
}: {
  funnelTab: ReactNode;
  usersTab: ReactNode;
}) {
  const [tab, setTab] = useState<"funnel" | "users">("users");

  return (
    <>
      <div className="flex gap-1 mb-6 bg-[var(--gray-100)] rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "users"
              ? "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--gray-600)] hover:text-[var(--foreground)]"
          }`}
        >
          Completed Users
        </button>
        <button
          onClick={() => setTab("funnel")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "funnel"
              ? "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--gray-600)] hover:text-[var(--foreground)]"
          }`}
        >
          Drop-off Funnel
        </button>
      </div>

      {tab === "funnel" ? funnelTab : usersTab}
    </>
  );
}
