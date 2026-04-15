import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { getExcludedUrlPatterns } from "@/lib/auto-apply/job-matcher";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function loadZeroSuccessCandidates() {
  // Companies with ≥5 attempts in the last 30 days and zero successful applies.
  // These are Browserbase-try candidates; if Browserbase doesn't lift them,
  // consider adding to EXCLUDED_URL_PATTERNS in src/lib/auto-apply/job-matcher.ts.
  const rows = await prisma.$queryRaw<
    { company: string; attempts: bigint; applied: bigint }[]
  >`
    SELECT
      company,
      COUNT(*) AS attempts,
      SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) AS applied
    FROM BrowseDiscovery
    WHERE createdAt > datetime('now', '-30 days')
    GROUP BY company
    HAVING attempts >= 5 AND applied = 0
    ORDER BY attempts DESC
    LIMIT 30
  `;

  return rows.map((r) => ({
    company: r.company,
    attempts: Number(r.attempts),
    applied: Number(r.applied),
  }));
}

export default async function ApplyExclusionsPage() {
  await requireAdmin();

  const patterns = getExcludedUrlPatterns();
  const candidates = await loadZeroSuccessCandidates();

  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/admin"
          className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)]"
        >
          ← Back to admin
        </Link>

        <h1 className="font-serif text-3xl md:text-4xl mt-4 mb-2">
          Apply URL exclusions
        </h1>
        <p className="text-sm text-[var(--gray-600)] mb-10 max-w-2xl">
          URL patterns below are stripped from the matcher before they ever
          reach the apply engine. Patterns are code-defined in{" "}
          <code className="text-xs bg-[var(--gray-100)] px-1 rounded">
            src/lib/auto-apply/job-matcher.ts
          </code>
          .
        </p>

        <section className="mb-12">
          <h2 className="font-serif text-xl mb-4">Active exclusions</h2>
          {patterns.length === 0 ? (
            <p className="text-sm text-[var(--gray-600)]">None configured.</p>
          ) : (
            <div className="space-y-3">
              {patterns.map((p, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]"
                >
                  <div className="font-mono text-xs text-[#ef562a] break-all">
                    /{p.pattern}/{p.flags}
                  </div>
                  <p className="text-sm text-[var(--gray-600)] mt-2">{p.reason}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-serif text-xl mb-2">
            Zero-success candidates (30 days, ≥5 attempts)
          </h2>
          <p className="text-sm text-[var(--gray-600)] mb-4 max-w-2xl">
            Companies where we&apos;ve spent quota with no successful application.
            Candidates for future exclusion if Browserbase + deterministic handlers
            don&apos;t lift them. Not yet excluded.
          </p>
          {candidates.length === 0 ? (
            <p className="text-sm text-[var(--gray-600)]">No candidates.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--gray-50)]">
                  <tr>
                    <th className="text-left p-3 font-medium">Company</th>
                    <th className="text-right p-3 font-medium">Attempts</th>
                    <th className="text-right p-3 font-medium">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr
                      key={c.company}
                      className="border-t border-[var(--card-border)]"
                    >
                      <td className="p-3">{c.company}</td>
                      <td className="p-3 text-right font-mono">{c.attempts}</td>
                      <td className="p-3 text-right font-mono text-red-600">
                        {c.applied}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
