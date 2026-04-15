/**
 * Canary check — reads the most recent IntegrationRun row and fails the
 * process (exit 2) if the pass rate is below the threshold. Intended to
 * be run after a deploy as a gate for auto-rollback.
 *
 * Env:
 *   DATABASE_URL, DATABASE_AUTH_TOKEN — Turso prod
 *   CANARY_MIN_PASS_RATE               — default 0.6 (60%)
 *   CANARY_KIND                        — default "canary"
 *
 * Usage:
 *   DATABASE_URL=... DATABASE_AUTH_TOKEN=... npx tsx scripts/canary.ts
 */

import { createClient } from "@libsql/client";

const MIN_PASS_RATE = parseFloat(process.env.CANARY_MIN_PASS_RATE || "0.6");
const KIND = process.env.CANARY_KIND || "canary";

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const r = await db.execute({
    sql: "SELECT id, status, urlsTotal, urlsApplied, urlsFailed, urlsSkipped, completedAt FROM IntegrationRun WHERE kind = ? AND completedAt IS NOT NULL ORDER BY startedAt DESC LIMIT 1",
    args: [KIND],
  });
  if (r.rows.length === 0) {
    console.error(`No completed IntegrationRun rows for kind='${KIND}'. Failing open.`);
    process.exit(2);
  }
  const row = r.rows[0] as unknown as {
    id: string;
    status: string;
    urlsTotal: number;
    urlsApplied: number;
    urlsFailed: number;
    urlsSkipped: number;
    completedAt: string;
  };

  // Pass rate = applied / (applied + failed). Skipped are excluded (cooldown is not a code failure).
  const denominator = Number(row.urlsApplied) + Number(row.urlsFailed);
  const passRate = denominator > 0 ? Number(row.urlsApplied) / denominator : 0;

  console.log(`canary: run=${row.id} completed=${row.completedAt}`);
  console.log(`  applied=${row.urlsApplied} failed=${row.urlsFailed} skipped=${row.urlsSkipped} total=${row.urlsTotal}`);
  console.log(`  passRate=${(passRate * 100).toFixed(1)}% (min=${(MIN_PASS_RATE * 100).toFixed(1)}%)`);

  if (passRate < MIN_PASS_RATE) {
    console.error(`canary: FAILED — pass rate ${(passRate * 100).toFixed(1)}% below threshold`);
    process.exit(2);
  }
  console.log("canary: PASSED");
}

main().catch((e) => {
  console.error("canary: crashed:", e);
  process.exit(1);
});
