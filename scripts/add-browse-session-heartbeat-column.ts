/**
 * One-shot Turso DDL: add BrowseSession.lastHeartbeatAt + composite index
 * for the heartbeat-based session watchdog.
 *
 * Idempotent — both ALTER and CREATE INDEX use IF NOT EXISTS-style guards
 * (libsql ALTER TABLE ADD COLUMN errors if column exists; we catch it).
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/add-browse-session-heartbeat-column.ts
 */

import { createClient } from "@libsql/client";

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  // ADD COLUMN — guard against re-run by catching the duplicate-column error.
  try {
    await db.execute(`ALTER TABLE BrowseSession ADD COLUMN lastHeartbeatAt TEXT`);
    console.log("✓ Added column BrowseSession.lastHeartbeatAt");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/duplicate column/i.test(msg)) {
      console.log("· Column BrowseSession.lastHeartbeatAt already exists — skipping");
    } else {
      throw e;
    }
  }

  // Composite index for the watchdog query (status='processing' AND lastHeartbeatAt < threshold).
  await db.execute(
    `CREATE INDEX IF NOT EXISTS BrowseSession_status_lastHeartbeatAt_idx ON BrowseSession(status, lastHeartbeatAt)`
  );
  console.log("✓ Ensured index BrowseSession_status_lastHeartbeatAt_idx");

  // Verify shape
  const cols = await db.execute(`PRAGMA table_info(BrowseSession)`);
  const heartbeat = cols.rows.find((r) => (r as unknown as { name: string }).name === "lastHeartbeatAt");
  console.log(`Final state: lastHeartbeatAt column ${heartbeat ? "present" : "MISSING"}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
