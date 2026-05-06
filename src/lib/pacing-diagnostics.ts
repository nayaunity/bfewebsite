import "server-only";
import { prisma } from "./prisma";

export interface PacingDiagnostics {
  failureRate: number;
  sessionGapDays: number;
  totalSessionsInPeriod: number;
  topFailureReasons: { reason: string; count: number }[];
  stuckFieldCount: number;
  hasResume: boolean;
  hasTargetRole: boolean;
  hasCompleteProfile: boolean;
  matchCoverage: "good" | "limited" | "none";
}

export async function runPacingDiagnostics(
  userId: string,
  periodStart: Date
): Promise<PacingDiagnostics> {
  // Fetch all sessions and filter in JS to avoid SQLite datetime format
  // mismatch (worker writes 'YYYY-MM-DD HH:MM:SS', Prisma uses ISO).
  const [user, allSessions, stuckCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        resumeUrl: true,
        targetRole: true,
        phone: true,
        workAuthorized: true,
        countryOfResidence: true,
      },
    }),
    prisma.browseSession.findMany({
      where: { userId },
      select: {
        jobsApplied: true,
        jobsFailed: true,
        startedAt: true,
        completedAt: true,
        discoveries: {
          where: { status: "failed" },
          select: { errorMessage: true },
        },
      },
      orderBy: { startedAt: "desc" },
    }),
    prisma.stuckField.count({
      where: { createdAt: { gte: periodStart } },
    }),
  ]);

  const sessions = allSessions.filter(
    (s) => s.startedAt && s.startedAt >= periodStart
  );

  const totalApplied = sessions.reduce((s, r) => s + r.jobsApplied, 0);
  const totalFailed = sessions.reduce((s, r) => s + r.jobsFailed, 0);
  const totalAttempts = totalApplied + totalFailed;
  const failureRate = totalAttempts > 0 ? totalFailed / totalAttempts : 0;

  const lastCompleted = sessions.find((s) => s.completedAt);
  const sessionGapDays = lastCompleted?.completedAt
    ? Math.floor((Date.now() - new Date(lastCompleted.completedAt).getTime()) / (24 * 60 * 60 * 1000))
    : -1;

  const failureCounts = new Map<string, number>();
  for (const s of sessions) {
    for (const d of s.discoveries) {
      if (!d.errorMessage) continue;
      const short = d.errorMessage.length > 60 ? d.errorMessage.slice(0, 60) + "..." : d.errorMessage;
      failureCounts.set(short, (failureCounts.get(short) || 0) + 1);
    }
  }
  const topFailureReasons = [...failureCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason, count]) => ({ reason, count }));

  const hasResume = !!user?.resumeUrl;
  const hasTargetRole = !!user?.targetRole;
  const hasCompleteProfile = !!(user?.phone && user?.workAuthorized !== null && user?.countryOfResidence);

  let matchCoverage: "good" | "limited" | "none";
  if (sessions.length === 0) {
    matchCoverage = "none";
  } else if (totalApplied < 3 && sessions.length >= 3) {
    matchCoverage = "limited";
  } else {
    matchCoverage = "good";
  }

  return {
    failureRate,
    sessionGapDays,
    totalSessionsInPeriod: sessions.length,
    topFailureReasons,
    stuckFieldCount: stuckCount,
    hasResume,
    hasTargetRole,
    hasCompleteProfile,
    matchCoverage,
  };
}

export function buildDiagnosticSummary(d: PacingDiagnostics): string {
  const issues: string[] = [];
  if (d.failureRate > 0.5) issues.push(`high failure rate (${Math.round(d.failureRate * 100)}%)`);
  if (d.sessionGapDays > 3) issues.push(`no sessions in ${d.sessionGapDays} days`);
  else if (d.sessionGapDays === -1) issues.push("no completed sessions this period");
  if (!d.hasResume) issues.push("no resume uploaded");
  if (!d.hasTargetRole) issues.push("no target role set");
  if (!d.hasCompleteProfile) issues.push("incomplete profile");
  if (d.matchCoverage === "none") issues.push("zero job matches");
  else if (d.matchCoverage === "limited") issues.push("limited job matches");
  if (d.stuckFieldCount > 5) issues.push(`${d.stuckFieldCount} stuck fields`);
  if (issues.length === 0) issues.push("no obvious blockers detected");
  return issues.join("; ");
}
