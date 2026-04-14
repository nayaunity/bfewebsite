/**
 * Queue an immediate auto-apply batch for a specific user.
 *
 * Mirrors the logic in src/app/api/auto-apply/start/route.ts but runs as a
 * one-off script (no auth session required). Creates a queued BrowseSession
 * that the Railway worker will pick up within ~30 seconds.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/apply-for-user.ts <userId>
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

const TIER_LIMITS: Record<string, { appsPerMonth: number }> = {
  free: { appsPerMonth: 5 },
  starter: { appsPerMonth: 100 },
  pro: { appsPerMonth: 300 },
};

const DAILY_CAP = 10;
const BLOCKED_COMPANIES = ["duolingo", "samsara", "grammarly"];

const STOP_WORDS = new Set([
  "engineer", "engineering", "senior", "junior", "staff", "principal",
  "lead", "manager", "director", "head", "vp", "chief",
]);

// Countries/cities used as a string-level safety net for mis-regioned rows.
const NON_US_INDICATORS = [
  "india", "ireland", "uk", "united kingdom", "england", "germany", "france",
  "japan", "singapore", "australia", "brazil", "canada", "italy", "spain",
  "netherlands", "sweden", "denmark", "norway", "finland", "poland", "czech",
  "israel", "korea", "china", "hong kong", "taiwan", "mexico", "argentina",
  "colombia", "chile", "peru", "bangalore", "bengaluru", "hyderabad", "mumbai",
  "pune", "delhi", "chennai", "london", "berlin", "paris", "tokyo", "sydney",
  "melbourne", "toronto", "vancouver", "montreal", "dublin", "amsterdam",
  "são paulo", "sao paulo", "tel aviv", "seoul", "shanghai", "beijing",
  "krakow", "warsaw", "stockholm", "copenhagen", "oslo", "helsinki", "zurich",
  "geneva", "munich", "hamburg", "barcelona", "madrid", "lisbon", "milan",
  "rome", "vienna", "brussels", "prague",
];

function titleOrLocHintsNonUS(s: string): boolean {
  const l = s.toLowerCase();
  return NON_US_INDICATORS.some((ind) => l.includes(ind));
}

function buildKeywords(roleName: string): string[] {
  const opt = ROLE_OPTIONS.find((r) => r.label === roleName);
  if (!opt)
    return roleName
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return opt.searchTerms
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

interface MatchedJob {
  id: string;
  title: string;
  applyUrl: string;
  company: string;
  score: number;
  matchReason: string;
}

async function findMatchingJobs(
  user: {
    id: string;
    yearsOfExperience: number | string | null;
    city: string | null;
    remotePreference: string | null;
    countryOfResidence: string | null;
  },
  roles: string[],
  limit: number
): Promise<MatchedJob[]> {
  const allJobs = await prisma.job.findMany({
    where: { isActive: true },
    select: {
      id: true, title: true, applyUrl: true, company: true,
      companySlug: true, location: true, remote: true, region: true,
    },
  });

  // Match the worker's dedup: exclude only URLs currently applied/applying.
  // Failed URLs SHOULD be re-queueable (e.g. after a form-handling fix ships,
  // or to retry a transient server outage). Skipped URLs (company cooldown,
  // anti-bot flag, credit outage) re-queue too — the worker will skip them
  // again if still on cooldown, but otherwise gets another shot.
  const appliedUrls = new Set(
    (
      await prisma.browseDiscovery.findMany({
        where: { session: { userId: user.id }, status: { in: ["applied", "applying"] } },
        select: { applyUrl: true },
      })
    ).map((d) => d.applyUrl)
  );

  const queuedSessions = await prisma.browseSession.findMany({
    where: { userId: user.id, status: { in: ["queued", "processing"] } },
    select: { matchedJobs: true },
  });
  for (const s of queuedSessions) {
    try {
      const jobs = JSON.parse(s.matchedJobs || "[]");
      for (const j of jobs) if (j.applyUrl) appliedUrls.add(j.applyUrl);
    } catch {}
  }

  const roleKeywords = roles.map((r) => ({ role: r, keywords: buildKeywords(r) }));
  const isUS = (user.countryOfResidence || "").toLowerCase().includes("united states");
  const yoe =
    typeof user.yearsOfExperience === "number"
      ? user.yearsOfExperience
      : parseInt(String(user.yearsOfExperience)) || 2;

  const scored: MatchedJob[] = [];

  for (const job of allJobs) {
    if (BLOCKED_COMPANIES.includes(job.companySlug?.toLowerCase() || "")) continue;
    if (appliedUrls.has(job.applyUrl || "")) continue;
    if (!job.applyUrl) continue;

    if (yoe <= 5 && /\b(staff|principal|director|head of|vp|chief)\b/i.test(job.title)) continue;
    if (yoe <= 2 && /\bsenior\b/i.test(job.title) && !/\bjunior\b/i.test(job.title)) continue;

    // Region gate (match production matcher): hard-reject international for US users
    // regardless of remote flag. Also string-check title + location as a safety net
    // for rows tagged region=us but whose title/location reveals EU-only (e.g.
    // "Senior Frontend Engineer, Alerting | Germany | Remote").
    if (isUS && job.region === "international") continue;
    if (!isUS && job.region === "us") continue;
    if (isUS && titleOrLocHintsNonUS(`${job.title} ${job.location || ""}`)) continue;

    let locScore = 0.5;
    if (job.remote) locScore = 1;
    else if (isUS && job.region === "us") locScore = 0.8;
    else if (!isUS && job.region === "international") locScore = 0.8;

    let bestRoleScore = 0;
    let matchReason = "";

    for (const { role, keywords } of roleKeywords) {
      let roleScore = 0;
      const matchedTerms: string[] = [];
      for (const kw of keywords) {
        if (job.title.toLowerCase().includes(kw)) {
          roleScore += kw.length;
          matchedTerms.push(kw);
        }
      }
      if (roleScore > bestRoleScore) {
        bestRoleScore = roleScore;
        const reasons: string[] = [];
        if (matchedTerms.length > 0) reasons.push(`${role} match`);
        if (job.remote) reasons.push("Remote");
        if (locScore >= 0.8) reasons.push("Location match");
        matchReason = reasons.join(" · ");
      }
    }

    if (bestRoleScore === 0) continue;

    const normRoleScore = Math.min(1, bestRoleScore / 20);
    const score = normRoleScore * 0.6 + locScore * 0.4;

    scored.push({
      id: job.id,
      title: job.title,
      applyUrl: job.applyUrl!,
      company: job.company,
      score,
      matchReason,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("Usage: npx tsx scripts/apply-for-user.ts <userId>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, firstName: true, targetRole: true,
      yearsOfExperience: true, city: true, remotePreference: true,
      countryOfResidence: true, monthlyAppCount: true, monthlyAppResetAt: true,
      subscriptionTier: true, autoApplyEnabled: true,
      resumes: { select: { id: true, name: true, blobUrl: true, fileName: true, isFallback: true } },
    },
  });

  if (!user) {
    console.error(`No user found for id=${userId}`);
    process.exit(1);
  }

  const tier = user.subscriptionTier || "free";
  const monthlyCap = (TIER_LIMITS[tier] ?? TIER_LIMITS.free).appsPerMonth;

  const now = new Date();
  const resetAt = new Date(user.monthlyAppResetAt);
  const monthChanged =
    now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear();
  const monthlyUsed = monthChanged ? 0 : user.monthlyAppCount;
  const monthlyRemaining = monthlyCap - monthlyUsed;

  if (monthlyRemaining <= 0) {
    console.error(`No monthly quota remaining (${monthlyUsed}/${monthlyCap}) for ${user.email}`);
    process.exit(1);
  }

  if (monthChanged) {
    await prisma.user.update({
      where: { id: user.id },
      data: { monthlyAppCount: 0, monthlyTailorCount: 0, monthlyAppResetAt: now },
    });
  }

  const active = await prisma.browseSession.findFirst({
    where: { userId: user.id, status: { in: ["queued", "processing"] } },
  });
  if (active) {
    console.error(`User already has active session ${active.id} (${active.status})`);
    process.exit(1);
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayApplied = await prisma.browseDiscovery.count({
    where: {
      session: { userId: user.id },
      status: "applied",
      createdAt: { gte: todayStart },
    },
  });

  const dailyRemaining = DAILY_CAP - todayApplied;
  if (dailyRemaining <= 0) {
    console.error(`Daily cap reached (${todayApplied}/${DAILY_CAP}). Try again tomorrow.`);
    process.exit(1);
  }

  const remaining = Math.min(dailyRemaining, monthlyRemaining);

  let roles: string[] = [];
  try {
    const parsed = JSON.parse(user.targetRole || "[]");
    if (Array.isArray(parsed)) roles = parsed;
  } catch {
    if (user.targetRole) roles = [user.targetRole];
  }

  if (roles.length === 0) {
    console.error(`No target roles set for ${user.email}`);
    process.exit(1);
  }

  const primaryRole = roles[0];
  const resume =
    user.resumes.find((r) => r.name.toLowerCase() === primaryRole.toLowerCase()) ||
    user.resumes.find((r) => r.isFallback) ||
    user.resumes[0];

  if (!resume) {
    console.error(`No resume found for ${user.email}`);
    process.exit(1);
  }

  console.log(`\nUser: ${user.firstName} ${user.email}`);
  console.log(`Tier: ${tier} (${monthlyUsed}/${monthlyCap} this month, ${todayApplied}/${DAILY_CAP} today)`);
  console.log(`Roles: ${roles.join(", ")}`);
  console.log(`Resume: ${resume.name} (${resume.fileName})`);
  console.log(`Targeting ${remaining} applications this batch (fetching ${remaining * 3} candidates)\n`);

  const matchedJobs = await findMatchingJobs(user, roles, remaining * 3);

  if (matchedJobs.length === 0) {
    console.error("No matching jobs found. Check back after tomorrow's scrape.");
    process.exit(1);
  }

  console.log(`Top ${Math.min(15, matchedJobs.length)} matches:`);
  for (const j of matchedJobs.slice(0, 15)) {
    console.log(`  ${(j.score * 100).toFixed(0)}%  ${j.company.padEnd(16)}  ${j.title}`);
    console.log(`        ${j.matchReason}`);
  }

  const companies = [...new Set(matchedJobs.map((j) => j.company))];

  const session = await prisma.browseSession.create({
    data: {
      userId: user.id,
      targetRole: primaryRole,
      companies: JSON.stringify(companies),
      matchedJobs: JSON.stringify(
        matchedJobs.map((j) => ({
          title: j.title,
          applyUrl: j.applyUrl,
          company: j.company,
          matchScore: j.score,
          matchReason: j.matchReason,
        }))
      ),
      resumeUrl: resume.blobUrl,
      resumeName: resume.fileName,
      totalCompanies: companies.length,
    },
  });

  console.log(`\nQueued BrowseSession ${session.id} with ${matchedJobs.length} jobs across ${companies.length} companies.`);
  console.log(`Railway worker will start applying within ~30 seconds.`);
  console.log(`Resume tailoring happens automatically per job (user currently at 0 tailored/month used).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
