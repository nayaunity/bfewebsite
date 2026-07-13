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
exports.getDb = getDb;
exports.pollQueue = pollQueue;
exports.markCompleted = markCompleted;
exports.markFailed = markFailed;
exports.recordApplication = recordApplication;
exports.incrementUserAppCount = incrementUserAppCount;
exports.getCompanyCooldown = getCompanyCooldown;
exports.setCompanyCooldown = setCompanyCooldown;
exports.logStuckField = logStuckField;
const client_1 = require("@libsql/client");
let client;
function getDb() {
    if (!client) {
        client = (0, client_1.createClient)({
            url: process.env.DATABASE_URL,
            authToken: process.env.DATABASE_AUTH_TOKEN,
        });
    }
    return client;
}
async function pollQueue() {
    const db = getDb();
    // Claim next queued item with compare-and-swap to prevent race conditions
    // across multiple worker replicas.
    let result = { rows: [] };
    for (let attempt = 0; attempt < 3; attempt++) {
        const candidate = await db.execute({
            sql: `SELECT id FROM ApplyQueue WHERE status = 'queued' ORDER BY priority DESC, createdAt ASC LIMIT 1`,
            args: [],
        });
        if (candidate.rows.length === 0)
            break;
        const candidateId = candidate.rows[0].id;
        result = await db.execute({
            sql: `UPDATE ApplyQueue SET status = 'processing', startedAt = datetime('now')
            WHERE id = ? AND status = 'queued'
            RETURNING id, userId, jobId, resumeUrl, resumeName, applicantData`,
            args: [candidateId],
        });
        if (result.rows.length > 0)
            break;
    }
    if (result.rows.length === 0)
        return null;
    const row = result.rows[0];
    const item = {
        id: row.id,
        userId: row.userId,
        jobId: row.jobId,
        resumeUrl: row.resumeUrl,
        resumeName: row.resumeName,
        applicantData: row.applicantData,
    };
    // Get job details
    const jobResult = await db.execute({
        sql: "SELECT company, companySlug, title, applyUrl FROM Job WHERE id = ?",
        args: [item.jobId],
    });
    if (jobResult.rows.length === 0) {
        await markFailed(item.id, "Job not found");
        return null;
    }
    const jobRow = jobResult.rows[0];
    return {
        ...item,
        job: {
            company: jobRow.company,
            companySlug: jobRow.companySlug,
            title: jobRow.title,
            applyUrl: jobRow.applyUrl,
        },
    };
}
async function markCompleted(queueId, note) {
    const db = getDb();
    await db.execute({
        sql: `UPDATE ApplyQueue SET status = 'completed', completedAt = datetime('now'), workerNote = ? WHERE id = ?`,
        args: [note || null, queueId],
    });
}
async function markFailed(queueId, error) {
    const db = getDb();
    await db.execute({
        sql: `UPDATE ApplyQueue SET status = 'failed', completedAt = datetime('now'), errorMessage = ? WHERE id = ?`,
        args: [error, queueId],
    });
    // Surface in /admin/errors. Look up the userId+jobId for cross-reference.
    try {
        const { logWorkerError } = await Promise.resolve().then(() => __importStar(require("./error-log")));
        const r = await db.execute({
            sql: `SELECT userId, jobId FROM ApplyQueue WHERE id = ?`,
            args: [queueId],
        });
        const row = r.rows?.[0];
        await logWorkerError({
            kind: "apply-queue:failed",
            userId: row?.userId ?? null,
            jobId: row?.jobId ?? null,
            message: error,
        });
    }
    catch { }
}
async function recordApplication(userId, jobId, company, companySlug, jobTitle, status, error) {
    const db = getDb();
    const id = `cuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.execute({
        sql: `INSERT OR IGNORE INTO JobApplication (id, userId, jobId, externalJobId, company, companySlug, boardToken, jobTitle, status, errorMessage, submittedAt, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, 'browser', ?, ?, ?, ?, datetime('now'))`,
        args: [
            id,
            userId,
            jobId,
            `worker-${jobId}`,
            company,
            companySlug,
            jobTitle,
            status,
            error || null,
            status === "submitted" ? new Date().toISOString() : null,
        ],
    });
}
async function incrementUserAppCount(userId) {
    const db = getDb();
    await db.execute({
        sql: "UPDATE User SET monthlyAppCount = monthlyAppCount + 1 WHERE id = ?",
        args: [userId],
    });
}
/**
 * Returns reason string if the company is currently in cooldown (don't apply),
 * or null if it's safe to attempt.
 */
async function getCompanyCooldown(companySlug) {
    if (!companySlug)
        return null;
    const db = getDb();
    const res = await db.execute({
        sql: `SELECT reason, cooldownUntil FROM CompanyCooldown WHERE companySlug = ? AND cooldownUntil > datetime('now') LIMIT 1`,
        args: [companySlug],
    });
    if (res.rows.length === 0)
        return null;
    const row = res.rows[0];
    return `${row.reason} (until ${row.cooldownUntil})`;
}
/**
 * Set or extend a 24h cooldown for a company (e.g. after a spam flag).
 */
async function setCompanyCooldown(companySlug, reason, hours = 24) {
    if (!companySlug)
        return;
    const db = getDb();
    const id = `cuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const cooldownUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    await db.execute({
        sql: `INSERT INTO CompanyCooldown (id, companySlug, reason, cooldownUntil, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(companySlug) DO UPDATE SET reason = excluded.reason, cooldownUntil = excluded.cooldownUntil, updatedAt = datetime('now')`,
        args: [id, companySlug, reason, cooldownUntil],
    });
}
/**
 * Log a stuck-field event for later analysis. Free-form failureType:
 * "could-not-open-dropdown" | "stuck-page" | "max-steps" | "spam-flag" | etc.
 */
async function logStuckField(params) {
    const db = getDb();
    const id = `cuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.execute({
        sql: `INSERT INTO StuckField (id, discoveryId, company, fieldLabel, fieldRole, failureType, attemptCount, pageUrl, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
            id,
            params.discoveryId || null,
            params.company.slice(0, 200),
            params.fieldLabel.slice(0, 500),
            params.fieldRole.slice(0, 50),
            params.failureType.slice(0, 100),
            params.attemptCount ?? 1,
            params.pageUrl.slice(0, 1000),
        ],
    });
}
