/**
 * Fill every trialing user up to 5/5 applications.
 *
 * Finds users with subscriptionStatus = "trialing" and monthlyAppCount < 5,
 * queues a BrowseSession with matchedJobs pre-populated by the production
 * matcher (src/lib/auto-apply/job-matcher.ts matchJobsForUser). The worker
 * fast-path consumes matchedJobs and stops naturally at 5 per the trial cap
 * in worker/src/browse-loop.ts.
 *
 * Dry-run by default. Pass --apply to actually create sessions.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   ANTHROPIC_API_KEY=$(grep ANTHROPIC_API_KEY .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/fill-trial-users-to-cap.ts           # dry-run
 *   npx tsx scripts/fill-trial-users-to-cap.ts --apply   # queue sessions
 */

import { prisma } from "../src/lib/prisma";
import { matchJobsForUser } from "../src/lib/auto-apply/job-matcher";
import { ensureApplicationEmail } from "../src/lib/application-email";
import { matchUserResume } from "../src/lib/resume-matcher";
import { canApply } from "../src/lib/subscription";

const TRIAL_CAP = 5;
const APPLY = process.argv.includes("--apply");

type Row = {
  userId: string;
  email: string;
  used: number;
  remaining: number;
  matchCount?: number;
  sample?: string;
  action: string;
  sessionId?: string;
};

async function main() {
  const mode = APPLY ? "APPLY" : "DRY-RUN";
  console.log(`\n[fill-trial-users-to-cap] mode=${mode}\n`);

  const trialingUsers = await prisma.user.findMany({
    where: { subscriptionStatus: "trialing" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      workAuthorized: true,
      countryOfResidence: true,
      targetRole: true,
      monthlyAppCount: true,
      currentPeriodEnd: true,
      resumeUrl: true,
      resumes: { select: { id: true } },
    },
  });

  console.log(`Trialing users: ${trialingUsers.length}\n`);

  const rows: Row[] = [];

  for (const user of trialingUsers) {
    const used = user.monthlyAppCount;
    const remaining = Math.max(0, TRIAL_CAP - used);
    const base = { userId: user.id, email: user.email, used, remaining };

    if (remaining === 0) {
      rows.push({ ...base, action: "at_cap" });
      continue;
    }

    const activeSession = await prisma.browseSession.findFirst({
      where: {
        userId: user.id,
        status: { in: ["queued", "processing"] },
      },
      select: { id: true },
    });

    if (activeSession) {
      rows.push({
        ...base,
        action: "skipped_active_session",
        sessionId: activeSession.id,
      });
      continue;
    }

    const hasResume = user.resumes.length > 0 || !!user.resumeUrl;
    const incomplete =
      !user.firstName ||
      !user.lastName ||
      !user.phone ||
      !user.workAuthorized ||
      !user.countryOfResidence ||
      !user.targetRole ||
      !hasResume;

    if (incomplete) {
      rows.push({ ...base, action: "skipped_incomplete_profile" });
      continue;
    }

    const usage = await canApply(user.id);
    if (!usage.allowed) {
      rows.push({
        ...base,
        action: `skipped_canapply_${usage.reason ?? "blocked"}`,
      });
      continue;
    }

    // Overprovision 3x like daily-apply so the worker has backups on failure;
    // clamp to remaining so we never feed it more than the cap needs.
    const matches = await matchJobsForUser(user.id, remaining * 3);

    if (matches.length === 0) {
      rows.push({ ...base, action: "no_matches" });
      continue;
    }

    let primaryRole = "Software Engineer";
    try {
      const parsed = JSON.parse(user.targetRole || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) primaryRole = parsed[0];
    } catch {
      if (user.targetRole) primaryRole = user.targetRole;
    }

    const resume = await matchUserResume(user.id, primaryRole, primaryRole);
    if (!resume) {
      rows.push({ ...base, action: "no_resume" });
      continue;
    }

    const sample = matches
      .slice(0, 3)
      .map((m) => `${m.company}: ${m.title}`)
      .join(" | ");

    if (!APPLY) {
      rows.push({
        ...base,
        matchCount: matches.length,
        sample,
        action: "would_queue",
      });
      continue;
    }

    await ensureApplicationEmail(user.id);

    const companies = [...new Set(matches.map((m) => m.company))];

    const session = await prisma.browseSession.create({
      data: {
        userId: user.id,
        targetRole: primaryRole,
        companies: JSON.stringify(companies),
        matchedJobs: JSON.stringify(
          matches.map((m) => ({
            title: m.title,
            applyUrl: m.applyUrl,
            company: m.company,
          }))
        ),
        resumeUrl: resume.blobUrl,
        resumeName: resume.fileName,
        totalCompanies: companies.length,
      },
    });

    rows.push({
      ...base,
      matchCount: matches.length,
      sample,
      action: "queued",
      sessionId: session.id,
    });

    console.log(
      `[${user.email}] used=${used}/5 need=${remaining} matches=${matches.length} session=${session.id}`
    );
  }

  console.log("\nPer-user breakdown:");
  console.table(
    rows.map((r) => ({
      email: r.email.length > 32 ? r.email.slice(0, 29) + "..." : r.email,
      "used/5": `${r.used}/5`,
      need: r.remaining,
      matches: r.matchCount ?? "-",
      action: r.action,
      session: r.sessionId ? r.sessionId.slice(0, 8) : "-",
      sample: r.sample ? (r.sample.length > 60 ? r.sample.slice(0, 57) + "..." : r.sample) : "-",
    }))
  );

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.action] = (acc[r.action] || 0) + 1;
    return acc;
  }, {});
  console.log("\nSummary:", counts);

  const remainingSlots = rows
    .filter((r) => r.action === "would_queue" || r.action === "queued")
    .reduce((sum, r) => sum + r.remaining, 0);

  if (!APPLY) {
    console.log(
      `\nDry-run complete. ${counts.would_queue ?? 0} users would be queued, ` +
        `totalling up to ${remainingSlots} new applies across the cohort.`
    );
    console.log("Re-run with --apply to execute.");
  } else {
    const etaMin = Math.ceil((remainingSlots / 2) * 5);
    console.log(
      `\nQueued ${counts.queued ?? 0} sessions (${remainingSlots} slots). ` +
        `Rough worker ETA at 2 concurrent × 5 min/job: ~${etaMin} min.`
    );
    console.log("Monitor at /admin/auto-apply (filter to Trial).");
  }
}

main()
  .catch((err) => {
    console.error("[fill-trial-users-to-cap] FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
