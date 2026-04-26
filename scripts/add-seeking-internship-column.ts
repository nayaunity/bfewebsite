/**
 * One-shot Turso DDL: add seekingInternship + preferenceBannerDismissedAt
 * to User, and seekingInternship to BrowseSession, for the internship-only
 * matching preference.
 *
 * Idempotent — ALTER TABLE ADD COLUMN errors if the column exists; we catch it.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/add-seeking-internship-column.ts
 */

import { createClient } from "@libsql/client";

async function addColumn(
  db: ReturnType<typeof createClient>,
  table: string,
  column: string,
  ddl: string
) {
  try {
    await db.execute(ddl);
    console.log(`✓ Added column ${table}.${column}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/duplicate column/i.test(msg)) {
      console.log(`· Column ${table}.${column} already exists — skipping`);
    } else {
      throw e;
    }
  }
}

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  await addColumn(
    db,
    "User",
    "seekingInternship",
    `ALTER TABLE User ADD COLUMN seekingInternship INTEGER DEFAULT 0`
  );
  await addColumn(
    db,
    "User",
    "preferenceBannerDismissedAt",
    `ALTER TABLE User ADD COLUMN preferenceBannerDismissedAt TEXT`
  );
  await addColumn(
    db,
    "BrowseSession",
    "seekingInternship",
    `ALTER TABLE BrowseSession ADD COLUMN seekingInternship INTEGER DEFAULT 0`
  );
  await addColumn(
    db,
    "TempOnboarding",
    "confirmedSeekingInternship",
    `ALTER TABLE TempOnboarding ADD COLUMN confirmedSeekingInternship INTEGER`
  );

  const userCols = await db.execute(`PRAGMA table_info(User)`);
  const sessionCols = await db.execute(`PRAGMA table_info(BrowseSession)`);
  const tempCols = await db.execute(`PRAGMA table_info(TempOnboarding)`);

  const findCol = (rows: typeof userCols.rows, name: string) =>
    rows.find((r) => (r as unknown as { name: string }).name === name);

  console.log("");
  console.log("Final state:");
  console.log(
    `  User.seekingInternship: ${findCol(userCols.rows, "seekingInternship") ? "present" : "MISSING"}`
  );
  console.log(
    `  User.preferenceBannerDismissedAt: ${findCol(userCols.rows, "preferenceBannerDismissedAt") ? "present" : "MISSING"}`
  );
  console.log(
    `  BrowseSession.seekingInternship: ${findCol(sessionCols.rows, "seekingInternship") ? "present" : "MISSING"}`
  );
  console.log(
    `  TempOnboarding.confirmedSeekingInternship: ${findCol(tempCols.rows, "confirmedSeekingInternship") ? "present" : "MISSING"}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
