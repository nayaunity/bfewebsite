import { prisma } from "@/lib/prisma";
import { TIER_LIMITS } from "@/lib/stripe";

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
      monthlyAppCount: true,
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
      createdAt: { gte: since },
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

  let flagBody = "";
  if (r.flags.length === 0) {
    flagBody = "<div style='color:#888;'>No issues flagged today.</div>";
  } else {
    flagBody = r.flags.map((f) => `<div style="color:#c00;">* ${f}</div>`).join("");
  }

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:640px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${section("Overview", overviewBody)}
      ${section("User Detail", userBody)}
      ${section("Top Failure Companies", failBody)}
      ${section("Top Stuck Fields", stuckBody)}
      ${section("Flags", flagBody)}
    </table>
  </div>`;
}
