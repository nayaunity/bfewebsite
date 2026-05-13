import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PaymentFailedBanner } from "@/components/PaymentFailedBanner";
import { TrialRequiredBanner } from "@/components/TrialRequiredBanner";
import { ResumeHealthBanner } from "@/components/profile/ResumeHealthBanner";
import { TicketWidget } from "@/components/TicketWidget";
import { ManageSubscriptionLink } from "@/components/ManageSubscriptionLink";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";

import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { CancelSubscriptionButton } from "@/components/profile/CancelSubscriptionButton";
import { PageViewTracker } from "./PageViewTracker";

export const dynamic = "force-dynamic";

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function subscriptionLabel(status: string | null, periodEnd: Date | null): string {
  if (status === "trialing" && periodEnd) {
    return `Trial (ends ${new Date(periodEnd).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })})`;
  }
  if (status === "active") return "Active";
  if (status === "past_due") return "Past due";
  if (status === "unpaid") return "Unpaid";
  if (status === "canceled") return "Canceled";
  return "Free";
}

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/profile/account");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      role: true,
      createdAt: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      freeTierEndsAt: true,
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const tier = user.subscriptionTier || "free";
  const status = user.subscriptionStatus;
  const cancelable =
    !!user.stripeSubscriptionId &&
    (status === "trialing" ||
      status === "active" ||
      status === "past_due" ||
      status === "unpaid");

  return (
    <>
      <Navigation />
      <PagePresenceTracker page="profile-account" />
      <PageViewTracker />
      <main className="min-h-screen bg-[var(--background)] pt-[88px] md:pt-[120px] pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {(status === "past_due" || status === "unpaid") && <PaymentFailedBanner />}
          {tier === "free" && user.freeTierEndsAt && (
            <TrialRequiredBanner freeTierEndsAt={user.freeTierEndsAt.toISOString()} />
          )}
          <Suspense>
            <ResumeHealthBanner userId={user.id} />
          </Suspense>

          {/* Header */}
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)]">
              Account
            </h1>
            <SubscriptionBadge tier={tier} />
          </div>
          <p className="text-sm text-[var(--gray-600)] mb-6">
            Subscription, billing, and account details.
          </p>

          <ProfileTabs />

          {/* Account details card */}
          <section
            className="rounded-2xl border p-5 sm:p-6 mb-6"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <h2 className="font-serif text-lg text-[var(--foreground)] mb-4">
              Details
            </h2>
            <dl className="divide-y divide-[var(--card-border)]">
              <div className="flex justify-between items-center py-3">
                <dt className="text-sm text-[var(--gray-600)]">Email</dt>
                <dd className="text-sm font-medium text-[var(--foreground)] truncate ml-4">
                  {user.email}
                </dd>
              </div>
              <div className="flex justify-between items-center py-3">
                <dt className="text-sm text-[var(--gray-600)]">Member since</dt>
                <dd className="text-sm font-medium text-[var(--foreground)]">
                  {formatDate(user.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between items-center py-3">
                <dt className="text-sm text-[var(--gray-600)]">Account type</dt>
                <dd className="text-sm font-medium text-[var(--foreground)] capitalize">
                  {user.role}
                </dd>
              </div>
              <div className="flex justify-between items-center py-3">
                <dt className="text-sm text-[var(--gray-600)]">Plan</dt>
                <dd className="text-sm font-medium text-[var(--foreground)] capitalize">
                  {tier}
                </dd>
              </div>
              <div className="flex justify-between items-center py-3">
                <dt className="text-sm text-[var(--gray-600)]">Subscription</dt>
                <dd className="text-sm font-medium text-[var(--foreground)]">
                  {subscriptionLabel(status, user.currentPeriodEnd)}
                </dd>
              </div>
              {user.currentPeriodEnd && (status === "active" || status === "trialing") && (
                <div className="flex justify-between items-center py-3">
                  <dt className="text-sm text-[var(--gray-600)]">
                    {status === "trialing" ? "Trial ends" : "Renews"}
                  </dt>
                  <dd className="text-sm font-medium text-[var(--foreground)]">
                    {formatDate(user.currentPeriodEnd)}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Billing actions */}
          <section
            className="rounded-2xl border p-5 sm:p-6 mb-6"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
          >
            <h2 className="font-serif text-lg text-[var(--foreground)] mb-4">
              Billing
            </h2>
            <div className="flex flex-wrap gap-3 items-center">
              {tier === "free" ? (
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-95"
                  style={{ background: "#ef562a" }}
                >
                  Upgrade plan
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
                  style={{
                    borderColor: "var(--card-border)",
                    color: "var(--foreground)",
                  }}
                >
                  Change plan
                </Link>
              )}

              {user.stripeCustomerId && (
                <ManageSubscriptionLink
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
                  label="Manage billing"
                />
              )}

              {cancelable && !user.cancelAtPeriodEnd && (
                <CancelSubscriptionButton
                  subscriptionStatus={status as "trialing" | "active" | "past_due" | "unpaid"}
                  periodEnd={user.currentPeriodEnd?.toISOString() ?? null}
                />
              )}
            </div>
            {cancelable && user.cancelAtPeriodEnd && (
              <div
                className="mt-4 rounded-xl border p-4"
                style={{
                  background: "var(--accent-blue-bg, #eff6ff)",
                  borderColor: "var(--card-border)",
                }}
              >
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Cancellation scheduled.
                </p>
                <p className="text-xs text-[var(--gray-600)] mt-1">
                  You&apos;ll keep paid access
                  {user.currentPeriodEnd ? (
                    <>
                      {" "}
                      until <span className="font-medium">{formatDate(user.currentPeriodEnd)}</span>
                    </>
                  ) : (
                    " until the end of your current billing period"
                  )}
                  . You won&apos;t be charged again.
                </p>
              </div>
            )}
            {cancelable && !user.cancelAtPeriodEnd && (status === "active" || status === "trialing") && (
              <p className="text-xs text-[var(--gray-600)] mt-4">
                Canceling keeps your paid access until{" "}
                {user.currentPeriodEnd
                  ? formatDate(user.currentPeriodEnd)
                  : "the end of your current billing period"}
                . You won&apos;t be charged again.
              </p>
            )}
            {cancelable && !user.cancelAtPeriodEnd && (status === "past_due" || status === "unpaid") && (
              <p className="text-xs text-[var(--gray-600)] mt-4">
                Your last payment didn&apos;t go through. Canceling stops the
                retries and moves you to the free tier with no charge.
              </p>
            )}
          </section>

          {/* Admin link */}
          {user.role === "admin" && (
            <section
              className="rounded-2xl border p-5 sm:p-6"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)",
              }}
            >
              <h2 className="font-serif text-lg text-[var(--foreground)] mb-3">
                Admin
              </h2>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--gray-600)] transition-colors"
              >
                Go to admin dashboard
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </section>
          )}
        </div>
        <TicketWidget page="profile-account" />
      </main>
      <Footer />
    </>
  );
}
