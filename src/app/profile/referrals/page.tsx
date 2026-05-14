import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getLinkedInStatusForUser,
  getReferralAccessForUser,
  getWarmMatchesForUser,
} from "@/lib/referrals/server";
import { getReferralAccessSummary } from "@/lib/referrals/core";
import { getReferralBackendStatus } from "@/lib/referrals/runtime";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { PaymentFailedBanner } from "@/components/PaymentFailedBanner";
import { TrialRequiredBanner } from "@/components/TrialRequiredBanner";
import { TicketWidget } from "@/components/TicketWidget";
import { SupportEmail } from "@/components/SupportEmail";
import ReferralsDashboard from "./ReferralsDashboard";
import { isReferralAssistEnabledForEmail } from "@/lib/referrals/beta";

export const dynamic = "force-dynamic";

const include = {
  job: {
    select: {
      id: true,
      title: true,
      company: true,
      companySlug: true,
      applyUrl: true,
      location: true,
      postedAt: true,
    },
  },
  connection: {
    select: {
      id: true,
      fullName: true,
      headline: true,
      currentCompany: true,
      profileUrl: true,
      avatarUrl: true,
    },
  },
  resume: {
    select: {
      id: true,
      fileName: true,
      blobUrl: true,
    },
  },
  events: {
    orderBy: { createdAt: "desc" as const },
    take: 10,
    select: {
      id: true,
      type: true,
      message: true,
      metadata: true,
      createdAt: true,
    },
  },
};

export default async function ReferralsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/profile/referrals");
  }

  if (!isReferralAssistEnabledForEmail(session.user.email)) {
    redirect("/profile/applications");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      onboardingCompletedAt: true,
      selfIdCompletedAt: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      freeTierEndsAt: true,
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  if (!user.onboardingCompletedAt) {
    redirect("/auto-apply/get-started");
  }

  const isPayingStatus = ["trialing", "active", "past_due"].includes(user.subscriptionStatus);
  if (isPayingStatus && !user.selfIdCompletedAt) {
    redirect("/onboarding/self-identification");
  }

  const [backend, totalActiveJobs] = await Promise.all([
    getReferralBackendStatus(),
    prisma.job.count({
      where: { isActive: true },
    }),
  ]);

  const fallbackAccess = getReferralAccessSummary({
    tier: user.subscriptionTier || "free",
    subscriptionStatus: user.subscriptionStatus || "inactive",
    monthlyUsed: 0,
    concurrentUsed: 0,
  });

  const referralData = backend.ready
    ? await (async () => {
        const [{ access }, linkedInStatus, requests] = await Promise.all([
          getReferralAccessForUser(session.user.id),
          getLinkedInStatusForUser(session.user.id),
          prisma.referralRequest.findMany({
            where: { userId: session.user.id },
            orderBy: [{ updatedAt: "desc" }],
            include,
          }),
        ]);

        const warmMatches = access.canPreview
          ? await getWarmMatchesForUser(session.user.id)
          : [];

        return {
          access,
          linkedInStatus,
          requests,
          warmMatches,
        };
      })()
    : {
        access: fallbackAccess,
        linkedInStatus: {
          connectionsTotal: 0,
          activeConnections: 0,
          lastRun: null,
        },
        requests: [],
        warmMatches: [],
      };

  return (
    <>
      <Navigation />
      <PagePresenceTracker page="profile-referrals" />
      <main className="min-h-screen bg-[var(--background)] pt-[88px] md:pt-[120px] pb-20 md:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-12">
          {(user.subscriptionStatus === "past_due" || user.subscriptionStatus === "unpaid") && (
            <PaymentFailedBanner />
          )}
          {user.subscriptionTier === "free" && user.freeTierEndsAt && (
            <TrialRequiredBanner freeTierEndsAt={user.freeTierEndsAt.toISOString()} />
          )}

          <div className="mb-4">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">Referral Assist MVP</p>
            <h1 className="mt-2 font-serif text-3xl md:text-4xl text-[var(--foreground)]">
              {user.firstName ? `${user.firstName}, use your network with the same rigor as your applications.` : "Use your network with the same rigor as your applications."}
            </h1>
            <p className="mt-2 max-w-3xl text-sm md:text-base text-[var(--gray-600)]">
              Sync first-degree LinkedIn connections, generate a clean referral packet for warm jobs in the BFE catalog, and track what happens after the ask goes out.
            </p>
          </div>

          <ProfileTabs showReferrals />

          <ReferralsDashboard
            initialAccess={referralData.access}
            initialWarmMatches={referralData.warmMatches}
            initialRequests={referralData.requests.map((request) => ({
              ...request,
              submittedAt: request.submittedAt?.toISOString() || null,
              followUpDueAt: request.followUpDueAt?.toISOString() || null,
              sentAt: request.sentAt?.toISOString() || null,
              introMadeAt: request.introMadeAt?.toISOString() || null,
              interviewAt: request.interviewAt?.toISOString() || null,
              offerAt: request.offerAt?.toISOString() || null,
              hiredAt: request.hiredAt?.toISOString() || null,
              closedAt: request.closedAt?.toISOString() || null,
              createdAt: request.createdAt.toISOString(),
              updatedAt: request.updatedAt.toISOString(),
              job: {
                ...request.job,
                postedAt: request.job.postedAt?.toISOString() || null,
              },
              events: request.events.map((event) => ({
                ...event,
                createdAt: event.createdAt.toISOString(),
              })),
            }))}
            connectionsTotal={referralData.linkedInStatus.connectionsTotal}
            activeConnections={referralData.linkedInStatus.activeConnections}
            lastSyncRun={referralData.linkedInStatus.lastRun ? {
              status: referralData.linkedInStatus.lastRun.status,
              startedAt: referralData.linkedInStatus.lastRun.startedAt.toISOString(),
              completedAt: referralData.linkedInStatus.lastRun.completedAt?.toISOString() || null,
              connectionsSeen: referralData.linkedInStatus.lastRun.connectionsSeen,
              connectionsUpserted: referralData.linkedInStatus.lastRun.connectionsUpserted,
            } : null}
            totalActiveJobs={totalActiveJobs}
            backendReady={backend.ready}
            backendMessage={backend.message}
          />
        </div>

        <SupportEmail />
        <TicketWidget page="referrals" />
      </main>
      <Footer />
    </>
  );
}
