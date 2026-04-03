import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ErrorsPage() {
  await requireAdmin();

  const [recentErrors, errorsByEndpoint, errorsByDay] = await Promise.all([
    prisma.errorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.$queryRaw<Array<{ endpoint: string; count: bigint }>>`
      SELECT endpoint, COUNT(*) as count FROM ErrorLog
      GROUP BY endpoint ORDER BY count DESC LIMIT 10
    `.catch(() => []),
    prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT DATE(createdAt) as day, COUNT(*) as count FROM ErrorLog
      WHERE createdAt > datetime('now', '-7 days')
      GROUP BY DATE(createdAt) ORDER BY day DESC
    `.catch(() => []),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif">Error Log</h1>
        <span className="text-sm text-[var(--gray-600)]">
          {recentErrors.length} recent errors
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Errors by endpoint */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">
            Errors by Endpoint
          </h3>
          <div className="space-y-2">
            {errorsByEndpoint.length === 0 && (
              <p className="text-sm text-[var(--gray-600)]">No errors yet</p>
            )}
            {errorsByEndpoint.map((e) => (
              <div
                key={e.endpoint}
                className="flex items-center justify-between text-sm"
              >
                <code className="text-xs text-[var(--foreground)]">
                  {e.endpoint}
                </code>
                <span className="text-red-500 font-medium">
                  {Number(e.count)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Errors by day */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">
            Errors by Day (last 7 days)
          </h3>
          <div className="space-y-2">
            {errorsByDay.length === 0 && (
              <p className="text-sm text-[var(--gray-600)]">No errors yet</p>
            )}
            {errorsByDay.map((e) => (
              <div
                key={e.day}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-[var(--gray-600)]">{e.day}</span>
                <span className="text-red-500 font-medium">
                  {Number(e.count)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--card-border)]">
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Recent Errors
          </h3>
        </div>

        {recentErrors.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--gray-600)]">
            No errors logged yet. This is a good thing!
          </div>
        ) : (
          <div className="divide-y divide-[var(--card-border)]">
            {recentErrors.map((error) => (
              <div key={error.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          error.status >= 500
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {error.status}
                      </span>
                      <code className="text-xs text-[var(--gray-600)]">
                        {error.method} {error.endpoint}
                      </code>
                    </div>
                    <p className="text-sm text-[var(--foreground)]">
                      {error.error}
                    </p>
                    {error.detail && (
                      <p className="text-xs text-[var(--gray-600)] mt-1 truncate max-w-xl">
                        {error.detail}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[var(--gray-600)]">
                      {new Date(error.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    {error.userId && (
                      <p className="text-[10px] text-[var(--gray-600)] mt-0.5">
                        {error.userId.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
