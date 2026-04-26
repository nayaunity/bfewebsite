/**
 * Backfill `User.seekingInternship` for the existing cohort.
 *
 * Rule (must satisfy ALL):
 *   - graduationYear parses to integer in [currentYear, currentYear + 2]
 *   - currentTitle (if set) does NOT match senior/staff/principal/manager/lead/director
 *   - YoE rule:
 *       - gradYear > currentYear (still in school): always pass — they're a
 *         student regardless of how many internships/side gigs they've logged
 *       - gradYear == currentYear (graduating this year): require yoe < 2 so
 *         we don't auto-flip someone who's about to start a full-time role
 *
 * Paying users go through the same gate; almost certainly none of them match
 * (most have YOE >= 2 or no graduationYear), but we don't special-case them.
 *
 * Dry-run by default. Pass --apply to write.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/backfill-seeking-internship.ts [--apply]
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const SENIOR_TITLE_RX = /\b(senior|sr\.?|staff|principal|manager|lead|director|head|vp|vice\s+president|chief)\b/i;

async function main() {
  const apply = process.argv.includes("--apply");
  const currentYear = new Date().getFullYear();

  const adapter = new PrismaLibSQL({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
    intMode: "number",
  });
  const prisma = new PrismaClient({ adapter });

  console.log(
    `\n=== backfill-seeking-internship (${apply ? "APPLY" : "DRY-RUN"}) ===\n` +
      `Current year: ${currentYear}\n` +
      `Eligible if graduationYear in [${currentYear}, ${currentYear + 2}] AND yoe < 2 AND title not senior\n`
  );

  // Pull every user. The candidate pool is small (~500), no need for streaming.
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      graduationYear: true,
      yearsOfExperience: true,
      currentTitle: true,
      seekingInternship: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  });

  console.log(`Total users scanned: ${users.length}\n`);

  const flips: Array<{
    id: string;
    email: string;
    gradYear: number;
    yoe: number | null;
    title: string | null;
    tier: string;
    reason: string;
  }> = [];

  let alreadySet = 0;
  let skippedNoGradYear = 0;
  let skippedGradOutOfRange = 0;
  let skippedYoeTooHigh = 0;
  let skippedSeniorTitle = 0;
  let skippedAdminOrTest = 0;

  for (const u of users) {
    if (u.role === "admin" || u.role === "test" || u.role === "operations") {
      skippedAdminOrTest++;
      continue;
    }
    if (u.seekingInternship === true) {
      alreadySet++;
      continue;
    }

    const gradYear = u.graduationYear ? parseInt(u.graduationYear, 10) : NaN;
    if (!Number.isFinite(gradYear) || gradYear <= 0) {
      skippedNoGradYear++;
      continue;
    }
    if (gradYear < currentYear || gradYear > currentYear + 2) {
      skippedGradOutOfRange++;
      continue;
    }

    const yoeNum = u.yearsOfExperience ? parseFloat(u.yearsOfExperience) : NaN;
    // Future graduation = still in school = student regardless of YoE.
    // Current-year graduation = require yoe < 2 (might be a new-grad signing
    // for a full-time role).
    if (gradYear === currentYear && Number.isFinite(yoeNum) && yoeNum >= 2) {
      skippedYoeTooHigh++;
      continue;
    }

    if (u.currentTitle && SENIOR_TITLE_RX.test(u.currentTitle)) {
      skippedSeniorTitle++;
      continue;
    }

    flips.push({
      id: u.id,
      email: u.email,
      gradYear,
      yoe: Number.isFinite(yoeNum) ? yoeNum : null,
      title: u.currentTitle,
      tier: u.subscriptionTier,
      reason: `gradYear=${gradYear}, yoe=${u.yearsOfExperience ?? "null"}`,
    });
  }

  console.log("Skip reasons:");
  console.log(`  Admin/test/operations:               ${skippedAdminOrTest}`);
  console.log(`  Already seekingInternship=true:      ${alreadySet}`);
  console.log(`  No graduationYear:                   ${skippedNoGradYear}`);
  console.log(`  graduationYear out of range:         ${skippedGradOutOfRange}`);
  console.log(`  yoe >= 2 with gradYear=current year: ${skippedYoeTooHigh}`);
  console.log(`  currentTitle indicates senior:       ${skippedSeniorTitle}`);
  console.log("");
  console.log(`Will flip to seekingInternship=true: ${flips.length}\n`);

  for (const f of flips) {
    console.log(
      `  [${f.tier.padEnd(7)}] ${f.email.padEnd(40)} :: ${f.reason}${f.title ? ` :: title="${f.title}"` : ""}`
    );
  }

  // Sanity check: surface any paying users hitting the rule
  const payingFlips = flips.filter((f) => f.tier !== "free");
  if (payingFlips.length > 0) {
    console.log("\n!! PAYING USERS in flip set — eyeball before --apply:");
    for (const f of payingFlips) {
      console.log(`  ${f.email} (${f.tier}) :: ${f.reason}`);
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
    await prisma.user.update({
      where: { id: f.id },
      data: { seekingInternship: true },
    });
    updated++;
  }
  console.log(`✓ Set seekingInternship=true on ${updated} users`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
