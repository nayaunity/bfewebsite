import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import { ResumeHealthBanner } from "@/components/profile/ResumeHealthBanner";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { Suspense } from "react";
import Link from "next/link";
import ApplicationsDashboard from "./ApplicationsDashboard";
import { TicketWidget } from "@/components/TicketWidget";
import { SupportEmail } from "@/components/SupportEmail";
import { canApply } from "@/lib/subscription";
import { isReferralAssistEnabledForEmail } from "@/lib/referrals/beta";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/profile/applications");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const showReferrals = isReferralAssistEnabledForEmail(session.user.email);

  const [user, applications, browseDiscoveries, usageData, todaySession, reviewTasks, totalActiveJobs, referralConnectionCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, monthlyAppCount: true, subscriptionTier: true, subscriptionStatus: true, targetRole: true, onboardingData: true, resumeUrl: true, resumes: { select: { id: true }, take: 1 }, freeTierEndsAt: true, seekingInternship: true, preferenceBannerDismissedAt: true, selfIdCompletedAt: true },
    }),
    prisma.jobApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.browseDiscovery.findMany({
      where: {
        session: { userId: session.user.id },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        session: { select: { targetRole: true, resumeUrl: true, createdAt: true } },
        reviewTask: {
          select: {
            id: true,
            status: true,
            title: true,
            reason: true,
            draft: true,
            editedDraft: true,
            reviewerNotes: true,
            createdAt: true,
          },
        },
      },
    }),
    canApply(session.user.id),
    prisma.browseSession.findFirst({
      where: {
        userId: session.user.id,
        createdAt: { gte: todayStart },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        targetRole: true,
        totalCompanies: true,
        companiesDone: true,
        jobsFound: true,
        jobsApplied: true,
        jobsFailed: true,
        jobsSkipped: true,
        createdAt: true,
        startedAt: true,
        reviewTasks: {
          where: { status: "pending" },
          select: { id: true },
        },
        discoveries: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            company: true,
            jobTitle: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.reviewTask.findMany({
      where: {
        userId: session.user.id,
        status: "pending",
      },
      orderBy: { createdAt: "desc" },
      include: {
        discovery: {
          select: {
            company: true,
            jobTitle: true,
            applyUrl: true,
            atsType: true,
            confidenceBucket: true,
            confidenceScore: true,
            personalizedWritingRequired: true,
            matchReason: true,
          },
        },
      },
    }),
    prisma.job.count({
      where: { source: "auto-apply", isActive: true, region: { in: ["us", "both"] } },
    }),
    prisma.linkedInConnection.count({
      where: { userId: session.user.id, status: "active" },
    }),
  ]);

  // Mandatory self-identification gate. Catches paying users who closed the
  // tab on /onboarding/self-identification and re-entered via the dashboard.
  if (user) {
    const isPayingStatus = ["trialing", "active", "past_due"].includes(user.subscriptionStatus);
    if (isPayingStatus && !user.selfIdCompletedAt) {
      redirect("/onboarding/self-identification");
    }
  }

  const discoveryAsApplications = browseDiscoveries.map((d) => ({
    id: d.id,
    company: d.company,
    jobTitle: d.jobTitle,
    applyUrl: d.applyUrl,
    status:
      d.userActionRequired || d.reviewTask?.status === "pending"
        ? "review"
        : d.status === "applied"
          ? "submitted"
          : d.status === "skipped"
            ? "skipped"
            : d.status === "failed"
              ? "failed"
              : "pending",
    errorMessage: d.errorMessage,
    submittedAt: d.status === "applied" ? d.createdAt : null,
    createdAt: d.createdAt,
    source: "browse" as const,
    targetRole: d.session?.targetRole || null,
    resumeTailored: d.resumeTailored || false,
    tailoredResumeUrl: d.tailoredResumeUrl || null,
    originalResumeUrl: d.session?.resumeUrl || null,
    matchScore: d.matchScore,
    matchReason: d.matchReason,
    atsType: d.atsType || null,
    confidenceBucket: d.confidenceBucket || null,
    confidenceScore: d.confidenceScore || null,
    userActionRequired: d.userActionRequired || false,
    personalizedWritingRequired: d.personalizedWritingRequired || false,
    reviewReason: d.reviewTask?.reason || null,
  }));

  const allApplications = [
    ...applications.map((a) => ({ ...a, source: "api" as const, applyUrl: null as string | null, targetRole: null as string | null, resumeTailored: false, tailoredResumeUrl: null as string | null, originalResumeUrl: null as string | null, matchScore: null as number | null, matchReason: null as string | null })),
    ...discoveryAsApplications,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const applied = allApplications.filter((a) => a.status === "submitted" || a.status === "applied").length;
  const failed = allApplications.filter((a) => a.status === "failed").length;

  // Hero stats for the Mission Log layout. Computed from real data so the
  // server stays the source of truth (no schema change).
  const oneWeekAgoMs = todayStart.getTime() - 6 * 24 * 60 * 60 * 1000;
  const thisWeek = allApplications.filter((a) => {
    if (a.status !== "submitted" && a.status !== "applied") return false;
    const ts = a.submittedAt ?? a.createdAt;
    return ts ? new Date(ts).getTime() >= oneWeekAgoMs : false;
  }).length;

  const matchScores = allApplications
    .filter((a) => (a.status === "submitted" || a.status === "applied") && typeof a.matchScore === "number")
    .map((a) => a.matchScore as number);
  const matchAvg = matchScores.length
    ? Math.round(matchScores.reduce((s, n) => s + n, 0) / matchScores.length)
    : 0;

  // Streak: consecutive calendar days back from today with >=1 applied app.
  const appliedDateSet = new Set(
    allApplications
      .filter((a) => a.status === "submitted" || a.status === "applied")
      .map((a) => {
        const ts = a.submittedAt ?? a.createdAt;
        return new Date(ts).toISOString().slice(0, 10);
      })
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (appliedDateSet.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Extract user's preferred roles: profile targetRole (JSON array or string) > onboarding data
  let userRoles: string[] = [];
  if (user?.targetRole) {
    try {
      const parsed = JSON.parse(user.targetRole);
      if (Array.isArray(parsed)) userRoles = parsed;
    } catch { /* not JSON, treat as single role */ }
    if (userRoles.length === 0) userRoles = [user.targetRole];
  }
  if (userRoles.length === 0 && user?.onboardingData) {
    try {
      const onboarding = JSON.parse(user.onboardingData);
      if (Array.isArray(onboarding.roles) && onboarding.roles.length > 0) {
        userRoles = onboarding.roles;
      }
    } catch { /* ignore */ }
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)] pt-[88px] md:pt-[120px] pb-20 md:pb-0">
        <PagePresenceTracker page="applications" />
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 md:py-12">
          <Suspense><ResumeHealthBanner userId={session.user.id} /></Suspense>
          {/* Header */}
          <div className="mb-4">
            <h1 className="font-serif text-2xl md:text-3xl text-[var(--foreground)]">
              {user?.firstName ? `Welcome back, ${user.firstName}` : "Your Dashboard"}
            </h1>
            <p className="mt-1 text-sm text-[var(--gray-600)]">
              Track and manage your auto-applied job applications
            </p>
          </div>

          <ProfileTabs showReferrals={showReferrals} />

          {showReferrals && (
            <section className="mb-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">
                    {referralConnectionCount > 0 ? "Referral network active" : "High-signal lane"}
                  </p>
                  <h2 className="mt-1 font-serif text-2xl text-[var(--foreground)]">
                    {referralConnectionCount > 0
                      ? `${referralConnectionCount} connection${referralConnectionCount !== 1 ? "s" : ""} synced. Use them.`
                      : "Sync your LinkedIn to unlock warm referrals."}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-[var(--gray-600)]">
                    {referralConnectionCount > 0
                      ? "We matched your connections to companies with open roles. Get referred instead of cold applying."
                      : "Upload your LinkedIn connections CSV and we will surface jobs where you already know someone on the inside."}
                  </p>
                </div>
                <Link
                  href="/profile/referrals"
                  className="inline-flex items-center justify-center rounded-full bg-[#4d1b27] px-5 py-3 text-sm font-semibold text-white hover:bg-[#d84a21]"
                >
                  {referralConnectionCount > 0 ? "View referrals" : "Sync LinkedIn"}
                </Link>
              </div>
            </section>
          )}

          {/* Main Dashboard */}
          <ApplicationsDashboard
            initialApplications={allApplications}
            stats={{
            total: allApplications.length,
              applied,
              failed,
              uniqueCompanies: new Set(allApplications.filter((a) => a.status === "submitted" || a.status === "applied").map((a) => a.company)).size,
              thisWeek,
              matchAvg,
              streak,
            }}
            usage={{ used: usageData.used, limit: usageData.limit, tier: usageData.tier }}
            totalActiveJobs={totalActiveJobs}
            appliedCompanies={[...new Set(allApplications.filter(a => a.status === "submitted" || a.status === "applied").map(a => a.company))].slice(0, 5)}
            profileReady={!!(user?.targetRole && (user.resumeUrl || (user.resumes && user.resumes.length > 0)))}
            missingRoles={!user?.targetRole}
            missingResume={!user?.resumeUrl && (!user?.resumes || user.resumes.length === 0)}
            showResumeQuiz={
              (user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trialing") &&
              !!(user.resumeUrl || (user.resumes && user.resumes.length > 0))
            }
            subscriptionTier={user?.subscriptionTier ?? "free"}
            subscriptionStatus={user?.subscriptionStatus ?? "inactive"}
            freeTierEndsAt={user?.freeTierEndsAt ? user.freeTierEndsAt.toISOString() : null}
            showInternshipPreferenceBanner={
              user?.seekingInternship === true && !user?.preferenceBannerDismissedAt
            }
            reviewTasks={reviewTasks.map((task) => ({
              id: task.id,
              status: task.status,
              type: task.type,
              title: task.title,
              prompt: task.prompt,
              reason: task.reason,
              requiredActions: task.requiredActions,
              draft: task.draft,
              editedDraft: task.editedDraft,
              reviewerNotes: task.reviewerNotes,
              createdAt: task.createdAt.toISOString(),
              updatedAt: task.updatedAt.toISOString(),
              company: task.discovery.company,
              jobTitle: task.discovery.jobTitle,
              applyUrl: task.discovery.applyUrl,
              atsType: task.discovery.atsType,
              confidenceBucket: task.discovery.confidenceBucket,
              confidenceScore: task.discovery.confidenceScore,
              personalizedWritingRequired: task.discovery.personalizedWritingRequired,
              matchReason: task.discovery.matchReason,
            }))}
            // Do NOT include todaySession.errorMessage or any per-discovery
            // errorMessage here. Raw worker error text is operator-only and
            // belongs in /admin/errors and /admin/auto-apply, never in the
            // user dashboard. Keep todayActivity neutral.
            todayActivity={todaySession ? {
              status: todaySession.status,
              totalCompanies: todaySession.totalCompanies,
              companiesDone: todaySession.companiesDone,
              jobsFound: todaySession.jobsFound,
              jobsApplied: todaySession.jobsApplied,
              jobsFailed: todaySession.jobsFailed,
              jobsSkipped: todaySession.jobsSkipped,
              pendingReviewCount: todaySession.reviewTasks.length,
              startedAt: todaySession.startedAt?.toISOString() || null,
              discoveries: todaySession.discoveries.map((d) => ({
                id: d.id,
                company: d.company,
                jobTitle: d.jobTitle,
                status: d.status,
                createdAt: d.createdAt.toISOString(),
              })),
            } : null}
          />
        </div>
        <SupportEmail />
        <TicketWidget page="applications" />
      </main>
      <Footer />
    </>
  );
}
