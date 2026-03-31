import { requireFullAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAutoApplyPage() {
  await requireFullAdmin();

  const [
    totalDiscoveries,
    discoveryByStatus,
    discoveryByCompany,
    browseSessions,
    optedInUsers,
    users,
    totalUsers,
  ] = await Promise.all([
    prisma.browseDiscovery.count(),
    prisma.browseDiscovery.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.browseDiscovery.groupBy({
      by: ["company"],
      _count: true,
      orderBy: { _count: { company: "desc" } },
      take: 10,
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
    prisma.user.count({
      where: { autoApplyEnabled: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        monthlyAppCount: true,
        autoApplyEnabled: true,
        resumeUrl: true,
        targetRole: true,
        createdAt: true,
        _count: { select: { browseSessions: true } },
      },
    }),
    prisma.user.count(),
  ]);

  const statusMap = discoveryByStatus.reduce(
    (acc, s) => {
      acc[s.status] = s._count;
      return acc;
    },
    {} as Record<string, number>
  );

  const applied = (statusMap.applied || 0) + (statusMap.submitted || 0);
  const failed = statusMap.failed || 0;
  const skipped = statusMap.skipped || 0;

  return (
    <div className="pb-20 lg:pb-0">
      <h1 className="font-serif text-2xl md:text-3xl text-[var(--foreground)] mb-6">
        Auto-Apply Overview
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {totalDiscoveries}
          </p>
          <p className="text-xs text-[var(--gray-600)]">Total Applications</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">
            {applied}
          </p>
          <p className="text-xs text-[var(--gray-600)]">Applied</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-600">
            {skipped}
          </p>
          <p className="text-xs text-[var(--gray-600)]">Skipped</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
          <p className="text-2xl font-bold text-red-600">
            {failed}
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

      {/* Users */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--foreground)]">
            Users ({totalUsers})
          </h2>
          <div className="flex gap-3 text-xs text-[var(--gray-600)]">
            <span>{users.filter(u => u.resumeUrl).length} with resume</span>
            <span>{users.filter(u => u.subscriptionTier !== "free").length} paid</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--gray-50)] text-[10px] font-semibold text-[var(--gray-600)] uppercase tracking-wider">
                <th className="text-left px-4 py-2">User</th>
                <th className="text-left px-4 py-2">Plan</th>
                <th className="text-left px-4 py-2">Target Role</th>
                <th className="text-center px-4 py-2">Apps</th>
                <th className="text-center px-4 py-2">Sessions</th>
                <th className="text-center px-4 py-2">Resume</th>
                <th className="text-center px-4 py-2">Auto</th>
                <th className="text-right px-4 py-2">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--gray-50)] transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-[var(--foreground)] text-xs">
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                    </p>
                    <p className="text-[10px] text-[var(--gray-600)]">{u.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      u.subscriptionTier === "pro" ? "bg-[#ef562a]/10 text-[#ef562a]" :
                      u.subscriptionTier === "starter" ? "bg-blue-100 text-blue-700" :
                      "bg-[var(--gray-100)] text-[var(--gray-600)]"
                    }`}>
                      {u.subscriptionTier}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--gray-600)]">
                    {u.targetRole || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs text-[var(--foreground)]">
                    {u.monthlyAppCount}
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs text-[var(--foreground)]">
                    {u._count.browseSessions}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {u.resumeUrl ? (
                      <span className="text-green-600 text-xs">Yes</span>
                    ) : (
                      <span className="text-[var(--gray-600)] text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {u.autoApplyEnabled ? (
                      <span className="text-green-600 text-xs">On</span>
                    ) : (
                      <span className="text-[var(--gray-600)] text-xs">Off</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[10px] text-[var(--gray-600)]">
                    {new Date(u.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            {discoveryByCompany.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[var(--gray-600)] text-center">
                No applications yet
              </p>
            ) : (
              discoveryByCompany.map((item) => (
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

        {/* Sessions Summary */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--card-border)]">
            <h2 className="text-sm font-medium text-[var(--foreground)]">
              Sessions ({browseSessions.length})
            </h2>
          </div>
          <div className="divide-y divide-[var(--card-border)]">
            {browseSessions.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[var(--gray-600)] text-center">
                No sessions yet
              </p>
            ) : (
              browseSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        session.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : session.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {session.status}
                    </span>
                    <span className="text-xs text-[var(--gray-600)]">
                      {new Date(session.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[var(--gray-600)]">{session.user?.email}</span>
                    <div className="flex gap-3 text-xs text-[var(--gray-600)]">
                      <span className="text-green-600">{session.jobsApplied} applied</span>
                      <span>{session.jobsFound} found</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Browse Sessions Detail */}
      <div className="mt-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--card-border)]">
          <h2 className="text-sm font-medium text-[var(--foreground)]">
            Browse Sessions (Recent 20)
          </h2>
        </div>
        <div className="divide-y divide-[var(--card-border)]">
          {browseSessions.map((session) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
