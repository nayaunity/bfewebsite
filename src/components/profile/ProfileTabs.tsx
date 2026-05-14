"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Shared tab bar across the profile-area pages so users can jump
 * between Profile (editable fields), Applications (auto-apply dashboard),
 * Referrals (network-assisted lane), and Account (subscription + cancel). Drop-in: place at the top of the
 * page content, below any global banners.
 */
const TABS = [
  { href: "/profile", label: "Profile" },
  { href: "/profile/applications", label: "Applications" },
  { href: "/profile/referrals", label: "Referrals" },
  { href: "/profile/account", label: "Account" },
] as const;

export function ProfileTabs({ showReferrals = true }: { showReferrals?: boolean }) {
  const pathname = usePathname() || "";
  const tabs = showReferrals
    ? TABS
    : TABS.filter((tab) => tab.href !== "/profile/referrals");

  return (
    <nav
      aria-label="Profile sections"
      className="mb-8 border-b border-[var(--card-border)]"
    >
      <ul className="flex gap-1 sm:gap-2 -mb-px overflow-x-auto">
        {tabs.map((t) => {
          // `/profile` must match exactly so nested routes don't keep it lit
          // alongside the deeper tab. Deeper tabs match by prefix so
          // `/profile/applications/anything` stays on Applications.
          const active =
            t.href === "/profile"
              ? pathname === "/profile"
              : pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={
                  "inline-block px-3 sm:px-4 py-3 text-sm transition-colors border-b-2 whitespace-nowrap " +
                  (active
                    ? "border-[#ef562a] text-[var(--foreground)] font-medium"
                    : "border-transparent text-[var(--gray-600)] hover:text-[var(--foreground)]")
                }
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
