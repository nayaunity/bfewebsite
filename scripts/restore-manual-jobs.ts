/**
 * Restore wrongly-deactivated manual jobs.
 *
 * Background: until the 2026-04-13 scraper fix, `scrapeAllCompanies` ran a
 * blanket "deactivate any job whose updatedAt > 24h" cleanup that did not
 * exclude `source: "manual"`. Admin-added jobs were silently deactivated the
 * day after they were added, leaving 856 of 859 manual jobs inactive.
 *
 * This script re-activates inactive manual jobs whose postedAt is within the
 * last 60 days (likely still relevant). Older rows are listed but skipped.
 *
 * Usage (DRY RUN by default):
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/restore-manual-jobs.ts
 *
 * Add --apply to actually write.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number",
});

const prisma = new PrismaClient({ adapter });

const RECENT_DAYS = 60;

async function main() {
  const apply = process.argv.includes("--apply");
  const recentCutoff = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);

  const allInactive = await prisma.job.findMany({
    where: { source: "manual", isActive: false },
    select: {
      id: true, company: true, title: true, applyUrl: true,
      postedAt: true, scrapedAt: true, updatedAt: true,
    },
    orderBy: { postedAt: "desc" },
  });

  const restore = allInactive.filter(
    (j) => j.postedAt && j.postedAt >= recentCutoff
  );
  const tooOld = allInactive.filter(
    (j) => !j.postedAt || j.postedAt < recentCutoff
  );

  console.log(`Inactive manual jobs total:  ${allInactive.length}`);
  console.log(`  Within last ${RECENT_DAYS}d:       ${restore.length} (will restore)`);
  console.log(`  Older / missing postedAt:  ${tooOld.length} (skipped)\n`);

  if (restore.length > 0) {
    console.log(`Sample of jobs to restore (up to 10):`);
    for (const j of restore.slice(0, 10)) {
      const postedStr = j.postedAt ? j.postedAt.toISOString().slice(0, 10) : "—";
      console.log(`  ${postedStr}  ${j.company.padEnd(20)}  ${j.title}`);
    }
    if (restore.length > 10) console.log(`  …and ${restore.length - 10} more`);
  }

  if (!apply) {
    console.log(`\nDry run — pass --apply to actually reactivate.`);
    return;
  }

  const ids = restore.map((j) => j.id);
  if (ids.length === 0) {
    console.log("Nothing to restore.");
    return;
  }

  const { count } = await prisma.job.updateMany({
    where: { id: { in: ids } },
    data: { isActive: true },
  });
  console.log(`\nReactivated ${count} jobs.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
