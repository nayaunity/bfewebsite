"use client";

import { useState } from "react";

interface UserRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  monthlyAppCount: number;
  autoApplyEnabled: boolean;
  resumeUrl: string | null;
  targetRole: string | null;
  createdAt: string;
  currentPeriodEnd: string | null;
  sessionCount: number;
}

const TIERS = [
  { key: "all", label: "All" },
  { key: "free", label: "Free" },
  { key: "trial", label: "Trial" },
  { key: "starter", label: "Starter" },
  { key: "past_due", label: "Past due" },
  { key: "pro", label: "Pro" },
];

// "trial" and "past_due" are statuses, not tiers. We split them out from
// tier=starter so operators can monitor billing-state cohorts separately.
const isTrial = (u: { subscriptionStatus: string }) => u.subscriptionStatus === "trialing";
const isPastDue = (u: { subscriptionStatus: string }) =>
  u.subscriptionStatus === "past_due" || u.subscriptionStatus === "unpaid";
const isPaidStarter = (u: { subscriptionTier: string; subscriptionStatus: string }) =>
  u.subscriptionTier === "starter" && u.subscriptionStatus !== "trialing" && !isPastDue(u);

export default function UserTable({ users }: { users: UserRow[] }) {
  const [tierFilter, setTierFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = users.filter((u) => {
    if (tierFilter === "trial" && !isTrial(u)) return false;
    if (tierFilter === "past_due" && !isPastDue(u)) return false;
    if (tierFilter === "starter" && !isPaidStarter(u)) return false;
    if (
      tierFilter !== "all" &&
      tierFilter !== "trial" &&
      tierFilter !== "past_due" &&
      tierFilter !== "starter" &&
      u.subscriptionTier !== tierFilter
    ) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase();
      if (!name.includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const tierCounts = {
    all: users.length,
    free: users.filter((u) => u.subscriptionTier === "free").length,
    trial: users.filter(isTrial).length,
    starter: users.filter(isPaidStarter).length,
    past_due: users.filter(isPastDue).length,
    pro: users.filter((u) => u.subscriptionTier === "pro").length,
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden mb-8">
      <div className="px-4 py-3 border-b border-[var(--card-border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-[var(--foreground)]">
          Users ({filtered.length})
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--gray-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 w-40"
            />
          </div>
          <div className="flex gap-1">
            {TIERS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTierFilter(t.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  tierFilter === t.key
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                }`}
              >
                {t.label}
                <span className="ml-1 opacity-60">
                  {tierCounts[t.key as keyof typeof tierCounts]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--gray-50)] text-[10px] font-semibold text-[var(--gray-600)] uppercase tracking-wider">
              <th className="text-left px-4 py-2">User</th>
              <th className="text-left px-4 py-2">Plan</th>
              <th className="text-left px-4 py-2">Target Role</th>
              <th className="text-center px-4 py-2">Apps</th>
              <th className="text-center px-4 py-2">Sessions</th>
              <th className="text-center px-4 py-2">Resume</th>
              <th className="text-center px-4 py-2">Auto</th>
              <th className="text-right px-4 py-2">Subscribed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-xs text-[var(--gray-600)]">
                  No users match this filter
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--gray-50)] transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-[var(--foreground)] text-xs">
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                    </p>
                    <p className="text-[10px] text-[var(--gray-600)]">{u.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                      isPastDue(u) ? "bg-red-100 text-red-800" :
                      isTrial(u) ? "bg-amber-100 text-amber-800" :
                      u.subscriptionTier === "pro" ? "bg-[#ef562a]/10 text-[#ef562a]" :
                      u.subscriptionTier === "starter" ? "bg-blue-100 text-blue-700" :
                      "bg-[var(--gray-100)] text-[var(--gray-600)]"
                    }`}>
                      {isPastDue(u) ? "past due" : isTrial(u) ? "trial" : u.subscriptionTier}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--gray-600)]">
                    {u.targetRole || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs text-[var(--foreground)]">
                    {u.monthlyAppCount}
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs text-[var(--foreground)]">
                    {u.sessionCount}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {u.resumeUrl ? (
                      <span className="text-green-600 text-xs">Yes</span>
                    ) : (
                      <span className="text-[var(--gray-600)] text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {u.autoApplyEnabled ? (
                      <span className="text-green-600 text-xs">On</span>
                    ) : (
                      <span className="text-[var(--gray-600)] text-xs">Off</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[10px] text-[var(--gray-600)]">
                    {u.currentPeriodEnd && u.subscriptionTier !== "free" ? (() => {
                      const periodEnd = new Date(u.currentPeriodEnd);
                      const subscribed = new Date(periodEnd);
                      subscribed.setMonth(subscribed.getMonth() - 1);
                      return subscribed.toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      });
                    })() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
