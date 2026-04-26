import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import ApplicationsDashboard from "./ApplicationsDashboard";
import { TicketWidget } from "@/components/TicketWidget";
import { canApply } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/profile/applications");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [user, applications, browseDiscoveries, recentSessions, usageData, todaySession, totalActiveJobs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, monthlyAppCount: true, subscriptionTier: true, subscriptionStatus: true, targetRole: true, onboardingData: true, resumeUrl: true, resumes: { select: { id: true }, take: 1 }, freeTierEndsAt: true, seekingInternship: true, preferenceBannerDismissedAt: true },
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
      },
    }),
    prisma.browseSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        targetRole: true,
        totalCompanies: true,
        companiesDone: true,
        jobsFound: true,
        jobsApplied: true,
        jobsFailed: true,
        createdAt: true,
        completedAt: true,
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
        jobsFound: true,
        jobsApplied: true,
        jobsFailed: true,
        createdAt: true,
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
    prisma.job.count({
      where: { source: "auto-apply", isActive: true, region: { in: ["us", "both"] } },
    }),
  ]);

  const discoveryAsApplications = browseDiscoveries.map((d) => ({
    id: d.id,
    company: d.company,
    jobTitle: d.jobTitle,
    applyUrl: d.applyUrl,
    status: d.status === "applied" ? "submitted" : d.status === "skipped" ? "skipped" : d.status === "failed" ? "failed" : "pending",
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
  }));

  const allApplications = [
    ...applications.map((a) => ({ ...a, source: "api" as const, applyUrl: null as string | null, targetRole: null as string | null, resumeTailored: false, tailoredResumeUrl: null as string | null, originalResumeUrl: null as string | null, matchScore: null as number | null, matchReason: null as string | null })),
    ...discoveryAsApplications,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const applied = allApplications.filter((a) => a.status === "submitted" || a.status === "applied").length;
  const failed = allApplications.filter((a) => a.status === "failed").length;

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
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs text-[var(--gray-600)] mb-2">
                <Link href="/" className="hover:text-[var(--foreground)] transition-colors">Home</Link>
                <span>/</span>
                <Link href="/profile" className="hover:text-[var(--foreground)] transition-colors">Profile</Link>
                <span>/</span>
                <span className="text-[var(--foreground)]">Applications</span>
              </div>
              <h1 className="font-serif text-2xl md:text-3xl text-[var(--foreground)]">
                {user?.firstName ? `Welcome back, ${user.firstName}` : "Your Dashboard"}
              </h1>
              <p className="mt-1 text-sm text-[var(--gray-600)]">
                Track and manage your auto-applied job applications
              </p>
            </div>
          </div>

          {/* Main Dashboard */}
          <ApplicationsDashboard
            initialApplications={allApplications}
            stats={{ total: allApplications.length, applied, failed, uniqueCompanies: new Set(allApplications.map((a) => a.company)).size }}
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
            // Do NOT include todaySession.errorMessage or any per-discovery
            // errorMessage here. Raw worker error text is operator-only and
            // belongs in /admin/errors and /admin/auto-apply, never in the
            // user dashboard. Keep todayActivity neutral.
            todayActivity={todaySession ? {
              status: todaySession.status,
              jobsFound: todaySession.jobsFound,
              jobsApplied: todaySession.jobsApplied,
              jobsFailed: todaySession.jobsFailed,
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
        <TicketWidget page="applications" />
      </main>
      <Footer />
    </>
  );
}
