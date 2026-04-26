/**
 * One-shot Turso DDL: create the WorkdayCredential table for the Workday
 * auto-apply handler. Stores per-(user, tenantHost) account credentials
 * that the worker auto-creates the first time it applies to a tenant.
 *
 * Idempotent — uses CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/add-workday-credential-table.ts
 */

import { createClient } from "@libsql/client";

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS WorkdayCredential (
      id                TEXT PRIMARY KEY,
      userId            TEXT NOT NULL,
      tenantHost        TEXT NOT NULL,
      email             TEXT NOT NULL,
      passwordEncrypted TEXT NOT NULL,
      createdAt         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      lastUsedAt        DATETIME,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    )
  `);
  console.log("✓ Ensured table WorkdayCredential");

  await db.execute(
    `CREATE UNIQUE INDEX IF NOT EXISTS WorkdayCredential_userId_tenantHost_key ON WorkdayCredential(userId, tenantHost)`
  );
  console.log("✓ Ensured unique index WorkdayCredential_userId_tenantHost_key");

  await db.execute(
    `CREATE INDEX IF NOT EXISTS WorkdayCredential_userId_idx ON WorkdayCredential(userId)`
  );
  console.log("✓ Ensured index WorkdayCredential_userId_idx");

  // Verify shape
  const cols = await db.execute(`PRAGMA table_info(WorkdayCredential)`);
  console.log("");
  console.log("Final shape (PRAGMA table_info):");
  for (const r of cols.rows) {
    const row = r as unknown as { name: string; type: string; notnull: number };
    console.log(`  ${row.name.padEnd(20)} ${row.type.padEnd(10)} ${row.notnull ? "NOT NULL" : ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
