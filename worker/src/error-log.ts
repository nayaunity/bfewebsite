import { getDb } from "./db";

export type WorkerErrorKind =
  | "browse-session:timeout"
  | "browse-session:failed"
  | "browse-session:paused"
  | "browse-discovery:failed"
  | "browse-discovery:skipped"
  | "apply-queue:failed";

interface LogWorkerErrorArgs {
  kind: WorkerErrorKind;
  userId?: string | null;
  message: string;
  sessionId?: string | null;
  jobId?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  applyUrl?: string | null;
  metadata?: Record<string, unknown>;
}

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
export async function logWorkerError(args: LogWorkerErrorArgs): Promise<void> {
  try {
    const db = getDb();
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
  } catch (err) {
    console.warn(JSON.stringify({
      ts: new Date().toISOString(),
      level: "warn",
      msg: "logWorkerError failed",
      kind: args.kind,
      err: err instanceof Error ? err.message : String(err),
    }));
  }
}
