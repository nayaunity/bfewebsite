import { prisma } from "@/lib/prisma";
import { TIER_LIMITS } from "@/lib/stripe";
import { calculatePacing, type PacingResult, type PacingStatus } from "@/lib/pacing";
import { getCurrentPeriodStart } from "@/lib/subscription";
import { runPacingDiagnostics, buildDiagnosticSummary, type PacingDiagnostics } from "@/lib/pacing-diagnostics";

const SINCE_HOURS = 24;

interface AppliedJob {
  company: string;
  title: string;
  status: string;
}

interface UserReport {
  name: string;
  email: string;
  tier: string;
  monthlyUsed: number;
  monthlyCap: number;
  sessions: {
    id: string;
    status: string;
    applied: number;
    failed: number;
    skipped: number;
    errorMessage: string | null;
  }[];
  appliedJobs: AppliedJob[];
  failures: string[];
  stuckFields: string[];
  pacing: PacingResult | null;
  diagnostics: PacingDiagnostics | null;
  diagnosticSummary: string | null;
}

interface DailyReport {
  totalPaying: number;
  starterCount: number;
  proCount: number;
  activeCount: number;
  totalSessions: number;
  totalApplied: number;
  totalFailed: number;
  successRate: number;
  users: UserReport[];
  topFailureCompanies: { company: string; count: number }[];
  topStuckFields: { label: string; count: number }[];
  flags: string[];
  pacingAlerts: {
    userId: string;
    name: string;
    email: string;
    tier: string;
    status: PacingStatus;
    appsSent: number;
    effectiveCap: number;
    daysRemaining: number;
    projectedTotal: number;
    maxPossible: number;
    irrecoverable: boolean;
    diagnosticSummary: string;
  }[];
  qualityAuditSummary: {
    totalAudited: number;
    goodPercent: number;
    marginalPercent: number;
    badPercent: number;
    worstMatches: Array<{ userName: string; jobTitle: string; company: string; reasoning: string }>;
  };
  healthCheckSummary: {
    usersOnQualityGate: number;
    usersOnCatchup: number;
    usersRemediated: number;
    usersEscalated: number;
  };
}

export async function buildDailyReport(): Promise<DailyReport> {
  const since = new Date(Date.now() - SINCE_HOURS * 60 * 60 * 1000);

  const payingUsers = await prisma.user.findMany({
    where: { subscriptionTier: { in: ["starter", "pro"] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      monthlyAppCount: true,
      subscribedAt: true,
      createdAt: true,
      currentPeriodEnd: true,
    },
  });

  const starterCount = payingUsers.filter((u) => u.subscriptionTier === "starter").length;
  const proCount = payingUsers.filter((u) => u.subscriptionTier === "pro").length;
  const payingIds = payingUsers.map((u) => u.id);

  const recentSessions = await prisma.browseSession.findMany({
    where: { userId: { in: payingIds }, createdAt: { gte: since } },
    select: {
      id: true,
      userId: true,
      status: true,
      jobsApplied: true,
      jobsFailed: true,
      jobsSkipped: true,
      errorMessage: true,
    },
  });

  const sessionUserIds = new Set(recentSessions.map((s) => s.userId));

  const sessionIds = recentSessions.map((s) => s.id);
  const sessionUserMap = new Map(recentSessions.map((s) => [s.id, s.userId]));

  const allDiscoveries = await prisma.browseDiscovery.findMany({
    where: {
      sessionId: { in: sessionIds },
    },
    select: {
      status: true,
      errorMessage: true,
      company: true,
      jobTitle: true,
      sessionId: true,
    },
  });

  const recentDiscoveries = allDiscoveries.filter(
    (d) => d.status === "failed" || d.status === "stuck"
  );

  const recentStuck = await prisma.stuckField.findMany({
    where: { createdAt: { gte: since } },
    select: { company: true, fieldLabel: true, failureType: true },
  });

  // Per-user reports
  const users: UserReport[] = [];
  for (const u of payingUsers) {
    const uSessions = recentSessions.filter((s) => s.userId === u.id);
    if (uSessions.length === 0) continue;

    const uAllDiscoveries = allDiscoveries.filter((d) => sessionUserMap.get(d.sessionId) === u.id);
    const appliedJobs: AppliedJob[] = uAllDiscoveries.map((d) => ({
      company: d.company,
      title: d.jobTitle || "Unknown role",
      status: d.status,
    }));

    const uDiscoveries = recentDiscoveries.filter((d) => sessionUserMap.get(d.sessionId) === u.id);
    const failureMessages = uDiscoveries
      .map((d) => d.errorMessage)
      .filter(Boolean) as string[];
    const failureCounts = new Map<string, number>();
    for (const msg of failureMessages) {
      const short = msg.length > 60 ? msg.slice(0, 60) + "..." : msg;
      failureCounts.set(short, (failureCounts.get(short) || 0) + 1);
    }
    const failures = [...failureCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([msg, cnt]) => `${msg} (x${cnt})`);

    const cap = (TIER_LIMITS[u.subscriptionTier] ?? TIER_LIMITS.free).appsPerMonth;

    users.push({
      name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "Unknown",
      email: u.email,
      tier: u.subscriptionTier,
      monthlyUsed: u.monthlyAppCount,
      monthlyCap: cap,
      sessions: uSessions.map((s) => ({
        id: s.id.slice(-6),
        status: s.status,
        applied: s.jobsApplied,
        failed: s.jobsFailed,
        skipped: s.jobsSkipped,
        errorMessage: s.errorMessage,
      })),
      appliedJobs,
      failures,
      stuckFields: [],
      pacing: null,
      diagnostics: null,
      diagnosticSummary: null,
    });
  }

  // Totals
  const totalSessions = recentSessions.length;
  const totalApplied = recentSessions.reduce((s, r) => s + r.jobsApplied, 0);
  const totalFailed = recentSessions.reduce((s, r) => s + r.jobsFailed, 0);
  const totalAttempts = totalApplied + totalFailed;
  const successRate = totalAttempts > 0 ? Math.round((totalApplied / totalAttempts) * 100) : 0;

  // Top failure companies
  const companyCounts = new Map<string, number>();
  for (const d of recentDiscoveries) {
    companyCounts.set(d.company, (companyCounts.get(d.company) || 0) + 1);
  }
  const topFailureCompanies = [...companyCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([company, count]) => ({ company, count }));

  // Top stuck fields
  const stuckCounts = new Map<string, number>();
  for (const s of recentStuck) {
    const key = `${s.company}: ${s.fieldLabel}`;
    stuckCounts.set(key, (stuckCounts.get(key) || 0) + 1);
  }
  const topStuckFields = [...stuckCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  // Flags
  const flags: string[] = [];
  for (const u of users) {
    const totalUserApplied = u.sessions.reduce((s, r) => s + r.applied, 0);
    const totalUserFailed = u.sessions.reduce((s, r) => s + r.failed, 0);
    if (totalUserApplied === 0 && totalUserFailed > 0) {
      flags.push(`${u.name} (${u.email}) had ${totalUserFailed} failures and 0 successful applies`);
    }
    if (u.sessions.some((s) => s.status === "failed" || s.errorMessage)) {
      const errSession = u.sessions.find((s) => s.errorMessage);
      if (errSession) {
        flags.push(`${u.name} session errored: ${errSession.errorMessage?.slice(0, 80)}`);
      }
    }
    const pctUsed = u.monthlyCap > 0 ? u.monthlyUsed / u.monthlyCap : 0;
    if (pctUsed >= 0.8) {
      flags.push(`${u.name} approaching cap: ${u.monthlyUsed}/${u.monthlyCap} (${Math.round(pctUsed * 100)}%)`);
    }
  }

  // Pacing checks for all paying users (not just those with recent sessions)
  const pacingAlerts: DailyReport["pacingAlerts"] = [];
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const u of payingUsers) {
    if (u.subscriptionStatus !== "active") continue;

    // Recompute apps from sessions for accuracy. Fetch all and filter in JS
    // because worker writes startedAt as 'YYYY-MM-DD HH:MM:SS' via raw SQL
    // while Prisma compares with ISO format, causing silent mismatches in SQLite.
    const periodStart = getCurrentPeriodStart(u);
    let periodApps = 0;
    const allUserSessions = await prisma.browseSession.findMany({
      where: { userId: u.id },
      select: { jobsApplied: true, startedAt: true },
    });
    for (const s of allUserSessions) {
      if (!s.startedAt || s.startedAt < periodStart) continue;
      periodApps += s.jobsApplied;
    }

    const pacing = calculatePacing({
      subscribedAt: u.subscribedAt,
      createdAt: u.createdAt,
      currentPeriodEnd: u.currentPeriodEnd,
      subscriptionTier: u.subscriptionTier,
      subscriptionStatus: u.subscriptionStatus,
      monthlyAppCount: periodApps,
    });

    const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "Unknown";

    // Attach pacing to the user report if they had recent sessions
    const userReport = users.find((ur) => ur.email === u.email);
    if (userReport) userReport.pacing = pacing;

    if (pacing.status === "on_track") continue;

    const diag = await runPacingDiagnostics(u.id, periodStart);
    const summary = buildDiagnosticSummary(diag);

    if (userReport) {
      userReport.diagnostics = diag;
      userReport.diagnosticSummary = summary;
    }

    pacingAlerts.push({
      userId: u.id,
      name,
      email: u.email,
      tier: u.subscriptionTier,
      status: pacing.status,
      appsSent: pacing.appsSent,
      effectiveCap: pacing.effectiveCap,
      daysRemaining: pacing.daysRemaining,
      projectedTotal: pacing.projectedTotal,
      maxPossible: pacing.maxPossible,
      irrecoverable: pacing.irrecoverable,
      diagnosticSummary: summary,
    });

    // Create AdminAlert for at_risk / critical users (deduplicated per user per day)
    if (pacing.status === "at_risk" || pacing.status === "critical") {
      const existing = await prisma.adminAlert.findFirst({
        where: {
          kind: "pacing_risk",
          resolvedAt: null,
          createdAt: { gte: twentyFourHoursAgo },
          metadata: { contains: u.id },
        },
      });
      if (!existing) {
        await prisma.adminAlert.create({
          data: {
            kind: "pacing_risk",
            severity: pacing.status === "critical" ? "high" : "medium",
            message: `${name} (${u.subscriptionTier}) is ${pacing.status}: ${pacing.appsSent}/${pacing.effectiveCap} apps with ${pacing.daysRemaining} days left. Projected: ${pacing.projectedTotal}. ${summary}`,
            metadata: JSON.stringify({
              userId: u.id,
              pacingStatus: pacing.status,
              appsSent: pacing.appsSent,
              effectiveCap: pacing.effectiveCap,
              daysRemaining: pacing.daysRemaining,
              projectedTotal: pacing.projectedTotal,
              maxPossible: pacing.maxPossible,
              irrecoverable: pacing.irrecoverable,
            }),
          },
        });
      }
    }
  }

  // Quality audit summary from today's MatchQualityAudit records
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const qualityAudits = await prisma.matchQualityAudit.findMany({
    where: { createdAt: { gte: todayStart } },
    select: { userId: true, qualityVerdict: true, jobTitle: true, company: true, reasoning: true },
  });

  const qaTotal = qualityAudits.length;
  const qaGood = qualityAudits.filter((a) => a.qualityVerdict === "good").length;
  const qaMarginal = qualityAudits.filter((a) => a.qualityVerdict === "marginal").length;
  const qaBad = qualityAudits.filter((a) => a.qualityVerdict === "bad").length;

  const badMatches = qualityAudits.filter((a) => a.qualityVerdict === "bad");
  const userNameMap = new Map(payingUsers.map((u) => [u.id, [u.firstName, u.lastName].filter(Boolean).join(" ") || "Unknown"]));
  const worstMatches = badMatches.slice(0, 5).map((a) => ({
    userName: userNameMap.get(a.userId) || "Unknown",
    jobTitle: a.jobTitle,
    company: a.company,
    reasoning: a.reasoning || "",
  }));

  // Health check summary from today's HealthCheck records
  const healthChecks = await prisma.healthCheck.findMany({
    where: { runDate: { gte: todayStart } },
    select: { strategy: true, remediationActions: true },
  });

  const usersOnQualityGate = healthChecks.filter((h) => h.strategy === "quality_gate").length;
  const usersOnCatchup = healthChecks.filter((h) => h.strategy === "catchup" || h.strategy === "aggressive_catchup").length;
  const usersRemediated = healthChecks.filter((h) => h.remediationActions && h.remediationActions !== "null").length;
  const usersEscalated = healthChecks.filter((h) => {
    if (!h.remediationActions) return false;
    try {
      const actions = JSON.parse(h.remediationActions);
      return Array.isArray(actions) && actions.includes("escalate");
    } catch { return false; }
  }).length;

  return {
    totalPaying: payingUsers.length,
    starterCount,
    proCount,
    activeCount: sessionUserIds.size,
    totalSessions,
    totalApplied,
    totalFailed,
    successRate,
    users,
    topFailureCompanies,
    topStuckFields,
    flags,
    pacingAlerts,
    qualityAuditSummary: {
      totalAudited: qaTotal,
      goodPercent: qaTotal > 0 ? Math.round((qaGood / qaTotal) * 100) : 0,
      marginalPercent: qaTotal > 0 ? Math.round((qaMarginal / qaTotal) * 100) : 0,
      badPercent: qaTotal > 0 ? Math.round((qaBad / qaTotal) * 100) : 0,
      worstMatches,
    },
    healthCheckSummary: {
      usersOnQualityGate,
      usersOnCatchup,
      usersRemediated,
      usersEscalated,
    },
  };
}

export function formatReportText(r: DailyReport): string {
  const lines: string[] = [];

  lines.push("OVERVIEW");
  lines.push(`  Paying users: ${r.totalPaying} (${r.starterCount} starter, ${r.proCount} pro)`);
  lines.push(`  Active last 24h: ${r.activeCount}`);
  lines.push(`  Sessions: ${r.totalSessions} | Apps sent: ${r.totalApplied} | Failed: ${r.totalFailed} | Success: ${r.successRate}%`);
  lines.push("");

  if (r.users.length > 0) {
    lines.push("USER DETAIL");
    for (const u of r.users) {
      lines.push(`  ${u.name} (${u.tier}) - ${u.email} - ${u.monthlyUsed}/${u.monthlyCap} this month`);
      for (const s of u.sessions) {
        lines.push(`    Session ...${s.id}: ${s.applied} applied, ${s.failed} failed, ${s.skipped} skipped [${s.status}]`);
        if (s.errorMessage) lines.push(`      Error: ${s.errorMessage.slice(0, 100)}`);
      }
      if (u.appliedJobs.length > 0) {
        const applied = u.appliedJobs.filter((j) => j.status === "applied");
        const failed = u.appliedJobs.filter((j) => j.status === "failed" || j.status === "stuck");
        if (applied.length > 0) {
          lines.push(`    Applied to:`);
          for (const j of applied) lines.push(`      + ${j.title} at ${j.company}`);
        }
        if (failed.length > 0) {
          lines.push(`    Failed:`);
          for (const j of failed) lines.push(`      x ${j.title} at ${j.company}`);
        }
      }
      if (u.failures.length > 0) {
        lines.push(`    Failure reasons: ${u.failures.join(", ")}`);
      }
      lines.push("");
    }
  } else {
    lines.push("USER DETAIL");
    lines.push("  No paying user sessions in the last 24h.");
    lines.push("");
  }

  if (r.pacingAlerts.length > 0) {
    lines.push("PACING ALERTS");
    for (const p of r.pacingAlerts) {
      const label = p.status.toUpperCase().replace("_", " ");
      lines.push(`  * ${p.name} (${p.tier}) ${label}: ${p.appsSent}/${p.effectiveCap} apps, ${p.daysRemaining} days left. Projected: ${p.projectedTotal}.${p.irrecoverable ? " CANNOT REACH CAP." : ""}`);
      lines.push(`    ${p.diagnosticSummary}`);
    }
    lines.push("");
  }

  if (r.topFailureCompanies.length > 0) {
    lines.push("TOP FAILURE COMPANIES (last 24h)");
    for (const c of r.topFailureCompanies) {
      lines.push(`  ${c.company}: ${c.count}`);
    }
    lines.push("");
  }

  if (r.topStuckFields.length > 0) {
    lines.push("TOP STUCK FIELDS (last 24h)");
    for (const s of r.topStuckFields) {
      lines.push(`  ${s.label}: ${s.count}`);
    }
    lines.push("");
  }

  if (r.healthCheckSummary.usersOnQualityGate > 0 || r.healthCheckSummary.usersOnCatchup > 0) {
    lines.push("HEALTH OVERSIGHT");
    lines.push(`  Quality gate (ahead of pace): ${r.healthCheckSummary.usersOnQualityGate} users`);
    lines.push(`  Catch-up mode (behind pace): ${r.healthCheckSummary.usersOnCatchup} users`);
    if (r.healthCheckSummary.usersRemediated > 0) {
      lines.push(`  Auto-remediated: ${r.healthCheckSummary.usersRemediated} users`);
    }
    if (r.healthCheckSummary.usersEscalated > 0) {
      lines.push(`  Escalated (needs attention): ${r.healthCheckSummary.usersEscalated} users`);
    }
    lines.push("");
  }

  if (r.qualityAuditSummary.totalAudited > 0) {
    lines.push("MATCH QUALITY AUDIT");
    lines.push(`  Audited: ${r.qualityAuditSummary.totalAudited} applications`);
    lines.push(`  Good: ${r.qualityAuditSummary.goodPercent}% | Marginal: ${r.qualityAuditSummary.marginalPercent}% | Bad: ${r.qualityAuditSummary.badPercent}%`);
    if (r.qualityAuditSummary.worstMatches.length > 0) {
      lines.push("  Worst matches:");
      for (const m of r.qualityAuditSummary.worstMatches) {
        lines.push(`    x ${m.userName}: ${m.jobTitle} at ${m.company}`);
        if (m.reasoning) lines.push(`      ${m.reasoning}`);
      }
    }
    lines.push("");
  }

  lines.push("FLAGS");
  if (r.flags.length === 0) {
    lines.push("  No issues flagged today.");
  } else {
    for (const f of r.flags) {
      lines.push(`  * ${f}`);
    }
  }

  return lines.join("\n");
}

export function formatReportHtml(r: DailyReport): string {
  const section = (title: string, body: string) =>
    `<tr><td style="padding:16px 0 4px;font-weight:700;font-size:13px;text-transform:uppercase;color:#666;border-bottom:1px solid #eee;">${title}</td></tr><tr><td style="padding:8px 0 16px;">${body}</td></tr>`;

  const overviewBody = `
    <div>Paying users: <strong>${r.totalPaying}</strong> (${r.starterCount} starter, ${r.proCount} pro)</div>
    <div>Active last 24h: <strong>${r.activeCount}</strong></div>
    <div>Sessions: ${r.totalSessions} | Apps sent: <strong>${r.totalApplied}</strong> | Failed: ${r.totalFailed} | Success: <strong>${r.successRate}%</strong></div>`;

  let userBody = "";
  if (r.users.length === 0) {
    userBody = "<div style='color:#888;'>No paying user sessions in the last 24h.</div>";
  } else {
    for (const u of r.users) {
      userBody += `<div style="margin-bottom:12px;padding:10px;border:1px solid #eee;border-radius:8px;">`;
      userBody += `<div><strong>${u.name}</strong> (${u.tier}) - ${u.email} - ${u.monthlyUsed}/${u.monthlyCap} this month</div>`;
      for (const s of u.sessions) {
        userBody += `<div style="margin-left:12px;font-size:14px;">Session ...${s.id}: ${s.applied} applied, ${s.failed} failed, ${s.skipped} skipped <span style="color:#888;">[${s.status}]</span></div>`;
        if (s.errorMessage) {
          userBody += `<div style="margin-left:24px;color:#c00;font-size:13px;">Error: ${s.errorMessage.slice(0, 100)}</div>`;
        }
      }
      const applied = u.appliedJobs.filter((j) => j.status === "applied");
      const failedJobs = u.appliedJobs.filter((j) => j.status === "failed" || j.status === "stuck");
      if (applied.length > 0) {
        userBody += `<div style="margin:6px 0 2px 12px;font-size:13px;font-weight:600;color:#16a34a;">Applied to:</div>`;
        for (const j of applied) {
          userBody += `<div style="margin-left:24px;font-size:13px;">+ ${j.title} at <strong>${j.company}</strong></div>`;
        }
      }
      if (failedJobs.length > 0) {
        userBody += `<div style="margin:6px 0 2px 12px;font-size:13px;font-weight:600;color:#c00;">Failed:</div>`;
        for (const j of failedJobs) {
          userBody += `<div style="margin-left:24px;font-size:13px;color:#888;">x ${j.title} at ${j.company}</div>`;
        }
      }
      if (u.failures.length > 0) {
        userBody += `<div style="margin:4px 0 0 12px;font-size:12px;color:#888;">Failure reasons: ${u.failures.join(", ")}</div>`;
      }
      userBody += `</div>`;
    }
  }

  let pacingBody = "";
  if (r.pacingAlerts.length > 0) {
    for (const p of r.pacingAlerts) {
      const color = p.status === "critical" ? "#c00" : p.status === "at_risk" ? "#d97706" : "#ca8a04";
      const label = p.status.toUpperCase().replace("_", " ");
      pacingBody += `<div style="margin-bottom:8px;padding:8px 10px;border-left:3px solid ${color};background:#fafafa;border-radius:4px;">`;
      pacingBody += `<div><strong>${p.name}</strong> (${p.tier}) <span style="color:${color};font-weight:700;">${label}</span></div>`;
      pacingBody += `<div style="font-size:13px;">${p.appsSent}/${p.effectiveCap} apps, ${p.daysRemaining} days left. Projected: ${p.projectedTotal}.${p.irrecoverable ? " <strong style='color:#c00;'>CANNOT REACH CAP.</strong>" : ""}</div>`;
      pacingBody += `<div style="font-size:12px;color:#666;margin-top:2px;">${p.diagnosticSummary}</div>`;
      pacingBody += `</div>`;
    }
  } else {
    pacingBody = "<div style='color:#16a34a;'>All paying users on track.</div>";
  }

  let failBody = "";
  if (r.topFailureCompanies.length > 0) {
    failBody = r.topFailureCompanies.map((c) => `<div>${c.company}: ${c.count}</div>`).join("");
  } else {
    failBody = "<div style='color:#888;'>None</div>";
  }

  let stuckBody = "";
  if (r.topStuckFields.length > 0) {
    stuckBody = r.topStuckFields.map((s) => `<div>${s.label}: ${s.count}</div>`).join("");
  } else {
    stuckBody = "<div style='color:#888;'>None</div>";
  }

  let healthBody = "";
  if (r.healthCheckSummary.usersOnQualityGate > 0 || r.healthCheckSummary.usersOnCatchup > 0) {
    healthBody += `<div>Quality gate (ahead of pace): <strong>${r.healthCheckSummary.usersOnQualityGate}</strong> users</div>`;
    healthBody += `<div>Catch-up mode (behind pace): <strong>${r.healthCheckSummary.usersOnCatchup}</strong> users</div>`;
    if (r.healthCheckSummary.usersRemediated > 0) {
      healthBody += `<div>Auto-remediated: <strong>${r.healthCheckSummary.usersRemediated}</strong> users</div>`;
    }
    if (r.healthCheckSummary.usersEscalated > 0) {
      healthBody += `<div style="color:#c00;">Escalated (needs attention): <strong>${r.healthCheckSummary.usersEscalated}</strong> users</div>`;
    }
  } else {
    healthBody = "<div style='color:#888;'>No health check data today.</div>";
  }

  let qualityBody = "";
  if (r.qualityAuditSummary.totalAudited > 0) {
    const qa = r.qualityAuditSummary;
    const badColor = qa.badPercent > 20 ? "#c00" : qa.badPercent > 10 ? "#d97706" : "#16a34a";
    qualityBody += `<div>Audited: <strong>${qa.totalAudited}</strong> applications</div>`;
    qualityBody += `<div><span style="color:#16a34a;">Good: ${qa.goodPercent}%</span> | <span style="color:#d97706;">Marginal: ${qa.marginalPercent}%</span> | <span style="color:${badColor};">Bad: ${qa.badPercent}%</span></div>`;
    if (qa.worstMatches.length > 0) {
      qualityBody += `<div style="margin-top:6px;font-size:13px;font-weight:600;">Worst matches:</div>`;
      for (const m of qa.worstMatches) {
        qualityBody += `<div style="margin-left:12px;font-size:13px;color:#c00;">x ${m.userName}: ${m.jobTitle} at ${m.company}</div>`;
        if (m.reasoning) {
          qualityBody += `<div style="margin-left:24px;font-size:12px;color:#888;">${m.reasoning}</div>`;
        }
      }
    }
  } else {
    qualityBody = "<div style='color:#888;'>No quality audit data today (audit runs at 17:00 UTC).</div>";
  }

  let flagBody = "";
  if (r.flags.length === 0) {
    flagBody = "<div style='color:#888;'>No issues flagged today.</div>";
  } else {
    flagBody = r.flags.map((f) => `<div style="color:#c00;">* ${f}</div>`).join("");
  }

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:640px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${section("Overview", overviewBody)}
      ${section("Health Oversight", healthBody)}
      ${section("User Detail", userBody)}
      ${section("Pacing Alerts", pacingBody)}
      ${section("Match Quality Audit", qualityBody)}
      ${section("Top Failure Companies", failBody)}
      ${section("Top Stuck Fields", stuckBody)}
      ${section("Flags", flagBody)}
    </table>
  </div>`;
}
