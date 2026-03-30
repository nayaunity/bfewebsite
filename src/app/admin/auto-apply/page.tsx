import { requireFullAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "../components/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminAutoApplyPage() {
  await requireFullAdmin();

  const [
    totalApplications,
    applicationsByStatus,
    applicationsByCompany,
    recentRuns,
    optedInUsers,
    browseSessions,
  ] = await Promise.all([
    prisma.jobApplication.count(),
    prisma.jobApplication.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.jobApplication.groupBy({
      by: ["company"],
      _count: true,
      orderBy: { _count: { company: "desc" } },
      take: 10,
    }),
    prisma.autoApplyRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
    prisma.user.count({
      where: { autoApplyEnabled: true },
    }),
    prisma.browseSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        discoveries: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    }),
  ]);

  const statusMap = applicationsByStatus.reduce(
    (acc, s) => {
      acc[s.status] = s._count;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AdminSidebar role="admin" />

      <div className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 py-8 pb-24 lg:pb-8">
          <h1 className="font-serif text-2xl md:text-3xl text-[var(--foreground)] mb-6">
            Auto-Apply Overview
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {totalApplications}
              </p>
              <p className="text-xs text-[var(--gray-600)]">Total Applications</p>
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
              <p className="text-2xl font-bold text-green-600">
                {statusMap.submitted || 0}
              </p>
              <p className="text-xs text-[var(--gray-600)]">Submitted</p>
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
              <p className="text-2xl font-bold text-yellow-600">
                {statusMap.skipped || 0}
              </p>
              <p className="text-xs text-[var(--gray-600)]">Skipped</p>
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
              <p className="text-2xl font-bold text-red-600">
                {statusMap.failed || 0}
              </p>
              <p className="text-xs text-[var(--gray-600)]">Failed</p>
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
              <p className="text-2xl font-bold text-[#ef562a]">
                {optedInUsers}
              </p>
              <p className="text-xs text-[var(--gray-600)]">Opted-In Users</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* By Company */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--card-border)]">
                <h2 className="text-sm font-medium text-[var(--foreground)]">
                  Applications by Company
                </h2>
              </div>
              <div className="divide-y divide-[var(--card-border)]">
                {applicationsByCompany.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-[var(--gray-600)] text-center">
                    No applications yet
                  </p>
                ) : (
                  applicationsByCompany.map((item) => (
                    <div
                      key={item.company}
                      className="px-4 py-2.5 flex items-center justify-between"
                    >
                      <span className="text-sm text-[var(--foreground)]">
                        {item.company}
                      </span>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {item._count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Runs */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--card-border)]">
                <h2 className="text-sm font-medium text-[var(--foreground)]">
                  Recent Runs
                </h2>
              </div>
              <div className="divide-y divide-[var(--card-border)]">
                {recentRuns.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-[var(--gray-600)] text-center">
                    No runs yet
                  </p>
                ) : (
                  recentRuns.map((run) => (
                    <div key={run.id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            run.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : run.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {run.status}
                        </span>
                        <span className="text-xs text-[var(--gray-600)]">
                          {new Date(run.startedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-[var(--gray-600)]">
                        <span>{run.submitted} submitted</span>
                        <span>{run.skipped} skipped</span>
                        <span>{run.failed} failed</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          {/* Browse Sessions */}
          <div className="mt-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--card-border)]">
              <h2 className="text-sm font-medium text-[var(--foreground)]">
                Browse Sessions (Recent 20)
              </h2>
            </div>
            <div className="divide-y divide-[var(--card-border)]">
              {browseSessions.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[var(--gray-600)] text-center">
                  No browse sessions yet
                </p>
              ) : (
                browseSessions.map((session) => (
                  <details key={session.id} className="group">
                    <summary className="px-4 py-3 cursor-pointer hover:bg-[var(--gray-50)] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            session.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : session.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : session.status === "processing"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {session.status}
                        </span>
                        <span className="text-sm text-[var(--foreground)]">
                          {session.user?.email || "Unknown"}
                        </span>
                        <span className="text-xs text-[var(--gray-600)]">
                          {session.targetRole}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--gray-600)]">
                        <span className="text-green-600">{session.jobsApplied} applied</span>
                        <span className="text-red-600">{session.jobsFailed} failed</span>
                        <span>{session.jobsFound} found</span>
                        <span>
                          {new Date(session.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </summary>
                    <div className="px-4 py-2 bg-[var(--gray-50)] border-t border-[var(--card-border)]">
                      {session.errorMessage && (
                        <p className="text-xs text-red-600 mb-2">Error: {session.errorMessage}</p>
                      )}
                      {session.discoveries.length === 0 ? (
                        <p className="text-xs text-[var(--gray-600)]">No discoveries</p>
                      ) : (
                        <div className="space-y-1">
                          {session.discoveries.map((d) => (
                            <div key={d.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    d.status === "applied"
                                      ? "bg-green-500"
                                      : d.status === "failed"
                                      ? "bg-red-500"
                                      : "bg-yellow-500"
                                  }`}
                                />
                                <span className="text-[var(--foreground)]">
                                  {d.company}: {d.jobTitle}
                                </span>
                              </div>
                              <span className="text-[var(--gray-600)] max-w-[200px] truncate">
                                {d.errorMessage || d.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
