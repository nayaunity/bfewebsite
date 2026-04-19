/**
 * Re-queue udvlenkhtaivan@gmail.com after her Apr 18 session was killed by
 * a Railway redeploy mid-apply (the watchdog reset orphaned the 12 of 13
 * matched jobs that never got attempted).
 *
 * Trialing user with 0/5 apps used. Queues fresh matches for her targetRole;
 * the worker's trial cap of 5 stops naturally if all 5 succeed.
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

const TARGET_EMAIL = "udvlenkhtaivan@gmail.com";

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
  if (!opt) return roleName.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return opt.searchTerms.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
}

async function findMatches(userId: string, roles: string[], limit: number) {
  const allJobs = await prisma.job.findMany({
    where: { isActive: true },
    select: { id: true, title: true, applyUrl: true, company: true, companySlug: true, location: true, remote: true, region: true },
  });

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
  console.log(`  tier=${user.subscriptionTier} status=${user.subscriptionStatus} apps=${user.monthlyAppCount}/5 trial`);
  console.log(`  applicationEmail=${user.applicationEmail || "(none)"}`);

  let roles: string[] = [];
  try { const p = JSON.parse(user.targetRole || "[]"); if (Array.isArray(p)) roles = p; }
  catch { if (user.targetRole) roles = [user.targetRole]; }
  if (roles.length === 0) { console.error("No target roles"); process.exit(1); }
  console.log(`  roles=${roles.join(", ")}`);

  const resume = user.resumes.find((r) => r.isFallback) || user.resumes[0];
  if (!resume) { console.error("No resume"); process.exit(1); }

  // Cancel any active session so this one queues cleanly.
  const active = await prisma.browseSession.findFirst({
    where: { userId: user.id, status: { in: ["queued", "processing"] } },
  });
  if (active) {
    await prisma.browseSession.update({
      where: { id: active.id },
      data: { status: "cancelled", completedAt: new Date(), errorMessage: "Cancelled to re-queue after deploy-induced reset" },
    });
    console.log(`Cancelled previous session ${active.id}`);
  }

  // Queue 10 matches; trial cap of 5 will stop the worker naturally if all
  // 5 succeed. Extra slots cover the few that fail (Twilio/Webflow clusters).
  const matched = await findMatches(user.id, roles, 10);
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
  console.log(`\nQueued session ${session.id}. Worker picks up within ~30s.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
