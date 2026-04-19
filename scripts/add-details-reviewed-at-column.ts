/**
 * Idempotent: add User.detailsReviewedAt for the post-trial-checkout review
 * page. NULL = never reviewed; required-first-time gate. Set on save.
 */

import { createClient } from "@libsql/client";

async function main() {
  const db = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN });
  try {
    await db.execute(`ALTER TABLE User ADD COLUMN detailsReviewedAt TEXT`);
    console.log("Added column User.detailsReviewedAt");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/duplicate column/i.test(msg)) console.log("User.detailsReviewedAt already exists");
    else throw e;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
