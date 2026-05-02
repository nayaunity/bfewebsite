/**
 * One-time backfill: align User.monthlyAppCount and User.monthlyAppResetAt
 * with the user's subscription/signup anniversary period instead of the
 * calendar month.
 *
 * For each user:
 *   periodStart = anniversary of subscribedAt (or createdAt if free)
 *   recomputed   = SUM(BrowseSession.jobsApplied WHERE userId AND startedAt >= periodStart)
 *   UPDATE User SET monthlyAppCount = recomputed, monthlyAppResetAt = periodStart
 *
 * Idempotent — safe to re-run.
 *
 * Pass --apply to write; otherwise dry-run.
 *
 * Local:
 *   npx tsx scripts/backfill-monthly-app-count.ts            (dry run on dev.db)
 *   npx tsx scripts/backfill-monthly-app-count.ts --apply    (writes to dev.db)
 *
 * Production (Turso):
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/backfill-monthly-app-count.ts [--apply]
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

function getCurrentPeriodStart(user: {
  subscribedAt: Date | null;
  createdAt: Date;
}): Date {
  const anchor = user.subscribedAt ?? user.createdAt;
  const now = new Date();
  const anchorDay = anchor.getUTCDate();
  const h = anchor.getUTCHours();
  const m = anchor.getUTCMinutes();
  const s = anchor.getUTCSeconds();

  const buildAt = (year: number, month: number): Date => {
    let y = year;
    let mo = month;
    if (mo < 0) {
      mo += 12;
      y -= 1;
    }
    const daysInMonth = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    const day = Math.min(anchorDay, daysInMonth);
    return new Date(Date.UTC(y, mo, day, h, m, s, 0));
  };

  let candidate = buildAt(now.getUTCFullYear(), now.getUTCMonth());
  if (candidate > now) {
    candidate = buildAt(now.getUTCFullYear(), now.getUTCMonth() - 1);
  }
  return candidate;
}

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      subscribedAt: true,
      createdAt: true,
      monthlyAppCount: true,
      monthlyAppResetAt: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  });

  console.log(`Scanning ${users.length} users...`);

  let toPatch = 0;
  let unchanged = 0;
  const samples: string[] = [];
  const driftedSamples: string[] = [];

  for (const u of users) {
    const periodStart = getCurrentPeriodStart(u);

    // Use datetime() because the worker writes startedAt in
    // 'YYYY-MM-DD HH:MM:SS' format via raw SQL while Prisma writes ISO with a
    // 'T' separator, and direct lexical compare gets the wrong answer.
    const rows = await prisma.$queryRaw<{ s: number | bigint | null }[]>`
      SELECT COALESCE(SUM(jobsApplied), 0) AS s
      FROM BrowseSession
      WHERE userId = ${u.id}
        AND startedAt IS NOT NULL
        AND datetime(startedAt) >= datetime(${periodStart.toISOString()})
    `;
    const recomputed = Number(rows[0]?.s ?? 0);

    const drifted =
      u.monthlyAppCount !== recomputed ||
      u.monthlyAppResetAt.getTime() !== periodStart.getTime();

    if (!drifted) {
      unchanged++;
      continue;
    }

    toPatch++;

    const line = `  ${u.email.padEnd(42)} tier=${(u.subscriptionTier ?? "").padEnd(7)} ${u.monthlyAppCount} -> ${recomputed}  resetAt=${u.monthlyAppResetAt.toISOString().slice(0, 10)} -> ${periodStart.toISOString().slice(0, 10)}`;
    if (samples.length < 10) samples.push(line);
    if (
      driftedSamples.length < 10 &&
      Math.abs(u.monthlyAppCount - recomputed) > 0
    ) {
      driftedSamples.push(line);
    }

    if (apply) {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          monthlyAppCount: recomputed,
          monthlyAppResetAt: periodStart,
        },
      });
    }
  }

  console.log(`\nFirst 10 changes:`);
  samples.forEach((s) => console.log(s));
  if (driftedSamples.length > 0) {
    console.log(`\nFirst 10 with counter drift (count diff > 0):`);
    driftedSamples.forEach((s) => console.log(s));
  }
  console.log(`\nSummary:`);
  console.log(`  users scanned: ${users.length}`);
  console.log(`  unchanged:     ${unchanged}`);
  console.log(`  patched:       ${toPatch} ${apply ? "(written)" : "(dry-run)"}`);
  if (!apply) console.log(`\nRun with --apply to write.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
