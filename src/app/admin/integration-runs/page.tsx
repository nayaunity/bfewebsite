import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

function fmtDuration(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtAgo(d: Date | string, nowMs: number): string {
  const diff = nowMs - new Date(d).getTime();
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

interface UrlResult {
  url: string;
  ats: string;
  role: string;
  expected: string;
  actual: string;
  durationMs: number;
  errorMessage?: string;
}

async function loadIntegrationRuns() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const runs = await prisma.integrationRun.findMany({
    where: { startedAt: { gte: sevenDaysAgo } },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
  return { runs, nowMs: now.getTime() };
}

export default async function IntegrationRunsPage() {
  await requireAdmin();

  const { runs, nowMs } = await loadIntegrationRuns();

  const latest = runs[0];

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)]">
          ← Back to admin
        </Link>

        <h1 className="font-serif text-3xl md:text-4xl mt-4 mb-2">
          Integration runs
        </h1>
        <p className="text-sm text-[var(--gray-600)] mb-8 max-w-2xl">
          Real-URL smoke tests of the apply engine. Each run tries the full
          apply flow against a curated URL catalog. Kind=canary runs post-deploy;
          kind=nightly runs on a Railway cron.
        </p>

        {latest && (
          <div className="mb-8 p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]">
            <div className="flex items-center gap-3 mb-2">
              <StatusPill status={latest.status} />
              <span className="text-sm text-[var(--gray-600)]">
                {latest.kind} · {fmtAgo(latest.startedAt, nowMs)}{" "}
                {latest.useBrowserbase ? "· browserbase" : ""}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-green-600 font-medium">{latest.urlsApplied} applied</span>
              {" · "}
              <span className="text-red-600 font-medium">{latest.urlsFailed} failed</span>
              {" · "}
              <span className="text-[var(--gray-600)]">{latest.urlsSkipped} skipped</span>
              {" / "}
              <span className="text-[var(--gray-600)]">{latest.urlsTotal} total</span>
              {" · "}
              <span className="text-[var(--gray-600)]">{fmtDuration(latest.durationMs)}</span>
            </div>
          </div>
        )}

        <section className="mb-10">
          <h2 className="font-serif text-xl mb-4">Last 7 days</h2>
          {runs.length === 0 ? (
            <p className="text-sm text-[var(--gray-600)]">No runs yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--gray-50)]">
                  <tr>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Kind</th>
                    <th className="text-left p-3 font-medium">Started</th>
                    <th className="text-right p-3 font-medium">Applied</th>
                    <th className="text-right p-3 font-medium">Failed</th>
                    <th className="text-right p-3 font-medium">Skipped</th>
                    <th className="text-right p-3 font-medium">Duration</th>
                    <th className="text-left p-3 font-medium">BB</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-t border-[var(--card-border)]">
                      <td className="p-3"><StatusPill status={r.status} /></td>
                      <td className="p-3">{r.kind}</td>
                      <td className="p-3 text-[var(--gray-600)]">{fmtAgo(r.startedAt, nowMs)}</td>
                      <td className="p-3 text-right font-mono text-green-600">{r.urlsApplied}</td>
                      <td className="p-3 text-right font-mono text-red-600">{r.urlsFailed}</td>
                      <td className="p-3 text-right font-mono text-[var(--gray-600)]">{r.urlsSkipped}</td>
                      <td className="p-3 text-right font-mono text-[var(--gray-600)]">{fmtDuration(r.durationMs)}</td>
                      <td className="p-3">{r.useBrowserbase ? "Y" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {latest?.details && (
          <section>
            <h2 className="font-serif text-xl mb-4">Latest run — per-URL</h2>
            <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--gray-50)]">
                  <tr>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">ATS</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">URL</th>
                    <th className="text-right p-3 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    try {
                      const list = JSON.parse(latest.details) as UrlResult[];
                      return list.map((r, i) => (
                        <tr key={i} className="border-t border-[var(--card-border)] align-top">
                          <td className="p-3">
                            <span
                              className={`text-xs font-medium ${
                                r.actual === "apply"
                                  ? "text-green-600"
                                  : r.actual === "skip"
                                  ? "text-[var(--gray-600)]"
                                  : "text-red-600"
                              }`}
                            >
                              {r.actual}
                            </span>
                          </td>
                          <td className="p-3">{r.ats}</td>
                          <td className="p-3">{r.role}</td>
                          <td className="p-3">
                            <a href={r.url} target="_blank" rel="noreferrer" className="text-[#ef562a] hover:underline break-all">
                              {r.url}
                            </a>
                            {r.errorMessage && (
                              <p className="text-xs text-red-600 mt-1">{r.errorMessage}</p>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono text-[var(--gray-600)]">{fmtDuration(r.durationMs)}</td>
                        </tr>
                      ));
                    } catch {
                      return (
                        <tr>
                          <td colSpan={5} className="p-3 text-sm text-[var(--gray-600)]">
                            (details JSON unparseable)
                          </td>
                        </tr>
                      );
                    }
                  })()}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
