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
        <ApplicationsDashboard
          initialApplications={allApplications}
          companies={targetCompanies}
          stats={{ total: allApplications.length, applied, failed, sessions: totalSessions, uniqueCompanies: new Set(allApplications.map((a) => a.company)).size }}
        />
      </div>
    </main>
  );
}
