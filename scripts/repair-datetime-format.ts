/**
 * Repair User datetime columns that were written in SQLite's "YYYY-MM-DD HH:MM:SS"
 * format (from CURRENT_TIMESTAMP in raw SQL INSERT/UPDATE). Prisma's libsql
 * adapter rejects these and throws `Inconsistent column data: Could not
 * convert value "..." of the field <col> to type DateTime`, blocking any
 * page that selects that column.
 *
 * Converts the SQLite format → ISO 8601 (`YYYY-MM-DDTHH:MM:SS.000Z`). UTC
 * is implicit in SQLite's format.
 *
 * Columns covered (schema.prisma User datetime fields): emailVerified,
 * onboardingCompletedAt, createdAt, resumeUpdatedAt, currentPeriodEnd,
 * monthlyAppResetAt.
 *
 * Run:
 *   DATABASE_URL=... DATABASE_AUTH_TOKEN=... npx tsx scripts/repair-datetime-format.ts
 */

import { createClient } from "@libsql/client";

const DATETIME_COLUMNS = [
  "emailVerified",
  "onboardingCompletedAt",
  "createdAt",
  "resumeUpdatedAt",
  "currentPeriodEnd",
  "monthlyAppResetAt",
];

function toIso(val: string | null): string | null {
  if (!val) return null;
  if (val.includes("T")) return val; // already ISO
  const m = val.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})$/);
  if (m) return `${m[1]}T${m[2]}.000Z`;
  return val; // unknown format — leave alone, don't corrupt
}

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const rows = await db.execute({
    sql: `SELECT id, email, ${DATETIME_COLUMNS.join(", ")} FROM User`,
    args: [],
  });

  let patched = 0;
  for (const r of rows.rows) {
    const updates: { col: string; val: string }[] = [];
    for (const col of DATETIME_COLUMNS) {
      const v = (r as Record<string, unknown>)[col];
      if (typeof v === "string" && !v.includes("T")) {
        const fixed = toIso(v);
        if (fixed && fixed !== v) updates.push({ col, val: fixed });
      }
    }
    if (updates.length === 0) continue;
    const setClauses = updates.map((u) => `${u.col} = ?`).join(", ");
    const args = [...updates.map((u) => u.val), r.id];
    await db.execute({ sql: `UPDATE User SET ${setClauses} WHERE id = ?`, args });
    patched++;
    console.log(`  Patched ${String(r.email)} — ${updates.map((u) => u.col).join(", ")}`);
  }

  console.log("---");
  console.log(`Total patched: ${patched}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
