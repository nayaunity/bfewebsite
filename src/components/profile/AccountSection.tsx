"use client";

import Link from "next/link";
import { ProfileSection } from "./ProfileSection";
import { ManageSubscriptionLink } from "@/components/ManageSubscriptionLink";

interface Props {
  user: {
    createdAt: string;
    role: string;
    emailVerified: boolean;
    stripeCustomerId: string | null;
    lessonsCompleted: number;
    winsShared: number;
  };
  tier: string;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function AccountSection({ user, tier }: Props) {
  return (
    <ProfileSection
      title="Account"
      description="Subscription, history, and admin access"
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      }
      hideSave
    >
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-[var(--gray-600)]">Member since</span>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {formatDate(user.createdAt)}
          </span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-[var(--gray-600)]">Account type</span>
          <span className="text-sm font-medium text-[var(--foreground)] capitalize">
            {user.role}
          </span>
        </div>

        {user.lessonsCompleted > 0 && (
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-[var(--gray-600)]">Lessons completed</span>
            <span className="text-sm font-medium text-[var(--foreground)]">
              {user.lessonsCompleted}
            </span>
          </div>
        )}

        {user.winsShared > 0 && (
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-[var(--gray-600)]">Wins shared</span>
            <span className="text-sm font-medium text-[var(--foreground)]">
              {user.winsShared}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--card-border)]">
        <Link
          href="/profile/applications"
          className="inline-flex items-center gap-2 text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          View Application History
        </Link>

        <Link
          href="/pricing"
          className="text-sm text-[#ef562a] hover:underline"
        >
          {tier === "free" ? "Upgrade Plan" : "Change Plan"}
        </Link>

        {user.stripeCustomerId && <ManageSubscriptionLink />}
      </div>

      {user.role === "admin" && (
        <div className="pt-4 border-t border-[var(--card-border)]">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--gray-600)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Go to Admin Dashboard
          </Link>
        </div>
      )}
    </ProfileSection>
  );
}
