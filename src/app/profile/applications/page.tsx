import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import ApplicationsDashboard from "./ApplicationsDashboard";
import targetCompanies from "../../../../scripts/target-companies.json";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/profile/applications");
  }

  const [user, applications, browseDiscoveries, recentSessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, monthlyAppCount: true, subscriptionTier: true },
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
        session: { select: { targetRole: true, createdAt: true } },
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
  }));

  const allApplications = [
    ...applications.map((a) => ({ ...a, source: "api" as const, applyUrl: null as string | null, targetRole: null as string | null })),
    ...discoveryAsApplications,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const applied = allApplications.filter((a) => a.status === "submitted" || a.status === "applied").length;
  const failed = allApplications.filter((a) => a.status === "failed").length;
  const pending = allApplications.filter((a) => a.status === "pending").length;
  const totalSessions = recentSessions.length;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <PagePresenceTracker page="applications" />
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1 text-xs text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors mb-2"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Profile
            </Link>
            <h1 className="font-serif text-2xl md:text-3xl text-[var(--foreground)]">
              {user?.firstName ? `Welcome back, ${user.firstName}` : "Your Dashboard"}
            </h1>
            <p className="mt-1 text-sm text-[var(--gray-600)]">
              Track and manage your auto-applied job applications
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#ef562a] to-[#d44a22] rounded-2xl p-5 text-white">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Total Applications</span>
              </div>
              <p className="text-3xl font-bold">{allApplications.length}</p>
              <p className="text-xs text-white/70 mt-1">Across {new Set(allApplications.map((a) => a.company)).size} companies</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-8 w-16 h-16 rounded-full bg-white/5" />
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider">Applied</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{applied}</p>
            <p className="text-xs text-[var(--gray-600)] mt-1">Successfully submitted</p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider">Failed</span>
            </div>
            <p className="text-3xl font-bold text-red-500">{failed}</p>
            <p className="text-xs text-[var(--gray-600)] mt-1">Could not complete</p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider">Sessions</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{totalSessions}</p>
            <p className="text-xs text-[var(--gray-600)] mt-1">Apply sessions run</p>
          </div>
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl mb-8 overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--card-border)]">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Recent Sessions</h2>
            </div>
            <div className="divide-y divide-[var(--card-border)]">
              {recentSessions.map((s) => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      s.status === "completed" ? "bg-green-500" :
                      s.status === "failed" ? "bg-red-500" :
                      s.status === "processing" ? "bg-blue-500 animate-pulse" :
                      "bg-gray-400"
                    }`} />
                    <div>
                      <p className="text-sm text-[var(--foreground)]">{s.targetRole}</p>
                      <p className="text-xs text-[var(--gray-600)]">
                        {s.totalCompanies} {s.totalCompanies === 1 ? "company" : "companies"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-[var(--gray-600)]">
                    <span className="text-green-600 font-medium">{s.jobsApplied} applied</span>
                    <span>{s.jobsFound} found</span>
                    {s.jobsFailed > 0 && <span className="text-red-500">{s.jobsFailed} failed</span>}
                    <span className="min-w-[100px] text-right">
                      {new Date(s.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                        timeZone: "America/Denver",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Dashboard */}
        <ApplicationsDashboard initialApplications={allApplications} companies={targetCompanies} />
      </div>
    </main>
  );
}
