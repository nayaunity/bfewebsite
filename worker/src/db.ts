import { createClient, type Client } from "@libsql/client";

let client: Client;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL!,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return client;
}

export interface QueueItem {
  id: string;
  userId: string;
  jobId: string;
  resumeUrl: string;
  resumeName: string;
  applicantData: string;
}

export interface JobInfo {
  company: string;
  companySlug: string;
  title: string;
  applyUrl: string;
}

export async function pollQueue(): Promise<(QueueItem & { job: JobInfo }) | null> {
  const db = getDb();

  // Atomically claim the next queued item
  const result = await db.execute({
    sql: `UPDATE ApplyQueue SET status = 'processing', startedAt = datetime('now')
          WHERE id = (SELECT id FROM ApplyQueue WHERE status = 'queued' ORDER BY priority DESC, createdAt ASC LIMIT 1)
          RETURNING id, userId, jobId, resumeUrl, resumeName, applicantData`,
    args: [],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const item: QueueItem = {
    id: row.id as string,
    userId: row.userId as string,
    jobId: row.jobId as string,
    resumeUrl: row.resumeUrl as string,
    resumeName: row.resumeName as string,
    applicantData: row.applicantData as string,
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
      company: jobRow.company as string,
      companySlug: jobRow.companySlug as string,
      title: jobRow.title as string,
      applyUrl: jobRow.applyUrl as string,
    },
  };
}

export async function markCompleted(queueId: string, note?: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `UPDATE ApplyQueue SET status = 'completed', completedAt = datetime('now'), workerNote = ? WHERE id = ?`,
    args: [note || null, queueId],
  });
}

export async function markFailed(queueId: string, error: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `UPDATE ApplyQueue SET status = 'failed', completedAt = datetime('now'), errorMessage = ? WHERE id = ?`,
    args: [error, queueId],
  });
  // Surface in /admin/errors. Look up the userId+jobId for cross-reference.
  try {
    const { logWorkerError } = await import("./error-log");
    const r = await db.execute({
      sql: `SELECT userId, jobId FROM ApplyQueue WHERE id = ?`,
      args: [queueId],
    });
    const row = r.rows?.[0] as unknown as { userId?: string; jobId?: string } | undefined;
    await logWorkerError({
      kind: "apply-queue:failed",
      userId: row?.userId ?? null,
      jobId: row?.jobId ?? null,
      message: error,
    });
  } catch {}
}

export async function recordApplication(
  userId: string,
  jobId: string,
  company: string,
  companySlug: string,
  jobTitle: string,
  status: string,
  error?: string
): Promise<void> {
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

export async function incrementUserAppCount(userId: string): Promise<void> {
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
export async function getCompanyCooldown(companySlug: string): Promise<string | null> {
  if (!companySlug) return null;
  const db = getDb();
  const res = await db.execute({
    sql: `SELECT reason, cooldownUntil FROM CompanyCooldown WHERE companySlug = ? AND cooldownUntil > datetime('now') LIMIT 1`,
    args: [companySlug],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0] as unknown as { reason: string; cooldownUntil: string };
  return `${row.reason} (until ${row.cooldownUntil})`;
}

/**
 * Set or extend a 24h cooldown for a company (e.g. after a spam flag).
 */
export async function setCompanyCooldown(companySlug: string, reason: string, hours = 24): Promise<void> {
  if (!companySlug) return;
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
export async function logStuckField(params: {
  discoveryId?: string;
  company: string;
  fieldLabel: string;
  fieldRole: string;
  failureType: string;
  pageUrl: string;
  attemptCount?: number;
}): Promise<void> {
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
