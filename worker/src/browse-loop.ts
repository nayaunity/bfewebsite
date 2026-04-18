import { getDb, getCompanyCooldown, setCompanyCooldown, logStuckField } from "./db";
import { discoverJobs, discoverJobsFromCatalog, applyToJob } from "./career-browser";
import { checkAnthropicCredits, isCreditExhaustionError } from "./apply-engine";
import { postCreditAlert } from "./alerts";
import { logWorkerError } from "./error-log";

async function getSessionUserId(sessionId: string): Promise<string | null> {
  try {
    const r = await getDb().execute({
      sql: `SELECT userId FROM BrowseSession WHERE id = ?`,
      args: [sessionId],
    });
    return (r.rows?.[0] as unknown as { userId?: string })?.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Refresh BrowseSession.lastHeartbeatAt — the liveness signal the watchdog
 * filters on. Called on session claim and around every apply attempt so a
 * legitimate long session (30 jobs × 5 min = 150 min) keeps refreshing past
 * what used to be a fatal 30-min hard cap.
 *
 * Swallows DB errors so a transient Turso blip can't kill the loop. Worst
 * case is a single missed heartbeat; the 20-min staleness threshold gives
 * multiple chances before the watchdog acts.
 */
async function heartbeat(sessionId: string): Promise<void> {
  try {
    // ISO 8601 — Prisma 6's libsql adapter rejects SQLite's default
    // "YYYY-MM-DD HH:MM:SS" format on DateTime fields with P2023, breaking
    // /admin/auto-apply when it reads BrowseSession via findMany().
    await getDb().execute({
      sql: `UPDATE BrowseSession SET lastHeartbeatAt = ? WHERE id = ?`,
      args: [new Date().toISOString(), sessionId],
    });
  } catch {}
}

const APPLICATION_EMAIL_DOMAIN = "apply.theblackfemaleengineer.com";

/**
 * Provision a User.applicationEmail row from the worker. Mirrors the
 * Next.js-side ensureApplicationEmail() (src/lib/application-email.ts)
 * but uses the libsql client directly. Returns the provisioned address.
 *
 * Without this, sessions queued via direct DB writes (scripts, legacy flows)
 * leave applicationEmail NULL, which silently breaks the verification-code
 * flow because the ATS sends to the user's real inbox.
 */
async function ensureApplicationEmailOnUser(userId: string): Promise<string> {
  const db = getDb();
  const shortId = userId.slice(0, 8);
  const candidate = `u-${shortId}@${APPLICATION_EMAIL_DOMAIN}`;
  try {
    await db.execute({
      sql: `UPDATE User SET applicationEmail = ? WHERE id = ?`,
      args: [candidate, userId],
    });
    return candidate;
  } catch {
    // Unique-constraint collision — fall back to longer prefix.
    const longId = userId.slice(0, 12);
    const fallback = `u-${longId}@${APPLICATION_EMAIL_DOMAIN}`;
    await db.execute({
      sql: `UPDATE User SET applicationEmail = ? WHERE id = ?`,
      args: [fallback, userId],
    });
    return fallback;
  }
}

function companyKey(company: string): string {
  return company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isSpamFlagError(msg: string | null | undefined): boolean {
  if (!msg) return false;
  return /flagged as spam|spam by the platform/i.test(msg);
}
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import targetCompanies from "../data/target-companies.json";

const DELAY_BETWEEN_COMPANIES_MS = 10_000;
const DELAY_BETWEEN_JOBS_MS = 5_000;
const COMPANY_TIMEOUT_MS = 120_000;
const DAILY_APP_CAP = 10;

function log(sessionId: string, level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), sessionId, level, msg, ...meta }));
}

interface BrowseSessionRow {
  id: string;
  userId: string;
  targetRole: string;
  companies: string;
  matchedJobs: string | null;
  resumeUrl: string;
  resumeName: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  applicationEmail: string | null;
  phone: string;
  preferredName: string | null;
  pronouns: string | null;
  usState: string | null;
  workAuthorized: number | null;
  needsSponsorship: number | null;
  countryOfResidence: string | null;
  willingToRelocate: number | null;
  remotePreference: string | null;
  monthlyAppCount: number;
  subscriptionTier: string;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  currentEmployer: string | null;
  currentTitle: string | null;
  school: string | null;
  degree: string | null;
  graduationYear: string | null;
  additionalCerts: string | null;
  city: string | null;
  yearsOfExperience: string | null;
  salaryExpectation: string | null;
  earliestStartDate: string | null;
  gender: string | null;
  race: string | null;
  hispanicOrLatino: string | null;
  veteranStatus: string | null;
  disabilityStatus: string | null;
  applicationAnswers: string | null;
}

const companyUrlMap = new Map(
  targetCompanies.map((c) => [c.name, c.careersUrl])
);

const companySlugMap = new Map(
  targetCompanies.map((c) => [c.name, (c as { slug?: string }).slug || ""])
);

/**
 * Poll for and process the next browse session.
 */
export async function processNextBrowseSession(): Promise<boolean> {
  const db = getDb();

  // Watchdog: reset sessions whose worker has stopped making progress.
  //
  // Liveness signal is `lastHeartbeatAt`, written by the worker on session
  // claim and after every apply attempt. Healthy long sessions (e.g. 30 jobs
  // × 5 min each) keep refreshing it, so they stay alive past the old hard
  // 30-min cap that was killing legitimate progress (jain1009 Apr 18).
  //
  // Three OR'd conditions:
  //   1. Heartbeat stale > 20 min — worker died mid-apply (12-min app timeout
  //      + 8-min buffer for the per-job loop to write the post-result heartbeat).
  //   2. NULL heartbeat AND startedAt > 30 min — backwards compat for sessions
  //      queued before this code shipped (no heartbeat ever written).
  //   3. startedAt > 6 hours — absolute defense-in-depth cap.
  //
  // All threshold timestamps are ISO 8601 — see heartbeat() helper for why.
  try {
    const now = new Date();
    const twentyMinAgo = new Date(now.getTime() - 20 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();
    const stale = await db.execute({
      sql: `UPDATE BrowseSession SET status = 'failed',
            errorMessage = 'Session timed out — please try again',
            completedAt = ?
            WHERE status = 'processing'
            AND (
              (lastHeartbeatAt IS NOT NULL AND lastHeartbeatAt < ?)
              OR (lastHeartbeatAt IS NULL AND startedAt < datetime('now', '-30 minutes'))
              OR (startedAt < datetime('now', '-6 hours'))
            )
            RETURNING id, userId`,
      args: [nowIso, twentyMinAgo],
    });
    if (stale.rows && stale.rows.length > 0) {
      for (const row of stale.rows) {
        const sessionId = row.id as string;
        const userId = (row as unknown as { userId?: string }).userId ?? null;

        // Counter flush: any BrowseDiscovery rows still in 'applying' status
        // belonged to the in-flight apply when the worker died. Mark them
        // failed and bump jobsFailed so the session counters reflect reality
        // (previously these were left in 'applying' forever and undercount).
        try {
          await db.execute({
            sql: `UPDATE BrowseSession
                  SET jobsFailed = jobsFailed + (
                    SELECT COUNT(*) FROM BrowseDiscovery
                    WHERE sessionId = ? AND status = 'applying'
                  )
                  WHERE id = ?`,
            args: [sessionId, sessionId],
          });
          await db.execute({
            sql: `UPDATE BrowseDiscovery
                  SET status = 'failed',
                      errorMessage = '[session-watchdog] Session reset before this job finished'
                  WHERE sessionId = ? AND status = 'applying'`,
            args: [sessionId],
          });
        } catch {}

        console.log(JSON.stringify({ ts: new Date().toISOString(), level: "warn", msg: "Reset stuck session", sessionId }));
        await logWorkerError({
          kind: "browse-session:timeout",
          userId,
          sessionId,
          message: "Session watchdog reset (stale heartbeat or absolute cap)",
        });
      }
    }
  } catch {}

  // Atomically claim next queued session — set lastHeartbeatAt now so the
  // watchdog has an immediate liveness signal before the first apply lands.
  // lastHeartbeatAt uses ISO format (Prisma 6 requirement); startedAt stays
  // on SQLite's datetime('now') for backwards-compat with existing rows and
  // the watchdog's legacy startedAt comparison branch.
  const result = await db.execute({
    sql: `UPDATE BrowseSession SET status = 'processing',
          startedAt = datetime('now'),
          lastHeartbeatAt = ?
          WHERE id = (SELECT id FROM BrowseSession WHERE status = 'queued' ORDER BY createdAt ASC LIMIT 1)
          RETURNING id, userId, targetRole, companies, matchedJobs, resumeUrl, resumeName`,
    args: [new Date().toISOString()],
  });

  if (!result.rows || result.rows.length === 0) {
    return false;
  }

  const session = result.rows[0] as unknown as BrowseSessionRow;

  // Browserbase A/B: enable for a hashed percentage of userIds when a rollout
  // percentage is configured. Session-scoped so concurrent sessions stay
  // consistent with their bucket. Reads BROWSERBASE_ROLLOUT_PCT (0-100); if
  // unset the env respects USE_BROWSERBASE as-is.
  const bbRollout = parseInt(process.env.BROWSERBASE_ROLLOUT_PCT || "", 10);
  if (!isNaN(bbRollout) && bbRollout >= 0 && bbRollout <= 100) {
    const bucket = Array.from(session.userId).reduce((a, c) => (a + c.charCodeAt(0)) & 0xff, 0) % 100;
    const useBB = bucket < bbRollout;
    process.env.USE_BROWSERBASE = useBB ? "true" : "false";
    log(session.id, "info", `Browserbase rollout: ${useBB ? "ENABLED" : "disabled"} (bucket=${bucket} threshold=${bbRollout})`, { userId: session.userId });
  }

  log(session.id, "info", `Processing session for role: ${session.targetRole}`, { userId: session.userId });

  // Fetch user profile
  const userResult = await db.execute({
    sql: `SELECT firstName, lastName, email, applicationEmail, phone, preferredName, pronouns, usState, workAuthorized, needsSponsorship, countryOfResidence, willingToRelocate, remotePreference, monthlyAppCount, subscriptionTier, linkedinUrl, githubUrl, websiteUrl, currentEmployer, currentTitle, school, degree, graduationYear, additionalCerts, city, yearsOfExperience, salaryExpectation, earliestStartDate, gender, race, hispanicOrLatino, veteranStatus, disabilityStatus, applicationAnswers FROM User WHERE id = ?`,
    args: [session.userId],
  });

  if (!userResult.rows || userResult.rows.length === 0) {
    await markSessionFailed(session.id, "User not found");
    return true;
  }

  const user = userResult.rows[0] as unknown as UserProfile;
  const companies: string[] = JSON.parse(session.companies);

  // Defense-in-depth: provision applicationEmail if missing. The API routes
  // call ensureApplicationEmail() but sessions queued by other paths (direct
  // DB inserts, scripts, legacy flows) skip provisioning. Without an
  // application email, ATS verification emails go to the user's real inbox
  // (which our SendGrid Inbound Parse webhook can't read) and verification-
  // gated applies silently fail.
  if (!user.applicationEmail) {
    user.applicationEmail = await ensureApplicationEmailOnUser(session.userId);
    log(session.id, "info", `Provisioned applicationEmail: ${user.applicationEmail}`);
  }

  // Preflight: bail out before Playwright / resume download if Anthropic
  // credits are exhausted. This is the single most harmful silent-failure mode
  // (we've had 268 apply attempts eaten by it across 3 outages).
  const creditCheck = await checkAnthropicCredits();
  if (!creditCheck.ok) {
    log(session.id, "error", `Anthropic credits exhausted — pausing session`, { error: creditCheck.error });
    await markSessionPaused(session.id, "paused: Anthropic credits exhausted — no application attempts made");
    await postCreditAlert({ sessionId: session.id, userId: session.userId, rawError: creditCheck.error });
    return true;
  }

  // Download resume once for the whole session
  let resumePath: string | null = null;
  try {
    resumePath = join(tmpdir(), `resume-${Date.now()}.pdf`);
    const res = await fetch(session.resumeUrl);
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(resumePath, buffer);
  } catch (err) {
    await markSessionFailed(session.id, "Failed to download resume");
    return true;
  }

  // FAST PATH: If matchedJobs is set, skip discovery entirely — apply directly
  if (session.matchedJobs) {
    const jobs: Array<{ title: string; applyUrl: string; company: string; matchScore?: number; matchReason?: string }> = JSON.parse(session.matchedJobs);
    log(session.id, "info", `Fast path: ${jobs.length} pre-matched jobs`);
    let successCount = 0;
    // Discoveries that failed with verification-timeout get one retry at the
    // end of the session. Verification-timeout means the second submit was
    // never clicked, so no application was actually submitted at the ATS —
    // safe to retry without risking a duplicate.
    const verificationRetryQueue: typeof jobs = [];

    await db.execute({
      sql: `UPDATE BrowseSession SET jobsFound = ? WHERE id = ?`,
      args: [jobs.length, session.id],
    });

    for (const job of jobs) {
      // Dedup
      const dedupCheck = await db.execute({
        sql: `SELECT 1 FROM BrowseDiscovery WHERE sessionId IN (SELECT id FROM BrowseSession WHERE userId = ?) AND applyUrl = ? AND status IN ('applied', 'applying') LIMIT 1`,
        args: [session.userId, job.applyUrl],
      });
      if (dedupCheck.rows && dedupCheck.rows.length > 0) continue;

      // Company cooldown — skip (don't fail) jobs at companies that recently
      // flagged us as spam. Doesn't charge user quota.
      const slug = companyKey(job.company);
      const cooldownReason = await getCompanyCooldown(slug);
      if (cooldownReason) {
        await createDiscovery(session.id, job.company, job.title, job.applyUrl, "skipped", `[skipped — company on cooldown] ${cooldownReason}`, job.matchScore, job.matchReason);
        log(session.id, "info", `Cooldown skip: ${job.company} — ${cooldownReason.slice(0, 80)}`);
        continue;
      }

      // Daily cap
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const dailyCountResult = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM BrowseDiscovery d JOIN BrowseSession s ON d.sessionId = s.id WHERE s.userId = ? AND d.status = 'applied' AND d.createdAt >= ?`,
        args: [session.userId, todayStart.toISOString()],
      });
      const dailyCount = (dailyCountResult.rows?.[0] as unknown as { cnt: number })?.cnt || 0;
      if (dailyCount >= DAILY_APP_CAP) {
        log(session.id, "info", `Daily cap reached (${DAILY_APP_CAP}), stopping`);
        break;
      }

      // Monthly quota + free-tier sunset wall + trial guardrail
      const quotaCheck = await db.execute({
        sql: `SELECT monthlyAppCount, subscriptionTier, subscriptionStatus, freeTierEndsAt FROM User WHERE id = ?`,
        args: [session.userId],
      });
      const currentUser = quotaCheck.rows?.[0] as unknown as { monthlyAppCount: number; subscriptionTier: string; subscriptionStatus: string; freeTierEndsAt: string | null } | undefined;
      if (
        currentUser &&
        currentUser.subscriptionTier === "free" &&
        currentUser.freeTierEndsAt &&
        new Date(currentUser.freeTierEndsAt) <= new Date()
      ) {
        log(session.id, "info", `Free tier ended (freeTierEndsAt=${currentUser.freeTierEndsAt}), stopping. User must start trial.`);
        break;
      }
      // Trial cap: max 5 apps during the 7-day Stripe trial (matches legacy
      // free tier). After status flips from "trialing" to "active" the full
      // Starter cap unlocks.
      if (currentUser && currentUser.subscriptionStatus === "trialing" && currentUser.monthlyAppCount >= 5) {
        log(session.id, "info", `Trial cap reached (${currentUser.monthlyAppCount}/5), stopping. User is still trialing.`);
        break;
      }
      const tierLimits: Record<string, number> = { free: 5, starter: 100, pro: 300 };
      const limit = tierLimits[currentUser?.subscriptionTier || "free"] || 5;
      if (currentUser && currentUser.monthlyAppCount >= limit) {
        log(session.id, "info", `Monthly limit reached (${currentUser.monthlyAppCount}/${limit}), stopping`);
        break;
      }

      // Record & apply
      await createDiscovery(session.id, job.company, job.title, job.applyUrl, "applying", null, job.matchScore, job.matchReason);
      log(session.id, "info", `Applying: ${job.title} @ ${job.company}`);
      await heartbeat(session.id);

      const applyResult = await applyToJob(
        job.applyUrl,
        {
          firstName: user.firstName, lastName: user.lastName,
          email: user.applicationEmail || user.email, phone: user.phone,
          preferredName: user.preferredName || undefined, pronouns: user.pronouns || undefined,
          usState: user.usState || undefined, workAuthorized: user.workAuthorized === 1,
          needsSponsorship: user.needsSponsorship === 1, countryOfResidence: user.countryOfResidence || undefined,
          willingToRelocate: user.willingToRelocate === 1, remotePreference: user.remotePreference || undefined,
          linkedinUrl: user.linkedinUrl || undefined, githubUrl: user.githubUrl || undefined,
          websiteUrl: user.websiteUrl || undefined, currentEmployer: user.currentEmployer || undefined,
          currentTitle: user.currentTitle || undefined, school: user.school || undefined,
          degree: user.degree || undefined, graduationYear: user.graduationYear || undefined,
          additionalCerts: user.additionalCerts || undefined, city: user.city || undefined,
          yearsOfExperience: user.yearsOfExperience || undefined, salaryExpectation: user.salaryExpectation || undefined,
          earliestStartDate: user.earliestStartDate || undefined, gender: user.gender || undefined,
          race: user.race || undefined, hispanicOrLatino: user.hispanicOrLatino || undefined,
          veteranStatus: user.veteranStatus || undefined, disabilityStatus: user.disabilityStatus || undefined,
          applicationAnswers: user.applicationAnswers || undefined, targetCompany: job.company,
        },
        session.resumeUrl, session.resumeName, session.targetRole,
        user.subscriptionTier as string | undefined, job.title, session.userId
      );

      // Log tailor-related steps regardless of success
      if (applyResult.steps) {
        const tailorSteps = applyResult.steps.filter(s => s.toLowerCase().includes("tailor") || s.toLowerCase().includes("resume"));
        if (tailorSteps.length > 0) {
          log(session.id, "info", `Tailor steps: ${tailorSteps.join(" | ")}`);
        }
      }

      if (applyResult.success) {
        successCount++;
        await updateDiscoveryStatus(session.id, job.applyUrl, "applied", null);
        if (applyResult.tailored) {
          await db.execute({ sql: `UPDATE BrowseDiscovery SET resumeTailored = 1, tailoredResumeUrl = ? WHERE sessionId = ? AND applyUrl = ?`, args: [applyResult.tailoredResumeUrl || null, session.id, job.applyUrl] });
          // Only count against quota after successful tailored apply
          const { incrementTailorQuota } = await import("./tailor-resume");
          await incrementTailorQuota(session.userId);
        }
        await db.execute({ sql: `UPDATE BrowseSession SET jobsApplied = jobsApplied + 1 WHERE id = ?`, args: [session.id] });
        await db.execute({ sql: `UPDATE User SET monthlyAppCount = monthlyAppCount + 1 WHERE id = ?`, args: [session.userId] });
        log(session.id, "info", `Applied (${successCount}${applyResult.tailored ? ", tailored" : ""}): ${job.title} @ ${job.company}`);
      } else if (isCreditExhaustionError(applyResult.error)) {
        // Defense in depth: credits ran out mid-session after the preflight passed.
        // Don't charge the user, don't fail the discovery, pause the session, alert.
        await updateDiscoveryStatus(session.id, job.applyUrl, "skipped", "[skipped — Anthropic credits exhausted mid-session]");
        log(session.id, "error", `Anthropic credits exhausted mid-session — pausing`, { error: applyResult.error });
        await postCreditAlert({ sessionId: session.id, userId: session.userId, rawError: applyResult.error || "credit balance too low" });
        await markSessionPaused(session.id, "paused: Anthropic credits exhausted mid-session");
        if (resumePath) { try { unlinkSync(resumePath); } catch {} }
        return true;
      } else if (isSpamFlagError(applyResult.error)) {
        // Ashby/Greenhouse anti-bot flagged us. Mark the discovery as
        // "skipped" (don't show as red failure to user, don't charge quota),
        // and put the company on a 24h cooldown so other queued jobs at the
        // same company are short-circuited too.
        const slug = companyKey(job.company);
        await setCompanyCooldown(slug, `Spam-flag at ${job.company}`, 24);
        await updateDiscoveryStatus(session.id, job.applyUrl, "skipped", `[skipped — anti-bot flag] ${applyResult.error}`);
        await logStuckField({
          discoveryId: session.id, // closest available; per-discovery id not exposed here
          company: job.company,
          fieldLabel: "(submission blocked)",
          fieldRole: "submit",
          failureType: "spam-flag",
          pageUrl: job.applyUrl,
        }).catch(() => {});
        log(session.id, "warn", `Spam flag at ${job.company} — 24h cooldown applied, skipping`);
      } else {
        const errorWithSteps = applyResult.steps
          ? `${applyResult.error} | Steps: ${applyResult.steps.slice(-8).join(" → ")}`
          : applyResult.error || "Unknown error";
        log(session.id, "warn", `Failed, trying next: ${job.title} — ${applyResult.error}`);
        await updateDiscoveryStatus(session.id, job.applyUrl, "failed", errorWithSteps);
        await db.execute({ sql: `UPDATE BrowseSession SET jobsFailed = jobsFailed + 1 WHERE id = ?`, args: [session.id] });
        // Telemetry: log a categorized stuck-field row for later triage
        const category = /could not open dropdown/i.test(applyResult.error || "") ? "could-not-open-dropdown"
          : /reached max steps/i.test(applyResult.error || "") ? "max-steps"
          : /stuck.*page state/i.test(applyResult.error || "") ? "stuck-page"
          : /timed out/i.test(applyResult.error || "") ? "timeout"
          : "other";
        await logStuckField({
          discoveryId: session.id,
          company: job.company,
          fieldLabel: (applyResult.error || "").slice(0, 200),
          fieldRole: "unknown",
          failureType: category,
          pageUrl: job.applyUrl,
        }).catch(() => {});
        log(session.id, "warn", `Failed: ${job.title} — ${applyResult.error}`);

        // Queue verification-timeout failures for one retry at end of session.
        // Other failure modes (12-min app timeout, stuck-cascade, role mismatch)
        // are NOT retried — page state is unknown and a retry could cause a
        // duplicate apply.
        if (
          applyResult.error &&
          /Verification code not received within timeout/i.test(applyResult.error)
        ) {
          verificationRetryQueue.push(job);
        }
      }

      await heartbeat(session.id);
      await delay(DELAY_BETWEEN_JOBS_MS);
    }

    // One-shot retry for verification-timeout failures. By the time we reach
    // this loop, the original verification email may have arrived — a fresh
    // submit triggers a NEW email and a NEW chance to read it.
    if (verificationRetryQueue.length > 0) {
      log(session.id, "info", `Verification retry queue: ${verificationRetryQueue.length} jobs`);
      for (const job of verificationRetryQueue) {
        // Re-check quota before retry — user may have hit cap during the main loop
        const quotaCheck = await db.execute({
          sql: `SELECT monthlyAppCount, subscriptionTier, subscriptionStatus FROM User WHERE id = ?`,
          args: [session.userId],
        });
        const u = quotaCheck.rows?.[0] as unknown as { monthlyAppCount: number; subscriptionTier: string; subscriptionStatus: string } | undefined;
        if (u && u.subscriptionStatus === "trialing" && u.monthlyAppCount >= 5) {
          log(session.id, "info", `Skipping retry — trial cap reached (${u.monthlyAppCount}/5)`);
          break;
        }
        const tierLimits: Record<string, number> = { free: 5, starter: 100, pro: 300 };
        const limit = tierLimits[u?.subscriptionTier || "free"] || 5;
        if (u && u.monthlyAppCount >= limit) {
          log(session.id, "info", `Skipping retry — monthly limit reached (${u.monthlyAppCount}/${limit})`);
          break;
        }

        log(session.id, "info", `Retry (verification): ${job.title} @ ${job.company}`);
        await heartbeat(session.id);
        const retryResult = await applyToJob(
          job.applyUrl,
          {
            firstName: user.firstName, lastName: user.lastName,
            email: user.applicationEmail || user.email, phone: user.phone,
            preferredName: user.preferredName || undefined, pronouns: user.pronouns || undefined,
            usState: user.usState || undefined, workAuthorized: user.workAuthorized === 1,
            needsSponsorship: user.needsSponsorship === 1, countryOfResidence: user.countryOfResidence || undefined,
            willingToRelocate: user.willingToRelocate === 1, remotePreference: user.remotePreference || undefined,
            linkedinUrl: user.linkedinUrl || undefined, githubUrl: user.githubUrl || undefined,
            websiteUrl: user.websiteUrl || undefined, currentEmployer: user.currentEmployer || undefined,
            currentTitle: user.currentTitle || undefined, school: user.school || undefined,
            degree: user.degree || undefined, graduationYear: user.graduationYear || undefined,
            additionalCerts: user.additionalCerts || undefined, city: user.city || undefined,
            yearsOfExperience: user.yearsOfExperience || undefined, salaryExpectation: user.salaryExpectation || undefined,
            earliestStartDate: user.earliestStartDate || undefined, gender: user.gender || undefined,
            race: user.race || undefined, hispanicOrLatino: user.hispanicOrLatino || undefined,
            veteranStatus: user.veteranStatus || undefined, disabilityStatus: user.disabilityStatus || undefined,
            applicationAnswers: user.applicationAnswers || undefined, targetCompany: job.company,
          },
          session.resumeUrl, session.resumeName, session.targetRole,
          user.subscriptionTier as string | undefined, job.title, session.userId
        );

        if (retryResult.success) {
          successCount++;
          await updateDiscoveryStatus(session.id, job.applyUrl, "applied", null);
          if (retryResult.tailored) {
            await db.execute({ sql: `UPDATE BrowseDiscovery SET resumeTailored = 1, tailoredResumeUrl = ? WHERE sessionId = ? AND applyUrl = ?`, args: [retryResult.tailoredResumeUrl || null, session.id, job.applyUrl] });
            const { incrementTailorQuota } = await import("./tailor-resume");
            await incrementTailorQuota(session.userId);
          }
          // The original failure was already counted in jobsFailed — decrement
          // it and increment jobsApplied so the session counters reflect the
          // final state.
          await db.execute({ sql: `UPDATE BrowseSession SET jobsApplied = jobsApplied + 1, jobsFailed = jobsFailed - 1 WHERE id = ?`, args: [session.id] });
          await db.execute({ sql: `UPDATE User SET monthlyAppCount = monthlyAppCount + 1 WHERE id = ?`, args: [session.userId] });
          log(session.id, "info", `Retry succeeded: ${job.title} @ ${job.company}`);
        } else {
          const retryErrorWithSteps = retryResult.steps
            ? `[retry] ${retryResult.error} | Steps: ${retryResult.steps.slice(-8).join(" → ")}`
            : `[retry] ${retryResult.error || "Unknown error"}`;
          await updateDiscoveryStatus(session.id, job.applyUrl, "failed", retryErrorWithSteps);
          log(session.id, "warn", `Retry failed: ${job.title} — ${retryResult.error}`);
        }

        await heartbeat(session.id);
        await delay(DELAY_BETWEEN_JOBS_MS);
      }
    }

    // Clean up & complete
    if (resumePath) { try { unlinkSync(resumePath); } catch {} }
    await db.execute({
      sql: `UPDATE BrowseSession SET status = 'completed', completedAt = datetime('now') WHERE id = ?`,
      args: [session.id],
    });
    log(session.id, "info", "Fast path session completed");
    return true;
  }

  // LEGACY PATH: Discovery-based company iteration
  let limitReached = false;
  for (const companyName of companies) {
    // Stop early if monthly limit was already hit
    if (limitReached) {
      await appendProgressLog(session.id, {
        company: companyName,
        status: "skipped",
        found: 0,
        applied: 0,
        skipped: 0,
        failed: 0,
        error: "Monthly limit reached — stopping session",
      });
      await incrementCompanyDone(session.id);
      continue;
    }
    const careersUrl = companyUrlMap.get(companyName);
    if (!careersUrl) {
      await appendProgressLog(session.id, {
        company: companyName,
        status: "error",
        error: "No career page URL configured",
        found: 0,
        applied: 0,
      });
      await incrementCompanyDone(session.id);
      continue;
    }

    const companyResult = { found: 0, applied: 0, skipped: 0, failed: 0 };

    try {
      // Try catalog first (instant DB lookup), fall back to live scrape
      const companySlug = companySlugMap.get(companyName) || "";
      let discovered: import("./career-browser").DiscoveredJob[];
      let discoveryLog: import("./career-browser").DiscoveryLog;

      if (companySlug) {
        const catalogJobs = await discoverJobsFromCatalog(companySlug, session.targetRole);
        if (catalogJobs.length > 0) {
          discovered = catalogJobs;
          discoveryLog = { steps: [`Catalog: ${catalogJobs.length} jobs for ${companySlug}`] };
        } else {
          // Catalog empty — fall back to live scrape
          const live = await Promise.race([
            discoverJobs(careersUrl, session.targetRole),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Company timeout")), COMPANY_TIMEOUT_MS)
            ),
          ]);
          discovered = live.jobs;
          discoveryLog = live.log;
          discoveryLog.steps.unshift("Catalog empty, fell back to live scrape");
        }
      } else {
        // No slug — use live scrape (legacy path)
        const live = await Promise.race([
          discoverJobs(careersUrl, session.targetRole),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Company timeout")), COMPANY_TIMEOUT_MS)
          ),
        ]);
        discovered = live.jobs;
        discoveryLog = live.log;
      }

      companyResult.found = discovered.length;
      console.log(`[Browse] ${companyName}: found ${discovered.length} matching jobs`);
      for (const step of discoveryLog.steps) {
        console.log(`[Browse] ${companyName}: ${step}`);
      }

      // Update session counters
      await db.execute({
        sql: `UPDATE BrowseSession SET jobsFound = jobsFound + ? WHERE id = ?`,
        args: [discovered.length, session.id],
      });

      // Apply to each discovered job — track URLs we've already processed in this session
      const processedUrls = new Set<string>();

      for (const job of discovered) {
        // Dedup within this session's batch (career browser can return the same job twice)
        if (processedUrls.has(job.applyUrl)) {
          companyResult.skipped++;
          continue;
        }
        processedUrls.add(job.applyUrl);

        // Check if already applied to this URL in ANY previous session or current session
        const dedupCheck = await db.execute({
          sql: `SELECT 1 FROM BrowseDiscovery WHERE sessionId IN (SELECT id FROM BrowseSession WHERE userId = ?) AND applyUrl = ? AND status IN ('applied', 'applying') LIMIT 1`,
          args: [session.userId, job.applyUrl],
        });

        if (dedupCheck.rows && dedupCheck.rows.length > 0) {
          companyResult.skipped++;
          continue;
        }

        // Also check JobApplication table (cross-flow dedup with Greenhouse auto-apply)
        const jobAppCheck = await db.execute({
          sql: `SELECT 1 FROM JobApplication WHERE userId = ? AND status IN ('submitted', 'pending') AND jobId IN (SELECT id FROM Job WHERE applyUrl = ?) LIMIT 1`,
          args: [session.userId, job.applyUrl],
        });

        if (jobAppCheck.rows && jobAppCheck.rows.length > 0) {
          companyResult.skipped++;
          continue;
        }

        // Location filter — skip foreign jobs for US-based users
        if (isUserUS(user.countryOfResidence)) {
          const jobLoc = await db.execute({
            sql: "SELECT location, region FROM Job WHERE applyUrl = ? LIMIT 1",
            args: [job.applyUrl],
          });
          const loc = jobLoc.rows?.[0];
          if (loc) {
            const location = (loc.location as string || "").toLowerCase();
            const region = loc.region as string || "";
            if (region === "international" || isForeignLocation(location)) {
              companyResult.skipped++;
              await createDiscovery(session.id, companyName, job.title, job.applyUrl, "skipped", "Location mismatch (non-US)");
              console.log(`[Browse] Skipped ${job.title} — non-US location: ${loc.location}`);
              continue;
            }
          }
        }

        // Check daily cap (10 applications per day)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const dailyCountResult = await db.execute({
          sql: `SELECT COUNT(*) as cnt FROM BrowseDiscovery d
                JOIN BrowseSession s ON d.sessionId = s.id
                WHERE s.userId = ? AND d.status = 'applied' AND d.createdAt >= ?`,
          args: [session.userId, todayStart.toISOString()],
        });
        const dailyCount = (dailyCountResult.rows?.[0] as unknown as { cnt: number })?.cnt || 0;
        if (dailyCount >= DAILY_APP_CAP) {
          log(session.id, "info", `Daily cap reached (${DAILY_APP_CAP}), stopping`);
          break;
        }

        // Check monthly quota
        const quotaCheck = await db.execute({
          sql: `SELECT monthlyAppCount, subscriptionTier FROM User WHERE id = ?`,
          args: [session.userId],
        });
        const currentUser = quotaCheck.rows?.[0] as unknown as { monthlyAppCount: number; subscriptionTier: string } | undefined;
        const tierLimits: Record<string, number> = { free: 5, starter: 100, pro: 300 };
        const limit = tierLimits[currentUser?.subscriptionTier || "free"] || 5;
        if (currentUser && currentUser.monthlyAppCount >= limit) {
          companyResult.skipped++;
          await createDiscovery(session.id, companyName, job.title, job.applyUrl, "skipped", "Monthly limit reached");
          limitReached = true;
          console.log(`[Browse] Monthly limit reached (${currentUser.monthlyAppCount}/${limit}). Stopping session.`);
          break;
        }

        // Record discovery
        await createDiscovery(session.id, companyName, job.title, job.applyUrl, "applying", null);
        await heartbeat(session.id);

        // Apply
        const applyResult = await applyToJob(
          job.applyUrl,
          {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.applicationEmail || user.email,
            phone: user.phone,
            preferredName: user.preferredName || undefined,
            pronouns: user.pronouns || undefined,
            usState: user.usState || undefined,
            workAuthorized: user.workAuthorized === 1,
            needsSponsorship: user.needsSponsorship === 1,
            countryOfResidence: user.countryOfResidence || undefined,
            willingToRelocate: user.willingToRelocate === 1,
            remotePreference: user.remotePreference || undefined,
            linkedinUrl: user.linkedinUrl || undefined,
            githubUrl: user.githubUrl || undefined,
            websiteUrl: user.websiteUrl || undefined,
            currentEmployer: user.currentEmployer || undefined,
            currentTitle: user.currentTitle || undefined,
            school: user.school || undefined,
            degree: user.degree || undefined,
            graduationYear: user.graduationYear || undefined,
            additionalCerts: user.additionalCerts || undefined,
            city: user.city || undefined,
            yearsOfExperience: user.yearsOfExperience || undefined,
            salaryExpectation: user.salaryExpectation || undefined,
            earliestStartDate: user.earliestStartDate || undefined,
            gender: user.gender || undefined,
            race: user.race || undefined,
            hispanicOrLatino: user.hispanicOrLatino || undefined,
            veteranStatus: user.veteranStatus || undefined,
            disabilityStatus: user.disabilityStatus || undefined,
            applicationAnswers: user.applicationAnswers || undefined,
            targetCompany: companyName,
          },
          session.resumeUrl,
          session.resumeName,
          session.targetRole,
          user.subscriptionTier as string | undefined,
          job.title,
          session.userId
        );

        // Log the apply steps if available
        if (applyResult.steps) {
          for (const s of applyResult.steps) {
            console.log(`[Apply] ${job.title}: ${s}`);
          }
        }

        if (applyResult.success) {
          companyResult.applied++;
          await updateDiscoveryStatus(session.id, job.applyUrl, "applied", null);
          if (applyResult.tailored) {
            await db.execute({ sql: `UPDATE BrowseDiscovery SET resumeTailored = 1, tailoredResumeUrl = ? WHERE sessionId = ? AND applyUrl = ?`, args: [applyResult.tailoredResumeUrl || null, session.id, job.applyUrl] });
            const { incrementTailorQuota } = await import("./tailor-resume");
            await incrementTailorQuota(session.userId);
          }
          await db.execute({
            sql: `UPDATE BrowseSession SET jobsApplied = jobsApplied + 1 WHERE id = ?`,
            args: [session.id],
          });
          await db.execute({
            sql: `UPDATE User SET monthlyAppCount = monthlyAppCount + 1 WHERE id = ?`,
            args: [session.userId],
          });
        } else {
          companyResult.failed++;
          const errorWithSteps = applyResult.steps
            ? `${applyResult.error} | Steps: ${applyResult.steps.slice(-3).join(" → ")}`
            : applyResult.error || "Unknown error";
          await updateDiscoveryStatus(session.id, job.applyUrl, "failed", errorWithSteps);
          await db.execute({
            sql: `UPDATE BrowseSession SET jobsFailed = jobsFailed + 1 WHERE id = ?`,
            args: [session.id],
          });
        }

        // Delay between applications
        await heartbeat(session.id);
        await delay(DELAY_BETWEEN_JOBS_MS);
      }

      await appendProgressLog(session.id, {
        company: companyName,
        status: "done",
        found: companyResult.found,
        applied: companyResult.applied,
        skipped: companyResult.skipped,
        failed: companyResult.failed,
        debugLog: discoveryLog.steps,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[Browse] Error browsing ${companyName}:`, errMsg);
      await appendProgressLog(session.id, {
        company: companyName,
        status: "error",
        error: errMsg,
        found: companyResult.found,
        applied: companyResult.applied,
      });
    }

    await incrementCompanyDone(session.id);

    // Delay between companies
    if (companies.indexOf(companyName) < companies.length - 1) {
      await delay(DELAY_BETWEEN_COMPANIES_MS);
    }
  }

  // Clean up resume
  if (resumePath) {
    try { unlinkSync(resumePath); } catch {}
  }

  // Mark session completed
  await db.execute({
    sql: `UPDATE BrowseSession SET status = 'completed', completedAt = datetime('now') WHERE id = ?`,
    args: [session.id],
  });

  console.log(`[Browse] Session ${session.id} completed`);
  return true;
}

async function markSessionFailed(sessionId: string, error: string) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE BrowseSession SET status = 'failed', errorMessage = ?, completedAt = datetime('now') WHERE id = ?`,
    args: [error, sessionId],
  });
  const userId = await getSessionUserId(sessionId);
  await logWorkerError({
    kind: "browse-session:failed",
    userId,
    sessionId,
    message: error,
  });
}

async function markSessionPaused(sessionId: string, error: string) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE BrowseSession SET status = 'paused', errorMessage = ?, completedAt = datetime('now') WHERE id = ?`,
    args: [error, sessionId],
  });
  const userId = await getSessionUserId(sessionId);
  await logWorkerError({
    kind: "browse-session:paused",
    userId,
    sessionId,
    message: error,
  });
}

async function incrementCompanyDone(sessionId: string) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE BrowseSession SET companiesDone = companiesDone + 1 WHERE id = ?`,
    args: [sessionId],
  });
}

async function appendProgressLog(
  sessionId: string,
  entry: Record<string, unknown>
) {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT progressLog FROM BrowseSession WHERE id = ?`,
    args: [sessionId],
  });
  const current = JSON.parse(
    (result.rows?.[0] as unknown as { progressLog: string })?.progressLog || "[]"
  );
  current.push(entry);
  await db.execute({
    sql: `UPDATE BrowseSession SET progressLog = ? WHERE id = ?`,
    args: [JSON.stringify(current), sessionId],
  });
}

async function createDiscovery(
  sessionId: string,
  company: string,
  jobTitle: string,
  applyUrl: string,
  status: string,
  errorMessage: string | null,
  matchScore?: number | null,
  matchReason?: string | null
) {
  const db = getDb();
  const id = `disc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.execute({
    sql: `INSERT OR IGNORE INTO BrowseDiscovery (id, sessionId, company, jobTitle, applyUrl, status, errorMessage, matchScore, matchReason, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [id, sessionId, company, jobTitle, applyUrl, status, errorMessage, matchScore ?? null, matchReason ?? null],
  });
  if (status === "failed" && errorMessage) {
    const userId = await getSessionUserId(sessionId);
    await logWorkerError({
      kind: "browse-discovery:failed",
      userId,
      sessionId,
      applyUrl,
      company,
      jobTitle,
      message: errorMessage,
    });
  }
}

async function updateDiscoveryStatus(
  sessionId: string,
  applyUrl: string,
  status: string,
  errorMessage: string | null
) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE BrowseDiscovery SET status = ?, errorMessage = ? WHERE sessionId = ? AND applyUrl = ?`,
    args: [status, errorMessage, sessionId, applyUrl],
  });
  // Log only real failures and anti-bot skips. Routine skips (cap, location,
  // cooldown) are operator noise, not errors.
  if (errorMessage && (status === "failed" || /\[skipped — anti-bot|\[skipped — Anthropic/i.test(errorMessage))) {
    const userId = await getSessionUserId(sessionId);
    let company: string | null = null;
    let jobTitle: string | null = null;
    try {
      const r = await db.execute({
        sql: `SELECT company, jobTitle FROM BrowseDiscovery WHERE sessionId = ? AND applyUrl = ? LIMIT 1`,
        args: [sessionId, applyUrl],
      });
      const row = r.rows?.[0] as unknown as { company?: string; jobTitle?: string } | undefined;
      company = row?.company ?? null;
      jobTitle = row?.jobTitle ?? null;
    } catch {}
    await logWorkerError({
      kind: status === "failed" ? "browse-discovery:failed" : "browse-discovery:skipped",
      userId,
      sessionId,
      applyUrl,
      company,
      jobTitle,
      message: errorMessage,
    });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const NON_US_INDICATORS = [
  "india", "ireland", "uk", "united kingdom", "england", "germany", "france",
  "japan", "singapore", "australia", "brazil", "canada", "italy", "spain",
  "netherlands", "sweden", "denmark", "norway", "finland", "poland", "czech",
  "israel", "korea", "china", "hong kong", "taiwan", "mexico", "argentina",
  "colombia", "chile", "peru", "bangalore", "bengaluru", "hyderabad", "mumbai",
  "pune", "delhi", "chennai", "london", "berlin", "paris", "tokyo", "sydney",
  "melbourne", "toronto", "vancouver", "montreal", "dublin", "amsterdam",
  "são paulo", "sao paulo", "tel aviv", "seoul", "shanghai", "beijing",
  "krakow", "warsaw", "stockholm", "copenhagen", "oslo", "helsinki",
  "zurich", "geneva", "munich", "hamburg", "barcelona", "madrid", "lisbon",
  "milan", "rome", "vienna", "brussels", "prague",
];

function isUserUS(country: string | null | undefined): boolean {
  if (!country) return true; // default to US if unset
  const c = country.toLowerCase();
  return c.includes("us") || c.includes("united states") || c.includes("america");
}

function isForeignLocation(location: string): boolean {
  return NON_US_INDICATORS.some((ind) => location.includes(ind));
}
