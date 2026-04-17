/**
 * One-time backfill: set User.freeTierEndsAt for every existing free-tier user
 * to the first day of the calendar month following their monthlyAppResetAt.
 *
 * This matches the existing "new month" detection in src/lib/subscription.ts
 * (which resets monthlyAppCount when now.getMonth() differs from resetAt.getMonth()).
 * After freeTierEndsAt, the user can no longer apply on the free tier and must
 * start the 7-day Stripe trial or subscribe directly.
 *
 * Skips:
 *   - admins, contributors, integration test users
 *   - users with currentPeriodEnd in the future (active sub even if tier looks like free)
 *
 * Pass --apply to write; otherwise dry-run.
 *
 * Local:
 *   npx tsx scripts/backfill-free-tier-ends-at.ts            (dry run on dev.db)
 *   npx tsx scripts/backfill-free-tier-ends-at.ts --apply    (writes to dev.db)
 *
 * Production (Turso):
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/backfill-free-tier-ends-at.ts [--apply]
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const apply = process.argv.includes("--apply");

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

function firstOfNextMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

function laterOf(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}

async function main() {
  const now = new Date();
  const users = await prisma.user.findMany({
    where: {
      subscriptionTier: "free",
      role: { notIn: ["admin", "contributor", "test"] },
      freeTierEndsAt: null,
    },
    select: {
      id: true,
      email: true,
      monthlyAppResetAt: true,
      currentPeriodEnd: true,
      subscriptionStatus: true,
      monthlyAppCount: true,
    },
  });

  console.log(`Scanning ${users.length} free-tier users...`);
  let toPatch = 0;
  let skippedActive = 0;
  const samples: string[] = [];

  for (const u of users) {
    if (u.currentPeriodEnd && u.currentPeriodEnd > now) {
      skippedActive++;
      continue;
    }

    // Wall is the first of next month from EITHER the user's reset date OR
    // today — whichever is later. This guarantees nobody gets locked out
    // immediately just because their resetAt was in a prior calendar month.
    const wallAt = laterOf(firstOfNextMonth(u.monthlyAppResetAt), firstOfNextMonth(now));
    toPatch++;

    if (samples.length < 10) {
      samples.push(
        `  ${u.email.padEnd(40)} resetAt=${u.monthlyAppResetAt.toISOString().slice(0, 10)} status=${u.subscriptionStatus.padEnd(8)} apps=${u.monthlyAppCount} -> wall=${wallAt.toISOString().slice(0, 10)}`
      );
    }

    if (apply) {
      await prisma.user.update({
        where: { id: u.id },
        data: { freeTierEndsAt: wallAt },
      });
    }
  }

  console.log(`\nSample (first 10):`);
  samples.forEach((s) => console.log(s));
  console.log(`\nSummary:`);
  console.log(`  free-tier users scanned: ${users.length}`);
  console.log(`  skipped (active sub):    ${skippedActive}`);
  console.log(`  patched:                 ${toPatch} ${apply ? "(written)" : "(dry-run)"}`);
  if (!apply) console.log(`\nRun with --apply to write.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
