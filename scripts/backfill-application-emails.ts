/**
 * One-time backfill: provision User.applicationEmail for every user that
 * doesn't have one. Without it, the auto-apply worker falls back to the
 * user's real email when filling forms — and any ATS verification email
 * goes to that real inbox instead of our SendGrid Inbound Parse webhook,
 * silently breaking the verification-code flow for that user.
 *
 * `ensureApplicationEmail()` (src/lib/application-email.ts) provisions
 * lazily, but only on a handful of API routes. Sessions queued by other
 * paths (direct DB inserts, scripts, legacy flows) skip provisioning and
 * leave the column NULL forever.
 *
 * Format: u-{first 8 chars of userId}@apply.theblackfemaleengineer.com
 * Falls back to 12-char prefix on uniqueness collision.
 *
 * Pass --apply to write; otherwise dry-run.
 *
 * Local:
 *   npx tsx scripts/backfill-application-emails.ts            (dry run on dev.db)
 *   npx tsx scripts/backfill-application-emails.ts --apply    (writes to dev.db)
 *
 * Production (Turso):
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/backfill-application-emails.ts [--apply]
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const apply = process.argv.includes("--apply");
const APPLICATION_EMAIL_DOMAIN = "apply.theblackfemaleengineer.com";

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (url && (url.startsWith("libsql://") || url.startsWith("https://"))) {
    const adapter = new PrismaLibSQL({
      url: url.trim().replace(/\/+$/, ""),
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
      intMode: "number",
    });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

const prisma = createPrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { applicationEmail: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Scanning ${users.length} users without applicationEmail...`);

  // Pre-compute proposed emails so we can detect intra-batch collisions
  // (e.g., if two userIds happen to start with the same 8 chars).
  const proposed: Array<{ userId: string; email: string; user: typeof users[number] }> = [];
  const seen = new Set<string>();
  let collisions = 0;

  for (const u of users) {
    let email = `u-${u.id.slice(0, 8)}@${APPLICATION_EMAIL_DOMAIN}`;
    if (seen.has(email)) {
      collisions++;
      // Use longer prefix; if THAT also collides, full UUID will work
      email = `u-${u.id.slice(0, 12)}@${APPLICATION_EMAIL_DOMAIN}`;
      if (seen.has(email)) {
        email = `u-${u.id}@${APPLICATION_EMAIL_DOMAIN}`;
      }
    }
    seen.add(email);
    proposed.push({ userId: u.id, email, user: u });
  }

  // Also check against existing applicationEmails in the DB to avoid a
  // unique-constraint surprise at write time.
  const existingEmails = new Set(
    (await prisma.user.findMany({
      where: { applicationEmail: { not: null } },
      select: { applicationEmail: true },
    })).map((u) => u.applicationEmail!)
  );

  let dbCollisions = 0;
  for (const p of proposed) {
    if (existingEmails.has(p.email)) {
      dbCollisions++;
      p.email = `u-${p.userId.slice(0, 12)}@${APPLICATION_EMAIL_DOMAIN}`;
      if (existingEmails.has(p.email)) {
        p.email = `u-${p.userId}@${APPLICATION_EMAIL_DOMAIN}`;
      }
    }
  }

  console.log(`Will provision: ${proposed.length}`);
  console.log(`Intra-batch collisions handled: ${collisions}`);
  console.log(`DB collisions handled: ${dbCollisions}`);
  console.log(`\nSample (first 10):`);
  for (const p of proposed.slice(0, 10)) {
    const name = [p.user.firstName, p.user.lastName].filter(Boolean).join(" ") || "(no name)";
    console.log(`  ${p.user.email.padEnd(40)}  →  ${p.email}   [${p.user.role}/${p.user.subscriptionTier}/${p.user.subscriptionStatus}]  ${name}`);
  }
  if (proposed.length > 10) console.log(`  ... and ${proposed.length - 10} more`);

  if (!apply) {
    console.log(`\nDRY RUN — no writes. Re-run with --apply to commit.`);
    return;
  }

  console.log(`\nApplying ${proposed.length} updates...`);
  let written = 0;
  let failed = 0;
  for (const p of proposed) {
    try {
      await prisma.user.update({
        where: { id: p.userId },
        data: { applicationEmail: p.email },
      });
      written++;
    } catch (e) {
      failed++;
      console.error(`  FAIL ${p.userId}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.log(`\nDone. Written: ${written}, Failed: ${failed}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
