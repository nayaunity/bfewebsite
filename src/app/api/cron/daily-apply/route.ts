import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canApply } from "@/lib/subscription";
import {
  matchJobsForUser,
  loadJobCatalog,
  type CatalogJob,
} from "@/lib/auto-apply/job-matcher";
import { matchUserResume } from "@/lib/resume-matcher";
import { ensureApplicationEmail } from "@/lib/application-email";
import { calculatePacing } from "@/lib/pacing";
import { logError } from "@/lib/error-logger";
import { buildDeadResumeDraft } from "@/lib/dead-resume-notice";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 300;

const DEFAULT_DAILY_CAP = 10;
const CATCHUP_DAILY_CAP = 30;
const BATCH_SIZE = 5;
const TIME_RESERVE_MS = 30_000;

const PACING_PRIORITY: Record<string, number> = {
  critical: 0,
  at_risk: 1,
  behind: 2,
  on_track: 3,
};

type UserResult = {
  userId: string;
  email: string;
  status: string;
  matchedJobs: number;
  sessionId?: string;
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Daily Apply] Starting automated job matching...");
    const startTime = Date.now();

    const eligibleUsers = await prisma.user.findMany({
      where: {
        subscriptionTier: { in: ["starter", "pro"] },
        subscriptionStatus: { in: ["active", "trialing"] },
        firstName: { not: null },
        lastName: { not: null },
        phone: { not: null },
        workAuthorized: { not: null },
        countryOfResidence: { not: null },
        targetRole: { not: null },
        resumes: { some: {} },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        targetRole: true,
        seekingInternship: true,
        subscribedAt: true,
        createdAt: true,
        currentPeriodEnd: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        monthlyAppCount: true,
      },
    });

    console.log(`[Daily Apply] Found ${eligibleUsers.length} eligible users`);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Phase 1: Run fast pre-checks in parallel for all users
    const preChecks = await Promise.all(
      eligibleUsers.map(async (user) => {
        const [usage, activeSession, healthCheck, todayApplied] =
          await Promise.all([
            canApply(user.id),
            prisma.browseSession.findFirst({
              where: {
                userId: user.id,
                status: { in: ["queued", "processing"] },
              },
            }),
            prisma.healthCheck.findFirst({
              where: { userId: user.id, runDate: { gte: todayStart } },
              orderBy: { runDate: "desc" },
            }),
            prisma.browseDiscovery.count({
              where: {
                session: { userId: user.id },
                status: "applied",
                createdAt: { gte: todayStart },
              },
            }),
          ]);

        let dailyCap: number;
        let qualityThreshold: number | undefined;
        let matchMultiplier: number;
        let pacingStatus = "on_track";

        if (healthCheck) {
          dailyCap = healthCheck.dailyCapAssigned;
          qualityThreshold = healthCheck.qualityThreshold ?? undefined;
          matchMultiplier = healthCheck.matchMultiplier;
          pacingStatus = healthCheck.pacingStatus;
        } else {
          const pacing = calculatePacing({
            subscribedAt: user.subscribedAt,
            createdAt: user.createdAt,
            currentPeriodEnd: user.currentPeriodEnd,
            subscriptionTier: user.subscriptionTier || "free",
            subscriptionStatus: user.subscriptionStatus || "active",
            monthlyAppCount: user.monthlyAppCount,
          });
          dailyCap =
            pacing.status === "on_track"
              ? DEFAULT_DAILY_CAP
              : CATCHUP_DAILY_CAP;
          qualityThreshold = undefined;
          matchMultiplier = 3;
          pacingStatus = pacing.status;
        }

        let skipReason: string | null = null;
        if (!usage.allowed) skipReason = "skipped_monthly_limit";
        else if (activeSession) skipReason = "skipped_active_session";
        else if (todayApplied >= dailyCap) skipReason = "skipped_daily_cap";

        const remaining = skipReason
          ? 0
          : Math.min(dailyCap - todayApplied, usage.remaining);

        return {
          user,
          skipReason,
          remaining,
          dailyCap,
          qualityThreshold,
          matchMultiplier,
          healthCheckId: healthCheck?.id ?? null,
          pacingStatus,
        };
      })
    );

    const results: UserResult[] = [];

    // Collect skipped users
    const readyUsers = [];
    for (const check of preChecks) {
      if (check.skipReason) {
        results.push({
          userId: check.user.id,
          email: check.user.email,
          status: check.skipReason,
          matchedJobs: 0,
        });
      } else {
        readyUsers.push(check);
      }
    }

    // Phase 2: Sort by pacing priority (worst-off users first)
    readyUsers.sort(
      (a, b) =>
        (PACING_PRIORITY[a.pacingStatus] ?? 3) -
        (PACING_PRIORITY[b.pacingStatus] ?? 3)
    );

    console.log(
      `[Daily Apply] ${readyUsers.length} users ready for matching (${results.length} skipped in pre-check)`
    );

    // Load the job catalog ONCE (sans descriptions, ~5s) and share it across
    // all users instead of re-querying ~21k rows per user. The old per-user
    // `select: { description: true }` was ~131MB / ~35s a call, which blew the
    // 300s function limit and starved everyone past the first batch.
    const catalog: CatalogJob[] =
      readyUsers.length > 0 ? await loadJobCatalog() : [];
    console.log(`[Daily Apply] Catalog loaded: ${catalog.length} jobs`);

    // Phase 3: Process in parallel batches
    for (let i = 0; i < readyUsers.length; i += BATCH_SIZE) {
      const elapsed = Date.now() - startTime;
      if (elapsed > (maxDuration * 1000 - TIME_RESERVE_MS)) {
        const remaining = readyUsers.slice(i);
        for (const r of remaining) {
          results.push({
            userId: r.user.id,
            email: r.user.email,
            status: "skipped_timeout",
            matchedJobs: 0,
          });
        }
        console.log(
          `[Daily Apply] Time guard: skipped ${remaining.length} users at ${Math.round(elapsed / 1000)}s`
        );
        break;
      }

      const batch = readyUsers.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((check) => processUser(check, todayStart, catalog))
      );
      results.push(...batchResults);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const sessionsCreated = results.filter(
      (r) => r.status === "session_created"
    ).length;

    const summary = {
      success: true,
      duration: `${duration}s`,
      eligibleUsers: eligibleUsers.length,
      sessionsCreated,
      results,
    };

    console.log("[Daily Apply] Complete:", {
      duration: `${duration}s`,
      eligible: eligibleUsers.length,
      sessionsCreated,
      skippedTimeout: results.filter((r) => r.status === "skipped_timeout")
        .length,
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Daily Apply] Failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function processUser(
  check: {
    user: {
      id: string;
      email: string;
      targetRole: string | null;
      seekingInternship: boolean | null;
    };
    remaining: number;
    matchMultiplier: number;
    qualityThreshold: number | undefined;
    healthCheckId: string | null;
  },
  todayStart: Date,
  catalog: CatalogJob[]
): Promise<UserResult> {
  const { user } = check;
  try {
    const matchedJobs = await matchJobsForUser(
      user.id,
      check.remaining * check.matchMultiplier,
      { qualityThreshold: check.qualityThreshold, catalog }
    );

    if (matchedJobs.length === 0) {
      console.log(`[Daily Apply] ${user.email}: no matches`);
      return {
        userId: user.id,
        email: user.email,
        status: "no_matches",
        matchedJobs: 0,
      };
    }

    const companiesWithJobs = [
      ...new Set(matchedJobs.map((j) => j.company)),
    ];

    let primaryRole = "Software Engineer";
    try {
      const roles = JSON.parse(user.targetRole || "[]");
      if (Array.isArray(roles) && roles.length > 0) primaryRole = roles[0];
    } catch {
      if (user.targetRole) primaryRole = user.targetRole;
    }

    const resume = await matchUserResume(user.id, primaryRole, primaryRole);
    if (!resume) {
      return {
        userId: user.id,
        email: user.email,
        status: "no_resume",
        matchedJobs: 0,
      };
    }

    // Pre-flight: HEAD-check the resume URL. If 404 (blob was deleted but DB
    // wasn't updated — the May 7 Kimberly bug), don't queue a session that
    // will silently submit garbage. Clear the dead row, email the user, skip.
    const resumeAlive = await isUrlAlive(resume.blobUrl);
    if (!resumeAlive) {
      await handleDeadResume(user.id, user.email, resume.id, resume.blobUrl);
      return {
        userId: user.id,
        email: user.email,
        status: "skipped_dead_resume",
        matchedJobs: 0,
      };
    }

    await ensureApplicationEmail(user.id);

    const session = await prisma.browseSession.create({
      data: {
        userId: user.id,
        targetRole: primaryRole,
        companies: JSON.stringify(companiesWithJobs),
        matchedJobs: JSON.stringify(
          matchedJobs.map((j) => ({
            title: j.title,
            applyUrl: j.applyUrl,
            company: j.company,
          }))
        ),
        resumeUrl: resume.blobUrl,
        resumeName: resume.fileName,
        totalCompanies: companiesWithJobs.length,
        seekingInternship: user.seekingInternship === true,
        qualityThreshold: check.qualityThreshold ?? null,
        healthCheckId: check.healthCheckId,
      },
    });

    console.log(
      `[Daily Apply] ${user.email}: ${matchedJobs.length} matches across ${companiesWithJobs.length} companies → session ${session.id}`
    );

    return {
      userId: user.id,
      email: user.email,
      status: "session_created",
      matchedJobs: matchedJobs.length,
      sessionId: session.id,
    };
  } catch (error) {
    console.error(`[Daily Apply] Error for ${user.email}:`, error);
    return {
      userId: user.id,
      email: user.email,
      status: "error",
      matchedJobs: 0,
    };
  }
}

async function isUrlAlive(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Called when the daily-apply CRON detects a user whose selected resume's
 * blob URL is 404. Clears the dead row from UserResume; if it was also the
 * legacy User.resumeUrl, nulls that too. Logs to ErrorLog with high
 * severity. Sends the user the re-upload email (once — once the rows are
 * cleared, the eligibility query filters them out of the next CRON loop, so
 * this won't re-fire daily).
 */
async function handleDeadResume(
  userId: string,
  email: string,
  resumeId: string,
  deadUrl: string,
): Promise<void> {
  // Drop the dead UserResume row so the user falls out of the eligibility
  // gate (`resumes: { some: {} }`) until they re-upload.
  try {
    await prisma.userResume.delete({ where: { id: resumeId } });
  } catch {
    // Row may have been removed concurrently — fine.
  }

  // If legacy User.resumeUrl pointed at the same dead blob, null it too so
  // the dashboard's ResumeHealthBanner stops checking it.
  await prisma.user
    .updateMany({
      where: { id: userId, resumeUrl: deadUrl },
      data: { resumeUrl: null, resumeName: null, resumeUpdatedAt: null },
    })
    .catch(() => {});

  await logError({
    userId,
    endpoint: "cron/daily-apply",
    method: "GET",
    status: 200,
    error: "Detected dead resume blob; cleared user resume state",
    detail: `deadUrl=${deadUrl} resumeId=${resumeId}`,
  });

  // Send the re-upload nudge.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `[Daily Apply] dead resume for ${email} but RESEND_API_KEY unset; skipping email`,
    );
    return;
  }
  try {
    const draft = await buildDeadResumeDraft(email);
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "Naya <naya@theblackfemaleengineer.com>",
      to: draft.email,
      replyTo: "theblackfemaleengineer@gmail.com",
      subject: draft.subject,
      text: draft.text,
      html: draft.html,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(
      `[Daily Apply] failed to send dead-resume email to ${email}: ${detail}`,
    );
    await logError({
      userId,
      endpoint: "cron/daily-apply",
      method: "GET",
      status: 500,
      error: "Failed to send dead-resume email",
      detail,
    });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
