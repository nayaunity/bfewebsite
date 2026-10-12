/**
 * One-shot Turso DDL: create the AbandonedCheckout table, written by the
 * Stripe webhook on checkout.session.expired for the AI Video Editor offers
 * ($97 plugin, $147 workshop, $99/mo Disgustingly Paid).
 *
 * Idempotent: CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
 * Mirrors prisma/migrations/20261011_abandoned_checkout/migration.sql.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/add-abandoned-checkout-table.ts
 */

import { createClient } from "@libsql/client";

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS "AbandonedCheckout" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "product" TEXT NOT NULL,
      "source" TEXT,
      "mode" TEXT NOT NULL,
      "amountCents" INTEGER,
      "email" TEXT,
      "name" TEXT,
      "promoConsent" TEXT,
      "recoveryUrl" TEXT,
      "recoveryExpiresAt" DATETIME,
      "startedAt" DATETIME NOT NULL,
      "expiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "recoveredAt" DATETIME,
      "recoveredBy" TEXT
    )
  `);
  console.log("✓ Ensured table AbandonedCheckout");

  await db.execute(
    `CREATE INDEX IF NOT EXISTS "AbandonedCheckout_product_idx" ON "AbandonedCheckout"("product")`
  );
  await db.execute(
    `CREATE INDEX IF NOT EXISTS "AbandonedCheckout_expiredAt_idx" ON "AbandonedCheckout"("expiredAt")`
  );
  console.log("✓ Ensured indexes");

  const cols = await db.execute(`PRAGMA table_info(AbandonedCheckout)`);
  console.log("\nFinal shape (PRAGMA table_info):");
  for (const r of cols.rows) {
    const row = r as unknown as { name: string; type: string; notnull: number };
    console.log(`  ${row.name.padEnd(20)} ${row.type.padEnd(10)} ${row.notnull ? "NOT NULL" : ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
