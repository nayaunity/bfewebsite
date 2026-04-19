/**
 * Refund Udval (udvlenkhtaivan@gmail.com) for the 4 wrongly-matched applies
 * that slipped through the buggy ad-hoc requeue script (missing seniority +
 * BLOCKED_COMPANIES filters). Yoe=0.7, so senior titles shouldn't have been
 * queued. Anthropic was added to BLOCKED_COMPANIES today.
 *
 * Decrements User.monthlyAppCount by N (refunds trial quota), updates the
 * affected discoveries' errorMessage to flag them as wrongly-matched while
 * keeping status='applied' (they really were sent — recruiters got them).
 * Status='applied' also means the dedup logic prevents re-queueing them.
 *
 * Dry-run by default. Pass --apply to commit.
 *
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/refund-udval-wrong-matches.ts [--apply]
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const apply = process.argv.includes("--apply");

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number",
});
const prisma = new PrismaClient({ adapter });

const TARGET_USER_ID = "c1660eab-8c9e-4304-a9bf-b2d196d7af70";
const SENIOR_REGEX = /\bsenior\b|\bsr\.?\b|\bstaff\b|\bprincipal\b|\bdirector\b|\blead\b|\bhead\b/i;
const BLOCKED_COMPANY_REGEX = /^(openai|ramp|notion|perplexity|linear|elevenlabs|anthropic)$/i;

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: TARGET_USER_ID },
    select: { firstName: true, monthlyAppCount: true, yearsOfExperience: true },
  });
  if (!user) { console.error("User not found"); process.exit(1); }

  console.log(`User: ${user.firstName}  current monthlyAppCount=${user.monthlyAppCount}  yoe=${user.yearsOfExperience}`);

  const allApplied = await prisma.browseDiscovery.findMany({
    where: { session: { userId: TARGET_USER_ID }, status: "applied" },
    orderBy: { createdAt: "desc" },
    select: { id: true, company: true, jobTitle: true, errorMessage: true, createdAt: true },
  });

  const wrong = allApplied.filter((d) => {
    // Idempotent: skip discoveries already refunded in a prior run.
    if (d.errorMessage?.includes("[wrongly-matched")) return false;
    if (BLOCKED_COMPANY_REGEX.test(d.company)) return true;
    if (SENIOR_REGEX.test(d.jobTitle)) return true;
    return false;
  });

  console.log(`\nFound ${allApplied.length} applied discoveries; ${wrong.length} flagged as wrongly-matched:`);
  for (const d of wrong) {
    const reason = BLOCKED_COMPANY_REGEX.test(d.company) ? "blocked-company" : "too-senior";
    console.log(`  [${reason}] ${d.company}: ${d.jobTitle}`);
  }

  if (wrong.length === 0) { console.log("Nothing to refund."); return; }

  if (!apply) {
    console.log(`\nDRY RUN — would decrement monthlyAppCount by ${wrong.length} (${user.monthlyAppCount} → ${Math.max(0, user.monthlyAppCount - wrong.length)}) and tag ${wrong.length} discoveries.`);
    console.log(`Re-run with --apply to commit.`);
    return;
  }

  console.log(`\nApplying...`);
  // Decrement quota
  const newCount = Math.max(0, user.monthlyAppCount - wrong.length);
  await prisma.user.update({
    where: { id: TARGET_USER_ID },
    data: { monthlyAppCount: newCount },
  });
  console.log(`monthlyAppCount: ${user.monthlyAppCount} → ${newCount}`);

  // Tag the wrong discoveries
  for (const d of wrong) {
    const reason = BLOCKED_COMPANY_REGEX.test(d.company) ? "blocked-company" : "too-senior";
    const note = `[wrongly-matched: ${reason}, quota refunded ${new Date().toISOString().slice(0, 10)}]${d.errorMessage ? " | " + d.errorMessage : ""}`;
    await prisma.browseDiscovery.update({
      where: { id: d.id },
      data: { errorMessage: note.slice(0, 500) },
    });
  }
  console.log(`Tagged ${wrong.length} discoveries.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
