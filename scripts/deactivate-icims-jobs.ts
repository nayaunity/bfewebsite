/**
 * Deactivate iCIMS-backed jobs from the catalog.
 *
 * Background: the worker has no deterministic iCIMS handler. Jobs whose apply
 * flow routes through *.icims.com hit the login wall and fail with
 * "Login/authentication required on ATS". Until we ship an iCIMS handler
 * (mirror of worker/src/workday/), these rows just generate red noise in
 * /admin/auto-apply and waste worker time. Set isActive=false so the matcher
 * stops serving them. Reversible — flip back when the handler ships.
 *
 * Two filters:
 *   1. applyUrl contains "icims.com" (direct iCIMS URLs)
 *   2. applyUrl host is in ICIMS_BACKED_HOSTS (careers portals that redirect
 *      to iCIMS — discovered from BrowseDiscovery error traces)
 *
 * Dry run by default. Pass --apply to write.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/deactivate-icims-jobs.ts [--apply]
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number",
});

const prisma = new PrismaClient({ adapter });

const ICIMS_BACKED_HOSTS = new Set<string>([
  "careers.arm.com",
  "careers.docusign.com",
]);

function isIcimsBacked(applyUrl: string): boolean {
  if (/icims\.com/i.test(applyUrl)) return true;
  try {
    const host = new URL(applyUrl).host.toLowerCase();
    return ICIMS_BACKED_HOSTS.has(host);
  } catch {
    return false;
  }
}

async function main() {
  const apply = process.argv.includes("--apply");

  const active = await prisma.job.findMany({
    where: { isActive: true },
    select: {
      id: true,
      company: true,
      title: true,
      applyUrl: true,
      source: true,
      type: true,
    },
  });

  const targets = active.filter((j) => isIcimsBacked(j.applyUrl));

  console.log(`Active jobs scanned:        ${active.length}`);
  console.log(`iCIMS-backed (will deactivate): ${targets.length}\n`);

  if (targets.length > 0) {
    console.log("Sample (up to 25):");
    for (const j of targets.slice(0, 25)) {
      console.log(`  ${j.company.padEnd(28)}  ${j.title.padEnd(40)}  ${j.applyUrl}`);
    }
    if (targets.length > 25) console.log(`  ...and ${targets.length - 25} more`);
  }

  if (!apply) {
    console.log(`\nDry run — pass --apply to set isActive=false.`);
    return;
  }

  if (targets.length === 0) {
    console.log("Nothing to deactivate.");
    return;
  }

  const ids = targets.map((j) => j.id);
  const { count } = await prisma.job.updateMany({
    where: { id: { in: ids } },
    data: { isActive: false },
  });
  console.log(`\nDeactivated ${count} jobs.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
