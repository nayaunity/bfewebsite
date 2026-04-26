/**
 * One-shot reclassifier: jobs whose title looks like an internship but whose
 * `type` is not "Internship" get flipped to type='Internship'.
 *
 * Catches the ~162 jobs in the auto-apply catalog that ATS metadata didn't
 * label as internships even though the title clearly is one. Strict regex
 * avoids false positives like "Internal Tools Engineer", "International
 * Recruiter", or "Intern Program Manager" (a full-time role that manages
 * interns).
 *
 * Dry-run by default. Pass --apply to write.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/reclassify-internship-titles.ts [--apply]
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Keep these in sync with looksLikeInternshipTitle in src/lib/scrapers/job-filter.ts
const INTERN_TITLE_RX =
  /\b(intern|internship|co-?op|summer\s+(analyst|associate|engineer|intern))\b/i;
const INTERN_HARD_NEGATIVE_RX =
  /\bintern\s+program\s+manager\b|\bintern\s+coordinator\b|\bmanages?\s+interns?\b/i;
const INTERN_SOFT_NEGATIVE_RX = /\binternal\b|\binternational\b/i;
const INTERN_STANDALONE_RX = /\b(intern|internship|co-?op)\b/i;

function looksLikeInternship(title: string): boolean {
  if (!INTERN_TITLE_RX.test(title)) return false;
  if (INTERN_HARD_NEGATIVE_RX.test(title)) return false;
  if (INTERN_SOFT_NEGATIVE_RX.test(title)) {
    const stripped = title.replace(/\binternal\b|\binternational\b/gi, " ");
    return INTERN_STANDALONE_RX.test(stripped);
  }
  return true;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const adapter = new PrismaLibSQL({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
    intMode: "number",
  });
  const prisma = new PrismaClient({ adapter });

  console.log(
    `\n=== reclassify-internship-titles (${apply ? "APPLY" : "DRY-RUN"}) ===\n`
  );

  // Pull all active jobs whose title contains "intern" (case-insensitive).
  // Using SQL LIKE so we don't have to fetch the entire catalog.
  const candidates = await prisma.$queryRawUnsafe<
    Array<{ id: string; title: string; type: string; company: string; source: string }>
  >(
    `SELECT id, title, type, company, source FROM Job WHERE isActive = 1 AND lower(title) LIKE '%intern%' OR lower(title) LIKE '%co-op%' OR lower(title) LIKE '%coop%'`
  );

  let willFlip = 0;
  let alreadyTagged = 0;
  let rejectedNegative = 0;
  let rejectedNoMatch = 0;
  const flips: Array<{ id: string; title: string; from: string; company: string; source: string }> = [];

  for (const job of candidates) {
    if (job.type === "Internship") {
      alreadyTagged++;
      continue;
    }
    if (!INTERN_TITLE_RX.test(job.title)) {
      rejectedNoMatch++;
      continue;
    }
    if (!looksLikeInternship(job.title)) {
      rejectedNegative++;
      continue;
    }
    willFlip++;
    flips.push({ id: job.id, title: job.title, from: job.type, company: job.company, source: job.source });
  }

  console.log(`Candidates with intern/co-op in title: ${candidates.length}`);
  console.log(`  Already type=Internship:           ${alreadyTagged}`);
  console.log(`  Rejected (negative regex match):   ${rejectedNegative}`);
  console.log(`  Rejected (intern not whole word):  ${rejectedNoMatch}`);
  console.log(`  Will flip to type=Internship:      ${willFlip}\n`);

  // Show every flip so the operator can eyeball
  for (const f of flips) {
    console.log(`  [${f.source.padEnd(11)}] ${f.from.padEnd(10)} -> Internship :: ${f.company} :: ${f.title}`);
  }

  // Show rejected-by-negative for sanity (these are the false-positive guard cases)
  if (rejectedNegative > 0) {
    console.log("\nKept as-is (negative regex matched, would have been false positives):");
    for (const job of candidates) {
      if (job.type !== "Internship" && INTERN_TITLE_RX.test(job.title) && !looksLikeInternship(job.title)) {
        console.log(`  - ${job.company} :: ${job.title}`);
      }
    }
  }

  if (!apply) {
    console.log("\n(dry-run; pass --apply to write)\n");
    await prisma.$disconnect();
    return;
  }

  console.log("\nWriting...");
  let updated = 0;
  for (const f of flips) {
    await prisma.job.update({ where: { id: f.id }, data: { type: "Internship" } });
    updated++;
  }
  console.log(`✓ Updated ${updated} jobs to type=Internship`);

  // Verify
  const after = await prisma.$queryRawUnsafe<Array<{ c: number }>>(
    `SELECT COUNT(*) as c FROM Job WHERE isActive = 1 AND type = 'Internship'`
  );
  console.log(`Total active type=Internship rows after run: ${after[0]?.c ?? 0}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
