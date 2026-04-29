import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FAILURE_LABELS: Record<string, string> = {
  "could-not-open-dropdown": "Dropdown wouldn't open",
  "stuck-page": "Page state unchanged",
  "max-steps": "Hit max steps",
  "spam-flag": "Anti-bot flag",
  timeout: "Timeout",
  other: "Other",
};

function FailurePill({ type }: { type: string }) {
  const color =
    type === "spam-flag"
      ? "bg-red-100 text-red-800 border-red-300"
      : type === "could-not-open-dropdown"
      ? "bg-orange-100 text-orange-800 border-orange-300"
      : type === "max-steps"
      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
      : type === "timeout"
      ? "bg-purple-100 text-purple-800 border-purple-300"
      : "bg-gray-100 text-gray-800 border-gray-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {FAILURE_LABELS[type] || type}
    </span>
  );
}

async function loadStuckData() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const rows = await prisma.stuckField.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  // Aggregate by (company, failureType)
  const buckets = new Map<string, { company: string; failureType: string; count: number; samplePageUrl: string; lastSeen: Date }>();
  for (const r of rows) {
    const key = `${r.company}|${r.failureType}`;
    const ex = buckets.get(key);
    if (ex) {
      ex.count += 1;
      if (r.createdAt > ex.lastSeen) ex.lastSeen = r.createdAt;
    } else {
      buckets.set(key, {
        company: r.company,
        failureType: r.failureType,
        count: 1,
        samplePageUrl: r.pageUrl,
        lastSeen: r.createdAt,
      });
    }
  }
  const top = [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, 30);

  return { top, totalRows: rows.length };
}

export default async function StuckFieldsPage() {
  await requireAdmin();
  const { top, totalRows } = await loadStuckData();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-[var(--foreground)]">
              Stuck <span className="italic text-[#ef562a]">fields</span>
            </h1>
            <p className="text-[var(--gray-600)] mt-1 text-sm">
              Top failure clusters across applications in the last 7 days
              {totalRows > 0 && <> · {totalRows.toLocaleString()} raw events</>}
            </p>
          </div>
          <Link href="/admin" className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)]">
            ← Back to admin
          </Link>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--gray-50)] text-[var(--gray-600)]">
              <tr>
                <th className="text-right px-4 py-2 font-medium w-20">Count</th>
                <th className="text-left px-4 py-2 font-medium">Company</th>
                <th className="text-left px-4 py-2 font-medium">Failure</th>
                <th className="text-left px-4 py-2 font-medium">Last seen (UTC)</th>
                <th className="text-left px-4 py-2 font-medium">Sample URL</th>
              </tr>
            </thead>
            <tbody>
              {top.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-[var(--gray-600)]">
                    No stuck-field events recorded in the last 7 days.
                  </td>
                </tr>
              )}
              {top.map((row, i) => (
                <tr key={i} className="border-t border-[var(--card-border)]">
                  <td className="px-4 py-2 text-right font-semibold">{row.count}</td>
                  <td className="px-4 py-2">{row.company}</td>
                  <td className="px-4 py-2"><FailurePill type={row.failureType} /></td>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(row.lastSeen).toISOString().replace("T", " ").slice(0, 16)}</td>
                  <td className="px-4 py-2">
                    <a href={row.samplePageUrl} target="_blank" rel="noreferrer" className="text-[#ef562a] hover:underline truncate inline-block max-w-xs">
                      {row.samplePageUrl.slice(0, 60)}{row.samplePageUrl.length > 60 ? "…" : ""}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-[var(--gray-600)]">
          Counts include all users. Use this to prioritize next form-fix work — focus on the highest-count rows first.
        </p>
      </div>
    </div>
  );
}
