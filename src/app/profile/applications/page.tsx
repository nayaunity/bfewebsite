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

  const [applications, stats, browseDiscoveries] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.jobApplication.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: true,
    }),
    prisma.browseDiscovery.findMany({
      where: {
        session: { userId: session.user.id },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        session: { select: { targetRole: true } },
      },
    }),
  ]);

  // Merge browse discoveries into the applications view
  // Map discovery statuses to application-compatible statuses
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

  // Combine both sources, dedup by applyUrl, sort by date
  const allApplications = [
    ...applications.map((a) => ({ ...a, source: "api" as const, applyUrl: null as string | null, targetRole: null as string | null })),
    ...discoveryAsApplications,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Count statuses across both sources
  const statusCounts = allApplications.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <PagePresenceTracker page="applications" />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to profile
        </Link>

        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)]">
            Application History
          </h1>
          <p className="mt-2 text-[var(--gray-600)]">
            Track your auto-applied job applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {Object.values(statusCounts).reduce((a, b) => a + b, 0)}
            </p>
            <p className="text-xs text-[var(--gray-600)]">Total</p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {(statusCounts.submitted || 0) + (statusCounts.applied || 0)}
            </p>
            <p className="text-xs text-[var(--gray-600)]">Applied</p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {statusCounts.skipped || 0}
            </p>
            <p className="text-xs text-[var(--gray-600)]">Skipped</p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {statusCounts.failed || 0}
            </p>
            <p className="text-xs text-[var(--gray-600)]">Failed</p>
          </div>
        </div>

        <ApplicationsDashboard initialApplications={allApplications} companies={targetCompanies} />
      </div>
    </main>
  );
}
