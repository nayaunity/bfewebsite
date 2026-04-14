import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

function fmtDuration(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtAgo(d: Date, nowMs: number): string {
  const diff = nowMs - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === "success"
      ? "bg-green-100 text-green-800 border-green-300"
      : status === "partial"
      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
      : status === "running"
      ? "bg-blue-100 text-blue-800 border-blue-300"
      : "bg-red-100 text-red-800 border-red-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {status}
    </span>
  );
}

async function loadRuns() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const rows = await prisma.scrapeRun.findMany({
    where: { startedAt: { gte: sevenDaysAgo } },
    orderBy: { startedAt: "desc" },
    take: 100,
  });
  return { rows, nowMs: now.getTime() };
}

export default async function ScrapeRunsPage() {
  await requireAdmin();

  const { rows: runs, nowMs } = await loadRuns();

  const latestByCron = new Map<string, typeof runs[number]>();
  for (const r of runs) {
    if (!latestByCron.has(r.cron)) latestByCron.set(r.cron, r);
  }

  const crons = ["scrape-autoapply", "scrape-jobs"];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-[var(--foreground)]">
              Scrape <span className="italic text-[#ef562a]">runs</span>
            </h1>
            <p className="text-[var(--gray-600)] mt-1 text-sm">
              Last 7 days of cron executions
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)]"
          >
            ← Back to admin
          </Link>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {crons.map((cron) => {
            const latest = latestByCron.get(cron);
            const stale = latest && nowMs - latest.startedAt.getTime() > 30 * 60 * 60 * 1000;
            const bad = !latest || latest.status === "failed" || stale;
            return (
              <div
                key={cron}
                className={`bg-[var(--card-bg)] border rounded-2xl p-5 ${
                  bad ? "border-red-300" : "border-[var(--card-border)]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-medium text-[var(--foreground)]">{cron}</h2>
                  {latest ? (
                    <StatusPill status={latest.status} />
                  ) : (
                    <StatusPill status="never ran" />
                  )}
                </div>
                {latest ? (
                  <dl className="grid grid-cols-2 gap-y-2 text-sm">
                    <dt className="text-[var(--gray-600)]">Last run</dt>
                    <dd>{fmtAgo(latest.startedAt, nowMs)}</dd>
                    <dt className="text-[var(--gray-600)]">Duration</dt>
                    <dd>{fmtDuration(latest.durationMs)}</dd>
                    <dt className="text-[var(--gray-600)]">Companies</dt>
                    <dd>
                      {latest.companiesSuccessful}/{latest.companiesTotal}
                      {latest.companiesFailed > 0 && (
                        <span className="text-red-700 ml-1">
                          ({latest.companiesFailed} failed)
                        </span>
                      )}
                    </dd>
                    <dt className="text-[var(--gray-600)]">Jobs saved</dt>
                    <dd>{latest.jobsSaved.toLocaleString()}</dd>
                    <dt className="text-[var(--gray-600)]">Deactivated</dt>
                    <dd>{latest.jobsDeactivated.toLocaleString()}</dd>
                  </dl>
                ) : (
                  <p className="text-sm text-red-700">No run in the last 7 days.</p>
                )}
                {bad && latest && (
                  <p className="text-sm text-red-700 mt-3">
                    {stale
                      ? "⚠ Last run was more than 30 hours ago"
                      : "⚠ Last run did not complete successfully"}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Full run table */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--gray-50)] text-[var(--gray-600)]">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Cron</th>
                <th className="text-left px-4 py-2 font-medium">Started</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-right px-4 py-2 font-medium">Duration</th>
                <th className="text-right px-4 py-2 font-medium">Companies</th>
                <th className="text-right px-4 py-2 font-medium">Found</th>
                <th className="text-right px-4 py-2 font-medium">Saved</th>
                <th className="text-right px-4 py-2 font-medium">Deactivated</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-[var(--gray-600)]">
                    No scrape runs recorded in the last 7 days.
                  </td>
                </tr>
              )}
              {runs.map((r) => (
                <tr key={r.id} className="border-t border-[var(--card-border)]">
                  <td className="px-4 py-2">{r.cron}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {r.startedAt.toISOString().replace("T", " ").slice(0, 19)} UTC
                  </td>
                  <td className="px-4 py-2"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-2 text-right">{fmtDuration(r.durationMs)}</td>
                  <td className="px-4 py-2 text-right">
                    {r.companiesSuccessful}/{r.companiesTotal}
                    {r.companiesFailed > 0 && (
                      <span className="text-red-700"> ({r.companiesFailed} fail)</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">{r.jobsFound.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{r.jobsSaved.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{r.jobsDeactivated.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
