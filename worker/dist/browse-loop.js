"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNextBrowseSession = processNextBrowseSession;
exports.processBrowseSessionById = processBrowseSessionById;
const db_1 = require("./db");
const career_browser_1 = require("./career-browser");
const apply_engine_1 = require("./apply-engine");
const alerts_1 = require("./alerts");
const error_log_1 = require("./error-log");
const period_1 = require("./period");
const planning_helpers_1 = require("./planning-helpers");
async function getSessionUserId(sessionId) {
    try {
        const r = await (0, db_1.getDb)().execute({
            sql: `SELECT userId FROM BrowseSession WHERE id = ?`,
            args: [sessionId],
        });
        return r.rows?.[0]?.userId ?? null;
    }
    catch {
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
async function heartbeat(sessionId) {
    try {
        // ISO 8601 — Prisma 6's libsql adapter rejects SQLite's default
        // "YYYY-MM-DD HH:MM:SS" format on DateTime fields with P2023, breaking
        // /admin/auto-apply when it reads BrowseSession via findMany().
        await (0, db_1.getDb)().execute({
            sql: `UPDATE BrowseSession SET lastHeartbeatAt = ? WHERE id = ?`,
            args: [new Date().toISOString(), sessionId],
        });
    }
    catch { }
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
async function ensureApplicationEmailOnUser(userId) {
    const db = (0, db_1.getDb)();
    const shortId = userId.slice(0, 8);
    const candidate = `u-${shortId}@${APPLICATION_EMAIL_DOMAIN}`;
    try {
        await db.execute({
            sql: `UPDATE User SET applicationEmail = ? WHERE id = ?`,
            args: [candidate, userId],
        });
        return candidate;
    }
    catch {
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
function companyKey(company) {
    return company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function isSpamFlagError(msg) {
    if (!msg)
        return false;
    return /flagged as spam|spam by the platform/i.test(msg);
}
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const DELAY_BETWEEN_JOBS_MS = 5_000;
const DAILY_APP_CAP = 30;
function log(sessionId, level, msg, meta) {
    console.log(JSON.stringify({ ts: new Date().toISOString(), sessionId, level, msg, ...meta }));
}
function assertClaimedSession(session) {
    if (!session) {
        throw new Error("Browse session must be claimed before processing");
    }
}
async function runSessionWatchdog() {
    const db = (0, db_1.getDb)();
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
                const sessionId = row.id;
                const userId = row.userId ?? null;
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
                }
                catch { }
                console.log(JSON.stringify({ ts: new Date().toISOString(), level: "warn", msg: "Reset stuck session", sessionId }));
                await (0, error_log_1.logWorkerError)({
                    kind: "browse-session:timeout",
                    userId,
                    sessionId,
                    message: "Session watchdog reset (stale heartbeat or absolute cap)",
                });
            }
        }
    }
    catch { }
}
async function claimNextQueuedSession() {
    const db = (0, db_1.getDb)();
    // Claim next queued session with compare-and-swap to prevent race conditions
    // across multiple worker replicas. Step 1: read a candidate. Step 2: UPDATE
    // only if it's still 'queued' (another replica may have claimed it between
    // the two queries). Retry up to 3 times in case of contention.
    let session = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        const candidate = await db.execute({
            sql: `SELECT id FROM BrowseSession WHERE status = 'queued' ORDER BY createdAt ASC LIMIT 1`,
            args: [],
        });
        if (!candidate.rows || candidate.rows.length === 0)
            break;
        const candidateId = candidate.rows[0].id;
        const claimed = await db.execute({
            sql: `UPDATE BrowseSession SET status = 'processing',
            startedAt = datetime('now'),
            lastHeartbeatAt = ?
            WHERE id = ? AND status = 'queued'
            RETURNING id, userId, targetRole, companies, matchedJobs, resumeUrl, resumeName, seekingInternship`,
            args: [new Date().toISOString(), candidateId],
        });
        if (claimed.rows && claimed.rows.length > 0) {
            session = claimed.rows[0];
            break;
        }
        // Another replica claimed it first — retry with next in queue
    }
    return session;
}
async function claimQueuedSessionById(sessionId) {
    const db = (0, db_1.getDb)();
    const claimed = await db.execute({
        sql: `UPDATE BrowseSession SET status = 'processing',
          startedAt = CASE WHEN startedAt IS NULL THEN datetime('now') ELSE startedAt END,
          lastHeartbeatAt = ?
          WHERE id = ? AND status = 'queued'
          RETURNING id, userId, targetRole, companies, matchedJobs, resumeUrl, resumeName, seekingInternship`,
        args: [new Date().toISOString(), sessionId],
    });
    if (!claimed.rows || claimed.rows.length === 0) {
        return null;
    }
    return claimed.rows[0];
}
async function processClaimedBrowseSession(session) {
    const db = (0, db_1.getDb)();
    assertClaimedSession(session);
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
    const user = userResult.rows[0];
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
    const creditCheck = await (0, apply_engine_1.checkAnthropicCredits)();
    if (!creditCheck.ok) {
        log(session.id, "error", `Anthropic credits exhausted — pausing session`, { error: creditCheck.error });
        await markSessionPaused(session.id, "paused: Anthropic credits exhausted — no application attempts made");
        await (0, alerts_1.postCreditAlert)({ sessionId: session.id, userId: session.userId, rawError: creditCheck.error });
        return true;
    }
    // Download resume once for the whole session.
    //
    // Validate aggressively: a 404 response body is still ~15 bytes of text
    // that fetch() does NOT throw on. Without these checks, the worker writes
    // that text to /tmp and Playwright uploads it as the user's "resume" to
    // every company in the session. That's how Kimberly's May 8 and May 9
    // sessions marked applications as "applied" while actually submitting
    // 15 bytes of garbage. See HANDOFF + the May 7 archive-layer postmortem.
    let resumePath = null;
    try {
        const res = await fetch(session.resumeUrl);
        if (!res.ok) {
            await markSessionFailed(session.id, `Resume URL returned ${res.status} — please re-upload at /profile`);
            return true;
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        // PDF magic bytes: every valid PDF starts with `%PDF-`. Catches 404 HTML
        // pages, 500 error bodies, and any non-PDF blob that snuck through.
        const head = buffer.subarray(0, 5).toString("latin1");
        if (head !== "%PDF-") {
            await markSessionFailed(session.id, `Resume bytes are not a valid PDF (got ${buffer.length} bytes starting with ${JSON.stringify(head)}) — please re-upload at /profile`);
            return true;
        }
        resumePath = (0, path_1.join)((0, os_1.tmpdir)(), `resume-${Date.now()}.pdf`);
        (0, fs_1.writeFileSync)(resumePath, buffer);
    }
    catch {
        await markSessionFailed(session.id, "Failed to download resume");
        return true;
    }
    const plannedJobsResult = await db.execute({
        sql: `SELECT id, company, jobTitle, applyUrl, matchScore, matchReason, customWritingFinal, planPayload
          FROM BrowseDiscovery
          WHERE sessionId = ?
            AND graphStatus = 'ready_to_submit'
            AND status IN ('found', 'pending', 'queued')
          ORDER BY COALESCE(confidenceScore, 0) DESC, createdAt ASC`,
        args: [session.id],
    });
    const plannedJobs = (plannedJobsResult.rows || []).map((row) => (0, planning_helpers_1.mapPlannedDiscoveryRow)(row));
    // Execution is now graph-gated: the worker only consumes discoveries that
    // the planning graph explicitly moved into ready_to_submit.
    if (plannedJobs.length > 0) {
        const jobs = plannedJobs;
        log(session.id, "info", `Planned execution path: ${jobs.length} graph-approved jobs`);
        let successCount = 0;
        // Discoveries that failed with verification-timeout get one retry at the
        // end of the session. Verification-timeout means the second submit was
        // never clicked, so no application was actually submitted at the ATS —
        // safe to retry without risking a duplicate.
        const verificationRetryQueue = [];
        let quotaBlocked = false;
        await db.execute({
            sql: `UPDATE BrowseSession SET jobsFound = ? WHERE id = ?`,
            args: [jobs.length, session.id],
        });
        for (const job of jobs) {
            // Dedup
            const dedupCheck = await db.execute({
                sql: `SELECT 1 FROM BrowseDiscovery WHERE sessionId IN (SELECT id FROM BrowseSession WHERE userId = ?) AND applyUrl = ? AND status IN ('applied', 'applying', 'failed') LIMIT 1`,
                args: [session.userId, job.applyUrl],
            });
            if (dedupCheck.rows && dedupCheck.rows.length > 0)
                continue;
            // Company cooldown — skip (don't fail) jobs at companies that recently
            // flagged us as spam. Doesn't charge user quota.
            const slug = companyKey(job.company);
            const cooldownReason = await (0, db_1.getCompanyCooldown)(slug);
            if (cooldownReason) {
                if (job.discoveryId) {
                    await updateDiscoveryStatus(session.id, job.applyUrl, "skipped", `[skipped — company on cooldown] ${cooldownReason}`, "skipped");
                }
                else {
                    await createDiscovery(session.id, job.company, job.title, job.applyUrl, "skipped", `[skipped — company on cooldown] ${cooldownReason}`, job.matchScore, job.matchReason);
                }
                log(session.id, "info", `Cooldown skip: ${job.company} — ${cooldownReason.slice(0, 80)}`);
                continue;
            }
            // Daily cap — createdAt is stored as "YYYY-MM-DD HH:MM:SS" (no T),
            // so wrap the param in datetime() to normalise the ISO string.
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const dailyCountResult = await db.execute({
                sql: `SELECT COUNT(*) as cnt FROM BrowseDiscovery d JOIN BrowseSession s ON d.sessionId = s.id WHERE s.userId = ? AND d.status = 'applied' AND d.createdAt >= datetime(?)`,
                args: [session.userId, todayStart.toISOString()],
            });
            const dailyCount = dailyCountResult.rows?.[0]?.cnt || 0;
            if (dailyCount >= DAILY_APP_CAP) {
                log(session.id, "info", `Daily cap reached (${DAILY_APP_CAP}), stopping`);
                quotaBlocked = true;
                break;
            }
            // Monthly quota + free-tier sunset wall + trial guardrail. Resets the
            // counter lazily if the user has crossed their subscription/signup
            // anniversary since the last reset.
            const currentUser = await (0, period_1.readQuotaWithLazyReset)(session.userId);
            // Payment-failed wall: mirror src/lib/subscription.ts canApply().
            // Stripe flipped the sub to past_due/unpaid after a failed charge;
            // do not consume paid resources until the invoice clears.
            if (currentUser &&
                (currentUser.subscriptionStatus === "past_due" ||
                    currentUser.subscriptionStatus === "unpaid")) {
                log(session.id, "info", `[payment-failed] subscription is ${currentUser.subscriptionStatus}, stopping. User must update payment method.`);
                quotaBlocked = true;
                break;
            }
            if (currentUser &&
                currentUser.subscriptionTier === "free" &&
                currentUser.freeTierEndsAt &&
                new Date(currentUser.freeTierEndsAt) <= new Date()) {
                log(session.id, "info", `Free tier ended (freeTierEndsAt=${currentUser.freeTierEndsAt}), stopping. User must start trial.`);
                quotaBlocked = true;
                break;
            }
            // Trial cap: max 5 apps during the 7-day Stripe trial (matches legacy
            // free tier). After status flips from "trialing" to "active" the full
            // Starter cap unlocks.
            if (currentUser && currentUser.subscriptionStatus === "trialing" && currentUser.monthlyAppCount >= 5) {
                log(session.id, "info", `Trial cap reached (${currentUser.monthlyAppCount}/5), stopping. User is still trialing.`);
                quotaBlocked = true;
                break;
            }
            const tierLimits = { free: 5, starter: 100, pro: 300 };
            const limit = tierLimits[currentUser?.subscriptionTier || "free"] || 5;
            if (currentUser && currentUser.monthlyAppCount >= limit) {
                log(session.id, "info", `Monthly limit reached (${currentUser.monthlyAppCount}/${limit}), stopping`);
                quotaBlocked = true;
                break;
            }
            // Record & apply
            if (job.discoveryId) {
                await updateDiscoveryStatus(session.id, job.applyUrl, "applying", null, "applying");
            }
            else {
                await createDiscovery(session.id, job.company, job.title, job.applyUrl, "applying", null, job.matchScore, job.matchReason);
            }
            log(session.id, "info", `Applying: ${job.title} @ ${job.company}`);
            await heartbeat(session.id);
            const applyResult = await (0, career_browser_1.applyToJob)(job.applyUrl, {
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
                applicationAnswers: user.applicationAnswers || undefined,
                customWritingText: job.customWritingText,
                reviewedAnswers: job.reviewedAnswers,
                targetCompany: job.company,
            }, session.resumeUrl, session.resumeName, session.targetRole, user.subscriptionTier, job.title, session.userId);
            // Log tailor-related steps regardless of success
            if (applyResult.steps) {
                const tailorSteps = applyResult.steps.filter(s => s.toLowerCase().includes("tailor") || s.toLowerCase().includes("resume"));
                if (tailorSteps.length > 0) {
                    log(session.id, "info", `Tailor steps: ${tailorSteps.join(" | ")}`);
                }
            }
            if (applyResult.success) {
                successCount++;
                await updateDiscoveryStatus(session.id, job.applyUrl, "applied", null, "applied");
                if (applyResult.tailored) {
                    await db.execute({ sql: `UPDATE BrowseDiscovery SET resumeTailored = 1, tailoredResumeUrl = ? WHERE sessionId = ? AND applyUrl = ?`, args: [applyResult.tailoredResumeUrl || null, session.id, job.applyUrl] });
                    // Only count against quota after successful tailored apply
                    const { incrementTailorQuota } = await Promise.resolve().then(() => __importStar(require("./tailor-resume")));
                    await incrementTailorQuota(session.userId);
                }
                await db.execute({ sql: `UPDATE BrowseSession SET jobsApplied = jobsApplied + 1 WHERE id = ?`, args: [session.id] });
                await db.execute({ sql: `UPDATE User SET monthlyAppCount = monthlyAppCount + 1 WHERE id = ?`, args: [session.userId] });
                log(session.id, "info", `Applied (${successCount}${applyResult.tailored ? ", tailored" : ""}): ${job.title} @ ${job.company}`);
            }
            else if ((0, apply_engine_1.isCreditExhaustionError)(applyResult.error)) {
                // Defense in depth: credits ran out mid-session after the preflight passed.
                // Don't charge the user, don't fail the discovery, pause the session, alert.
                await updateDiscoveryStatus(session.id, job.applyUrl, "skipped", "[skipped — Anthropic credits exhausted mid-session]", "skipped");
                log(session.id, "error", `Anthropic credits exhausted mid-session — pausing`, { error: applyResult.error });
                await (0, alerts_1.postCreditAlert)({ sessionId: session.id, userId: session.userId, rawError: applyResult.error || "credit balance too low" });
                await markSessionPaused(session.id, "paused: Anthropic credits exhausted mid-session");
                if (resumePath) {
                    try {
                        (0, fs_1.unlinkSync)(resumePath);
                    }
                    catch { }
                }
                return true;
            }
            else if (applyResult.error && /Review required:/i.test(applyResult.error)) {
                await updateDiscoveryStatus(session.id, job.applyUrl, "found", applyResult.error, "needs_review");
                if (job.discoveryId) {
                    await upsertRuntimeReviewTask({
                        discoveryId: job.discoveryId,
                        sessionId: session.id,
                        userId: session.userId,
                        company: job.company,
                        jobTitle: job.title,
                        reason: applyResult.error,
                        draft: job.customWritingText || null,
                    });
                }
                log(session.id, "info", `Review required: ${job.title} @ ${job.company}`);
            }
            else if (isSpamFlagError(applyResult.error)) {
                // Ashby/Greenhouse anti-bot flagged us. Mark the discovery as
                // "skipped" (don't show as red failure to user, don't charge quota),
                // and put the company on a 24h cooldown so other queued jobs at the
                // same company are short-circuited too.
                const slug = companyKey(job.company);
                await (0, db_1.setCompanyCooldown)(slug, `Spam-flag at ${job.company}`, 24);
                await updateDiscoveryStatus(session.id, job.applyUrl, "skipped", `[skipped — anti-bot flag] ${applyResult.error}`, "skipped");
                await (0, db_1.logStuckField)({
                    discoveryId: session.id, // closest available; per-discovery id not exposed here
                    company: job.company,
                    fieldLabel: "(submission blocked)",
                    fieldRole: "submit",
                    failureType: "spam-flag",
                    pageUrl: job.applyUrl,
                }).catch(() => { });
                log(session.id, "warn", `Spam flag at ${job.company} — 24h cooldown applied, skipping`);
            }
            else {
                const errorWithSteps = applyResult.steps
                    ? `${applyResult.error} | Steps: ${applyResult.steps.slice(-8).join(" → ")}`
                    : applyResult.error || "Unknown error";
                log(session.id, "warn", `Failed, trying next: ${job.title} — ${applyResult.error}`);
                await updateDiscoveryStatus(session.id, job.applyUrl, "failed", errorWithSteps, "failed");
                await db.execute({ sql: `UPDATE BrowseSession SET jobsFailed = jobsFailed + 1 WHERE id = ?`, args: [session.id] });
                // Telemetry: log a categorized stuck-field row for later triage
                const category = /could not open dropdown/i.test(applyResult.error || "") ? "could-not-open-dropdown"
                    : /reached max steps/i.test(applyResult.error || "") ? "max-steps"
                        : /stuck.*page state/i.test(applyResult.error || "") ? "stuck-page"
                            : /timed out/i.test(applyResult.error || "") ? "timeout"
                                : "other";
                await (0, db_1.logStuckField)({
                    discoveryId: session.id,
                    company: job.company,
                    fieldLabel: (applyResult.error || "").slice(0, 200),
                    fieldRole: "unknown",
                    failureType: category,
                    pageUrl: job.applyUrl,
                }).catch(() => { });
                log(session.id, "warn", `Failed: ${job.title} — ${applyResult.error}`);
                // Queue verification-timeout failures for one retry at end of session.
                // Other failure modes (12-min app timeout, stuck-cascade, role mismatch)
                // are NOT retried — page state is unknown and a retry could cause a
                // duplicate apply.
                if (applyResult.error &&
                    /Verification code not received within timeout/i.test(applyResult.error)) {
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
                const u = await (0, period_1.readQuotaWithLazyReset)(session.userId);
                if (u &&
                    (u.subscriptionStatus === "past_due" || u.subscriptionStatus === "unpaid")) {
                    log(session.id, "info", `Skipping retry — [payment-failed] subscription is ${u.subscriptionStatus}`);
                    quotaBlocked = true;
                    break;
                }
                if (u && u.subscriptionStatus === "trialing" && u.monthlyAppCount >= 5) {
                    log(session.id, "info", `Skipping retry — trial cap reached (${u.monthlyAppCount}/5)`);
                    quotaBlocked = true;
                    break;
                }
                const tierLimits = { free: 5, starter: 100, pro: 300 };
                const limit = tierLimits[u?.subscriptionTier || "free"] || 5;
                if (u && u.monthlyAppCount >= limit) {
                    log(session.id, "info", `Skipping retry — monthly limit reached (${u.monthlyAppCount}/${limit})`);
                    quotaBlocked = true;
                    break;
                }
                log(session.id, "info", `Retry (verification): ${job.title} @ ${job.company}`);
                await heartbeat(session.id);
                const retryResult = await (0, career_browser_1.applyToJob)(job.applyUrl, {
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
                    applicationAnswers: user.applicationAnswers || undefined,
                    customWritingText: job.customWritingText,
                    reviewedAnswers: job.reviewedAnswers,
                    targetCompany: job.company,
                }, session.resumeUrl, session.resumeName, session.targetRole, user.subscriptionTier, job.title, session.userId);
                if (retryResult.success) {
                    successCount++;
                    await updateDiscoveryStatus(session.id, job.applyUrl, "applied", null, "applied");
                    if (retryResult.tailored) {
                        await db.execute({ sql: `UPDATE BrowseDiscovery SET resumeTailored = 1, tailoredResumeUrl = ? WHERE sessionId = ? AND applyUrl = ?`, args: [retryResult.tailoredResumeUrl || null, session.id, job.applyUrl] });
                        const { incrementTailorQuota } = await Promise.resolve().then(() => __importStar(require("./tailor-resume")));
                        await incrementTailorQuota(session.userId);
                    }
                    // The original failure was already counted in jobsFailed — decrement
                    // it and increment jobsApplied so the session counters reflect the
                    // final state.
                    await db.execute({ sql: `UPDATE BrowseSession SET jobsApplied = jobsApplied + 1, jobsFailed = jobsFailed - 1 WHERE id = ?`, args: [session.id] });
                    await db.execute({ sql: `UPDATE User SET monthlyAppCount = monthlyAppCount + 1 WHERE id = ?`, args: [session.userId] });
                    log(session.id, "info", `Retry succeeded: ${job.title} @ ${job.company}`);
                }
                else {
                    const retryErrorWithSteps = retryResult.steps
                        ? `[retry] ${retryResult.error} | Steps: ${retryResult.steps.slice(-8).join(" → ")}`
                        : `[retry] ${retryResult.error || "Unknown error"}`;
                    await updateDiscoveryStatus(session.id, job.applyUrl, "failed", retryErrorWithSteps, "failed");
                    log(session.id, "warn", `Retry failed: ${job.title} — ${retryResult.error}`);
                }
                await heartbeat(session.id);
                await delay(DELAY_BETWEEN_JOBS_MS);
            }
        }
        // Clean up & complete
        if (resumePath) {
            try {
                (0, fs_1.unlinkSync)(resumePath);
            }
            catch { }
        }
        const pendingReviewCountResult = await db.execute({
            sql: `SELECT COUNT(*) as cnt FROM ReviewTask WHERE sessionId = ? AND status = 'pending'`,
            args: [session.id],
        });
        const readyToSubmitCountResult = await db.execute({
            sql: `SELECT COUNT(*) as cnt FROM BrowseDiscovery WHERE sessionId = ? AND graphStatus = 'ready_to_submit'`,
            args: [session.id],
        });
        const pendingReviewCount = pendingReviewCountResult.rows?.[0]?.cnt || 0;
        const readyToSubmitCount = readyToSubmitCountResult.rows?.[0]?.cnt || 0;
        const finalStatus = (0, planning_helpers_1.computePlannedSessionFinalStatus)({
            quotaBlocked,
            pendingReviewCount,
            readyToSubmitCount,
        });
        await db.execute({
            sql: `UPDATE BrowseSession SET status = ?, completedAt = CASE WHEN ? = 'completed' THEN datetime('now') ELSE NULL END WHERE id = ?`,
            args: [finalStatus, finalStatus, session.id],
        });
        log(session.id, "info", `Fast path session completed with status=${finalStatus}`);
        return true;
    }
    if (resumePath) {
        try {
            (0, fs_1.unlinkSync)(resumePath);
        }
        catch { }
    }
    await markSessionFailed(session.id, "Session has no graph-approved jobs ready to submit");
    log(session.id, "warn", "No ready_to_submit discoveries found; refusing legacy unplanned execution");
    return true;
}
/**
 * Poll for and process the next browse session.
 */
async function processNextBrowseSession() {
    await runSessionWatchdog();
    const session = await claimNextQueuedSession();
    if (!session) {
        return false;
    }
    return processClaimedBrowseSession(session);
}
async function processBrowseSessionById(sessionId) {
    await runSessionWatchdog();
    const session = await claimQueuedSessionById(sessionId);
    if (!session) {
        return false;
    }
    return processClaimedBrowseSession(session);
}
async function markSessionFailed(sessionId, error) {
    const db = (0, db_1.getDb)();
    await db.execute({
        sql: `UPDATE BrowseSession SET status = 'failed', errorMessage = ?, completedAt = datetime('now') WHERE id = ?`,
        args: [error, sessionId],
    });
    const userId = await getSessionUserId(sessionId);
    await (0, error_log_1.logWorkerError)({
        kind: "browse-session:failed",
        userId,
        sessionId,
        message: error,
    });
}
async function markSessionPaused(sessionId, error) {
    const db = (0, db_1.getDb)();
    await db.execute({
        sql: `UPDATE BrowseSession SET status = 'paused', errorMessage = ?, completedAt = datetime('now') WHERE id = ?`,
        args: [error, sessionId],
    });
    const userId = await getSessionUserId(sessionId);
    await (0, error_log_1.logWorkerError)({
        kind: "browse-session:paused",
        userId,
        sessionId,
        message: error,
    });
}
async function createDiscovery(sessionId, company, jobTitle, applyUrl, status, errorMessage, matchScore, matchReason) {
    const db = (0, db_1.getDb)();
    const id = `disc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.execute({
        sql: `INSERT OR IGNORE INTO BrowseDiscovery (id, sessionId, company, jobTitle, applyUrl, status, errorMessage, matchScore, matchReason, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [id, sessionId, company, jobTitle, applyUrl, status, errorMessage, matchScore ?? null, matchReason ?? null],
    });
    if (status === "failed" && errorMessage) {
        const userId = await getSessionUserId(sessionId);
        await (0, error_log_1.logWorkerError)({
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
async function updateDiscoveryStatus(sessionId, applyUrl, status, errorMessage, graphStatus) {
    const db = (0, db_1.getDb)();
    await db.execute({
        sql: `UPDATE BrowseDiscovery
          SET status = ?,
              errorMessage = ?,
              graphStatus = COALESCE(?, graphStatus),
              userActionRequired = CASE
                WHEN ? = 'needs_review' THEN 1
                WHEN ? IN ('skipped', 'applied', 'failed', 'ready_to_submit', 'applying') THEN 0
                ELSE userActionRequired
              END
          WHERE sessionId = ? AND applyUrl = ?`,
        args: [
            status,
            errorMessage,
            graphStatus ?? null,
            graphStatus ?? null,
            graphStatus ?? null,
            sessionId,
            applyUrl,
        ],
    });
    // Log only real failures and anti-bot skips. Routine skips (cap, location,
    // cooldown) are operator noise, not errors.
    if (errorMessage && (status === "failed" || /\[skipped — anti-bot|\[skipped — Anthropic/i.test(errorMessage))) {
        const userId = await getSessionUserId(sessionId);
        let company = null;
        let jobTitle = null;
        try {
            const r = await db.execute({
                sql: `SELECT company, jobTitle FROM BrowseDiscovery WHERE sessionId = ? AND applyUrl = ? LIMIT 1`,
                args: [sessionId, applyUrl],
            });
            const row = r.rows?.[0];
            company = row?.company ?? null;
            jobTitle = row?.jobTitle ?? null;
        }
        catch { }
        await (0, error_log_1.logWorkerError)({
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
async function upsertRuntimeReviewTask(params) {
    const db = (0, db_1.getDb)();
    const existing = await db.execute({
        sql: `SELECT id FROM ReviewTask WHERE discoveryId = ? LIMIT 1`,
        args: [params.discoveryId],
    });
    const planningRunRow = await db.execute({
        sql: `SELECT graphThreadId FROM BrowseDiscovery WHERE id = ? LIMIT 1`,
        args: [params.discoveryId],
    });
    const planningRunId = planningRunRow.rows?.[0]?.graphThreadId ?? null;
    if (existing.rows && existing.rows.length > 0) {
        await db.execute({
            sql: `UPDATE ReviewTask
            SET status = 'pending',
                type = 'custom_writing',
                title = ?,
                reason = ?,
                draft = ?,
                editedDraft = NULL,
                reviewerNotes = NULL,
                approvedAt = NULL,
                rejectedAt = NULL,
                reviewedAt = NULL,
                updatedAt = datetime('now')
            WHERE discoveryId = ?`,
            args: [
                `Review ${params.jobTitle} at ${params.company}`,
                params.reason,
                params.draft,
                params.discoveryId,
            ],
        });
    }
    else {
        const id = `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await db.execute({
            sql: `INSERT INTO ReviewTask (
              id, discoveryId, planningRunId, sessionId, userId, type, status,
              title, reason, draft, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, 'custom_writing', 'pending', ?, ?, ?, datetime('now'), datetime('now'))`,
            args: [
                id,
                params.discoveryId,
                planningRunId,
                params.sessionId,
                params.userId,
                `Review ${params.jobTitle} at ${params.company}`,
                params.reason,
                params.draft,
            ],
        });
    }
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
