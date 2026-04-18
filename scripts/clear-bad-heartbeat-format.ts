/**
 * Hot-fix: NULL out BrowseSession.lastHeartbeatAt rows that were written in
 * SQLite default format ("YYYY-MM-DD HH:MM:SS") instead of ISO 8601, which
 * Prisma 6's libsql adapter rejects with P2023 when materializing rows in
 * findMany() — breaking /admin/auto-apply.
 *
 * After this runs, the watchdog falls back to its legacy `startedAt > 30 min`
 * branch for those sessions until the worker's next claim writes a fresh
 * ISO heartbeat (worker patch ships separately).
 *
 * Idempotent.
 */

import { createClient } from "@libsql/client";

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  // Match SQLite default format: "YYYY-MM-DD HH:MM:SS" (space separator,
  // no T, no Z, no fractional seconds). ISO format has 'T' at position 10.
  const result = await db.execute(
    `UPDATE BrowseSession
     SET lastHeartbeatAt = NULL
     WHERE lastHeartbeatAt IS NOT NULL
       AND substr(lastHeartbeatAt, 11, 1) = ' '`
  );
  console.log(`Cleared ${result.rowsAffected} rows with non-ISO lastHeartbeatAt`);
}

main().catch((e) => { console.error(e); process.exit(1); });
