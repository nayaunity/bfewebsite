/**
 * Production canary for the verification-code fix shipped Apr 18.
 *
 * Re-runs c.wright-galloway@benedict.edu against the same role queue that
 * failed 0/14 in the screenshot. Auto-cancels the session once jobsApplied
 * reaches 3 so we don't burn her real quota beyond what we need to validate.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/apply-for-cwright-galloway-capped.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { ROLE_OPTIONS } from "../src/lib/role-options";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number",
});
const prisma = new PrismaClient({ adapter });

const TARGET_EMAIL = "c.wright-galloway@benedict.edu";
const SUCCESS_CAP = 3;
const POLL_INTERVAL_MS = 60_000;
const MAX_WAIT_MS = 50 * 60 * 1000; // 50 min hard cap

const STOP_WORDS = new Set([
  "engineer", "engineering", "senior", "junior", "staff", "principal",
  "lead", "manager", "director", "head", "vp", "chief",
]);

// Keep in sync with src/lib/auto-apply/job-matcher.ts BLOCKED_COMPANIES.
const BLOCKED_COMPANIES = [
  "duolingo", "samsara", "grammarly",
  "openai", "ramp", "notion", "perplexity", "linear", "elevenlabs",
  "anthropic",
];

function buildKeywords(roleName: string): string[] {
  const opt = ROLE_OPTIONS.find((r) => r.label === roleName);
  if (!opt)
    return roleName.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return opt.searchTerms.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
}

async function findMatches(userId: string, roles: string[], limit: number) {
  const allJobs = await prisma.job.findMany({
    where: { isActive: true },
    select: { id: true, title: true, applyUrl: true, company: true, companySlug: true, location: true, remote: true, region: true },
  });

  // Exclude only currently applied/applying URLs — failed ones are re-queueable.
  const appliedUrls = new Set(
    (await prisma.browseDiscovery.findMany({
      where: { session: { userId }, status: { in: ["applied", "applying"] } },
      select: { applyUrl: true },
    })).map((d) => d.applyUrl)
  );

  const cooldowns = await prisma.companyCooldown.findMany({
    where: { cooldownUntil: { gt: new Date() } },
    select: { companySlug: true },
  });
  const cooldownSlugs = new Set(cooldowns.map((c) => c.companySlug));

  const roleKeywords = roles.map((r) => ({ role: r, keywords: buildKeywords(r) }));
  const scored: Array<{ title: string; applyUrl: string; company: string; score: number; matchReason: string }> = [];

  for (const job of allJobs) {
    if (BLOCKED_COMPANIES.includes(job.companySlug?.toLowerCase() || "")) continue;
    if (cooldownSlugs.has(job.companySlug?.toLowerCase() || "")) continue;
    if (appliedUrls.has(job.applyUrl || "")) continue;
    if (!job.applyUrl) continue;
    if (job.region === "international") continue;

    let bestRoleScore = 0;
    let matchReason = "";
    for (const { role, keywords } of roleKeywords) {
      let s = 0;
      const matched: string[] = [];
      for (const kw of keywords) {
        if (job.title.toLowerCase().includes(kw)) { s += kw.length; matched.push(kw); }
      }
      if (s > bestRoleScore) {
        bestRoleScore = s;
        matchReason = matched.length > 0 ? `${role} match` : "";
      }
    }
    if (bestRoleScore === 0) continue;

    const locScore = job.remote ? 1 : (job.region === "us" ? 0.8 : 0.5);
    const score = Math.min(1, bestRoleScore / 20) * 0.6 + locScore * 0.4;
    scored.push({ title: job.title, applyUrl: job.applyUrl!, company: job.company, score, matchReason });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: TARGET_EMAIL },
    select: {
      id: true, email: true, firstName: true, targetRole: true,
      subscriptionTier: true, subscriptionStatus: true,
      monthlyAppCount: true, applicationEmail: true,
      resumes: { select: { id: true, name: true, blobUrl: true, fileName: true, isFallback: true } },
    },
  });
  if (!user) { console.error(`User ${TARGET_EMAIL} not found`); process.exit(1); }

  console.log(`User: ${user.firstName} (id=${user.id})`);
  console.log(`  tier=${user.subscriptionTier} status=${user.subscriptionStatus} monthly=${user.monthlyAppCount}`);
  console.log(`  applicationEmail=${user.applicationEmail || "(none)"}`);

  let roles: string[] = [];
  try { const p = JSON.parse(user.targetRole || "[]"); if (Array.isArray(p)) roles = p; }
  catch { if (user.targetRole) roles = [user.targetRole]; }
  if (roles.length === 0) { console.error("No target roles set"); process.exit(1); }
  console.log(`  roles=${roles.join(", ")}`);

  const resume = user.resumes.find((r) => r.isFallback) || user.resumes[0];
  if (!resume) { console.error("No resume"); process.exit(1); }

  // Cancel any active sessions so this one queues cleanly.
  const active = await prisma.browseSession.findFirst({
    where: { userId: user.id, status: { in: ["queued", "processing"] } },
  });
  if (active) {
    await prisma.browseSession.update({
      where: { id: active.id },
      data: { status: "cancelled", completedAt: new Date(), errorMessage: "Cancelled to queue verification canary" },
    });
    console.log(`Cancelled previous session ${active.id}`);
  }

  // Queue 8 jobs — covers up to 3 successes with margin for failures from
  // deferred-fix clusters (Twilio role mismatch, Webflow dropdown).
  const matched = await findMatches(user.id, roles, 8);
  if (matched.length === 0) { console.error("No matching jobs"); process.exit(1); }

  console.log(`\nQueuing ${matched.length} matches:`);
  for (const j of matched) console.log(`  ${(j.score * 100).toFixed(0)}%  ${j.company.padEnd(16)} ${j.title}`);

  const companies = [...new Set(matched.map((j) => j.company))];
  const session = await prisma.browseSession.create({
    data: {
      userId: user.id,
      targetRole: roles[0],
      companies: JSON.stringify(companies),
      matchedJobs: JSON.stringify(matched.map((j) => ({
        title: j.title, applyUrl: j.applyUrl, company: j.company, matchScore: j.score, matchReason: j.matchReason,
      }))),
      resumeUrl: resume.blobUrl,
      resumeName: resume.fileName,
      totalCompanies: companies.length,
    },
  });
  console.log(`\nQueued session ${session.id}. Polling every ${POLL_INTERVAL_MS / 1000}s; cancelling at ${SUCCESS_CAP} successful applies.\n`);

  const startedAt = Date.now();
  let lastApplied = -1;
  while (Date.now() - startedAt < MAX_WAIT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const s = await prisma.browseSession.findUnique({
      where: { id: session.id },
      select: { status: true, jobsFound: true, jobsApplied: true, jobsFailed: true, jobsSkipped: true },
    });
    if (!s) { console.error("Session vanished"); break; }
    if (s.jobsApplied !== lastApplied) {
      console.log(`[${new Date().toISOString()}] status=${s.status} applied=${s.jobsApplied} failed=${s.jobsFailed} skipped=${s.jobsSkipped}`);
      lastApplied = s.jobsApplied;
    }
    if (s.jobsApplied >= SUCCESS_CAP) {
      console.log(`\n✓ Hit ${SUCCESS_CAP} successful applies — cancelling session.`);
      await prisma.browseSession.update({
        where: { id: session.id },
        data: { status: "cancelled", completedAt: new Date(), errorMessage: `Cancelled by canary script after ${s.jobsApplied} successes` },
      });
      break;
    }
    if (s.status === "completed" || s.status === "failed" || s.status === "cancelled") {
      console.log(`\nSession ended: status=${s.status}`);
      break;
    }
  }

  // Final report
  const final = await prisma.browseSession.findUnique({
    where: { id: session.id },
    select: { status: true, jobsApplied: true, jobsFailed: true, jobsSkipped: true },
  });
  console.log(`\nFinal: status=${final?.status} applied=${final?.jobsApplied} failed=${final?.jobsFailed} skipped=${final?.jobsSkipped}`);

  const discoveries = await prisma.browseDiscovery.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    select: { status: true, company: true, jobTitle: true, errorMessage: true },
  });
  console.log(`\nPer-discovery:`);
  for (const d of discoveries) {
    console.log(`  [${d.status.padEnd(9)}] ${d.company} — ${d.jobTitle}`);
    if (d.errorMessage) console.log(`     ERR: ${d.errorMessage.slice(0, 200)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
