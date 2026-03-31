import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import ApplicationsDashboard from "./ApplicationsDashboard";
import targetCompanies from "../../../../scripts/target-companies.json";
import { TicketWidget } from "@/components/TicketWidget";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/profile/applications");
  }

  const [user, applications, browseDiscoveries, recentSessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, monthlyAppCount: true, subscriptionTier: true, targetRole: true },
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
            companies={targetCompanies}
            stats={{ total: allApplications.length, applied, failed, sessions: totalSessions, uniqueCompanies: new Set(allApplications.map((a) => a.company)).size }}
            defaultRole={user?.targetRole || null}
          />
        </div>
        <TicketWidget page="applications" />
      </main>
      <Footer />
    </>
  );
}
