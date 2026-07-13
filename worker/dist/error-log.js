"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWorkerError = logWorkerError;
const db_1 = require("./db");
// Mirrors a worker-side error into the ErrorLog table so it surfaces in
// /admin/errors alongside HTTP errors. Raw text is preserved here for
// operators — never render this content to users.
//
// Reuses the existing ErrorLog schema with a synthetic endpoint string
// (worker:<kind>) so the existing dashboard "Errors by Endpoint" grouping
// works without schema changes. method=WORKER discriminates from HTTP rows.
//
// Failures here MUST NOT throw — error-logging must never break the worker
// loop. Swallow and console.warn so a Turso outage doesn't cascade.
async function logWorkerError(args) {
    try {
        const db = (0, db_1.getDb)();
        const id = `cuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const isSkip = args.kind.endsWith(":skipped") || args.kind === "browse-session:paused";
        const status = isSkip ? 499 : 500;
        const detail = JSON.stringify({
            sessionId: args.sessionId ?? null,
            jobId: args.jobId ?? null,
            company: args.company ?? null,
            jobTitle: args.jobTitle ?? null,
            applyUrl: args.applyUrl ?? null,
            raw: args.message,
            ...(args.metadata ? { metadata: args.metadata } : {}),
        });
        await db.execute({
            sql: `INSERT INTO ErrorLog (id, userId, endpoint, method, status, error, detail, userAgent, createdAt)
            VALUES (?, ?, ?, 'WORKER', ?, ?, ?, NULL, datetime('now'))`,
            args: [
                id,
                args.userId ?? null,
                `worker:${args.kind}`,
                status,
                args.message.slice(0, 500),
                detail,
            ],
        });
    }
    catch (err) {
        console.warn(JSON.stringify({
            ts: new Date().toISOString(),
            level: "warn",
            msg: "logWorkerError failed",
            kind: args.kind,
            err: err instanceof Error ? err.message : String(err),
        }));
    }
}
