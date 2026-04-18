import { prisma } from "@/lib/prisma";

export type ServerErrorKind =
  | "batch-apply:job-failed"
  | "batch-apply:run-failed"
  // A verification code arrived AFTER the worker gave up on a discovery — the
  // longer-wait window we just shipped would have caught it. Used to gauge
  // whether further timeout extension is worthwhile.
  | "near-miss-verification";

interface LogServerErrorArgs {
  kind: ServerErrorKind;
  userId?: string | null;
  message: string;
  jobId?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  metadata?: Record<string, unknown>;
}

// Mirror of worker/src/error-log.ts for Next.js server-side error sites.
// Inserts a row into ErrorLog so /admin/errors surfaces the error alongside
// HTTP and worker errors. Uses prisma instead of raw libsql since this runs
// in the Next.js process. Failures here MUST NOT throw.
export async function logServerError(args: LogServerErrorArgs): Promise<void> {
  try {
    const detail = JSON.stringify({
      jobId: args.jobId ?? null,
      company: args.company ?? null,
      jobTitle: args.jobTitle ?? null,
      raw: args.message,
      ...(args.metadata ? { metadata: args.metadata } : {}),
    });
    await prisma.errorLog.create({
      data: {
        userId: args.userId ?? null,
        endpoint: `worker:${args.kind}`,
        method: "WORKER",
        status: 500,
        error: args.message.slice(0, 500),
        detail,
      },
    });
  } catch (err) {
    console.warn("logServerError failed", args.kind, err);
  }
}
