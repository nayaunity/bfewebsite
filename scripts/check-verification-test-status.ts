/**
 * Inspect the verification-fix test session: status, per-discovery results,
 * verification-related steps, and any near-miss-verification ErrorLog entries.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/check-verification-test-status.ts <sessionId>
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error("Usage: npx tsx scripts/check-verification-test-status.ts <sessionId>");
    process.exit(1);
  }

  const s = await prisma.browseSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true, userId: true, status: true, targetRole: true,
      jobsFound: true, jobsApplied: true, jobsSkipped: true, jobsFailed: true,
      startedAt: true, completedAt: true, errorMessage: true,
    },
  });
  if (!s) { console.log(`Session ${sessionId} not found`); process.exit(1); }

  console.log(`Session ${s.id}`);
  console.log(`  status:   ${s.status}`);
  console.log(`  progress: found=${s.jobsFound} applied=${s.jobsApplied} skipped=${s.jobsSkipped} failed=${s.jobsFailed}`);
  console.log(`  started:  ${s.startedAt?.toISOString() ?? "—"}`);
  console.log(`  finished: ${s.completedAt?.toISOString() ?? "—"}`);
  if (s.errorMessage) console.log(`  ERROR:    ${s.errorMessage}`);

  const discoveries = await prisma.browseDiscovery.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, company: true, jobTitle: true, errorMessage: true, createdAt: true },
  });
  console.log(`\n${discoveries.length} discoveries:`);
  for (const d of discoveries) {
    console.log(`  [${d.status.padEnd(9)}] ${d.company} — ${d.jobTitle}`);
    if (d.errorMessage) {
      // Surface the verification telemetry if present in the steps trace
      const verLine = d.errorMessage.split("→").find((s) => s.includes("[Verification]"));
      console.log(`     ERR: ${d.errorMessage.slice(0, 240)}`);
      if (verLine) console.log(`     VER: ${verLine.trim()}`);
    }
  }

  // Surface near-miss-verification entries logged by the inbound webhook
  // — these prove an email arrived AFTER the worker gave up.
  const nearMisses = await prisma.errorLog.findMany({
    where: {
      userId: s.userId,
      endpoint: "worker:near-miss-verification",
      createdAt: { gte: s.startedAt || new Date(Date.now() - 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    select: { error: true, detail: true, createdAt: true },
  });
  if (nearMisses.length > 0) {
    console.log(`\n${nearMisses.length} near-miss(es) — verification email arrived after worker gave up:`);
    for (const n of nearMisses) {
      console.log(`  ${n.createdAt.toISOString()}: ${n.error}`);
      if (n.detail) console.log(`    detail: ${n.detail.slice(0, 300)}`);
    }
  } else {
    console.log(`\nNo near-miss-verification entries (good — emails arriving in time, OR no verifications hit yet).`);
  }

  // Also surface any verification-timeout failures from the worker's standard error log
  const verTimeouts = await prisma.errorLog.findMany({
    where: {
      userId: s.userId,
      endpoint: "worker:browse-discovery:failed",
      createdAt: { gte: s.startedAt || new Date(Date.now() - 60 * 60 * 1000) },
      error: { contains: "Verification code not received" },
    },
    select: { error: true, createdAt: true },
  });
  console.log(`\n${verTimeouts.length} verification-timeout failure(s) logged in this run.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
