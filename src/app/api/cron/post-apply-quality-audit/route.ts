import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  auditMatchQuality,
  collectAutoApplyGraphMetrics,
} from "@/lib/health-oversight";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Quality Audit] Starting post-apply quality check...");
    const startTime = Date.now();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const auditableSessions = await prisma.browseSession.findMany({
      where: {
        jobsApplied: { gt: 0 },
        OR: [
          { createdAt: { gte: todayStart } },
          { startedAt: { gte: todayStart } },
          { completedAt: { gte: todayStart } },
        ],
      },
      select: {
        id: true,
        userId: true,
        status: true,
        discoveries: {
          where: { status: "applied" },
          select: {
            id: true,
            jobTitle: true,
            company: true,
            atsType: true,
          },
        },
      },
    });

    if (auditableSessions.length === 0) {
      console.log("[Quality Audit] No applied sessions to audit today");
      const graphMetrics = await collectAutoApplyGraphMetrics({
        since: todayStart,
      });
      return NextResponse.json({
        success: true,
        duration: "0s",
        sessionsAudited: 0,
        totalAudited: 0,
        graphMetrics: {
          totalPlanned: graphMetrics.totalPlanned,
          autoSubmitRate:
            graphMetrics.autoSubmitRate === null
              ? null
              : Math.round(graphMetrics.autoSubmitRate * 100),
          pendingReviewCount: graphMetrics.pendingReviewCount,
          supportedSuccessRate:
            graphMetrics.supportedSuccessRate === null
              ? null
              : Math.round(graphMetrics.supportedSuccessRate * 100),
          unsupportedAutoSubmitCount:
            graphMetrics.unsupportedAutoSubmitCount,
          perAts: graphMetrics.atsBuckets,
        },
      });
    }

    const alreadyAudited = await prisma.matchQualityAudit.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { discoveryId: true },
    });
    const auditedIds = new Set(alreadyAudited.map((a) => a.discoveryId));

    const userIds = [...new Set(auditableSessions.map((s) => s.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        targetRole: true,
        yearsOfExperience: true,
        city: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    let totalAudited = 0;
    let totalGood = 0;
    let totalMarginal = 0;
    let totalBad = 0;

    const perUserBadCounts: Map<string, { total: number; bad: number }> = new Map();

    for (const session of auditableSessions) {
      const unaudited = session.discoveries.filter(
        (d) => !auditedIds.has(d.id)
      );
      if (unaudited.length === 0) continue;

      const user = userMap.get(session.userId);
      if (!user) continue;

      let targetRoles: string[] = [];
      try {
        const parsed = JSON.parse(user.targetRole || "[]");
        if (Array.isArray(parsed)) targetRoles = parsed;
      } catch {
        if (user.targetRole) targetRoles = [user.targetRole];
      }

      const results = await auditMatchQuality(
        session.userId,
        unaudited.map((d) => ({
          discoveryId: d.id,
          jobTitle: d.jobTitle,
          company: d.company,
        })),
        {
          targetRoles,
          experience: user.yearsOfExperience,
          city: user.city,
        }
      );

      for (const r of results) {
        await prisma.matchQualityAudit.create({
          data: {
            discoveryId: r.discoveryId,
            sessionId: session.id,
            userId: session.userId,
            jobTitle:
              unaudited.find((d) => d.id === r.discoveryId)?.jobTitle || "",
            company:
              unaudited.find((d) => d.id === r.discoveryId)?.company || "",
            userTargetRoles: JSON.stringify(targetRoles),
            qualityVerdict: r.verdict,
            qualityScore: r.score,
            reasoning: r.reasoning,
          },
        });

        totalAudited++;
        if (r.verdict === "good") totalGood++;
        else if (r.verdict === "marginal") totalMarginal++;
        else totalBad++;

        const counts = perUserBadCounts.get(session.userId) || {
          total: 0,
          bad: 0,
        };
        counts.total++;
        if (r.verdict === "bad") counts.bad++;
        perUserBadCounts.set(session.userId, counts);
      }
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const [userId, counts] of perUserBadCounts) {
      if (counts.total === 0) continue;
      const badRate = counts.bad / counts.total;
      if (badRate > 0.3) {
        const user = userMap.get(userId);
        const name = user
          ? [user.firstName, user.lastName].filter(Boolean).join(" ")
          : "Unknown";
        const email = user?.email || "unknown";

        const existing = await prisma.adminAlert.findFirst({
          where: {
            kind: "match_quality",
            resolvedAt: null,
            createdAt: { gte: twentyFourHoursAgo },
            metadata: { contains: userId },
          },
        });
        if (!existing) {
          await prisma.adminAlert.create({
            data: {
              kind: "match_quality",
              severity: "medium",
              message: `${name} (${email}) has ${Math.round(badRate * 100)}% bad matches today (${counts.bad}/${counts.total}). Review match quality.`,
              metadata: JSON.stringify({ userId, badRate, total: counts.total, bad: counts.bad }),
            },
          });
        }
      }
    }

    const graphMetrics = await collectAutoApplyGraphMetrics({
      since: todayStart,
    });
    const goodMarginalRate =
      totalAudited > 0 ? (totalGood + totalMarginal) / totalAudited : null;

    if (goodMarginalRate !== null && goodMarginalRate < 0.9) {
      const existing = await prisma.adminAlert.findFirst({
        where: {
          kind: "match_quality_systemic",
          resolvedAt: null,
          createdAt: { gte: twentyFourHoursAgo },
        },
      });
      if (!existing) {
        await prisma.adminAlert.create({
          data: {
            kind: "match_quality_systemic",
            severity: "high",
            message: `System-wide good-or-marginal match rate is ${Math.round(goodMarginalRate * 100)}% (${totalGood + totalMarginal}/${totalAudited}), below the 90% launch gate.`,
            metadata: JSON.stringify({
              goodMarginalRate,
              totalAudited,
              totalBad,
              totalGood,
              totalMarginal,
            }),
          },
        });
      }
    }

    if (
      graphMetrics.supportedSuccessRate !== null &&
      graphMetrics.supportedSuccessRate < 0.8
    ) {
      const existing = await prisma.adminAlert.findFirst({
        where: {
          kind: "apply_success_rate_systemic",
          resolvedAt: null,
          createdAt: { gte: twentyFourHoursAgo },
        },
      });
      if (!existing) {
        await prisma.adminAlert.create({
          data: {
            kind: "apply_success_rate_systemic",
            severity: "high",
            message: `Supported ATS submit success is ${Math.round(graphMetrics.supportedSuccessRate * 100)}% (${graphMetrics.supportedAppliedCount}/${graphMetrics.supportedAttemptedCount}), below the 80% launch gate.`,
            metadata: JSON.stringify({
              supportedAttemptedCount: graphMetrics.supportedAttemptedCount,
              supportedAppliedCount: graphMetrics.supportedAppliedCount,
              supportedFailedCount: graphMetrics.supportedFailedCount,
              supportedSuccessRate: graphMetrics.supportedSuccessRate,
              atsBuckets: graphMetrics.atsBuckets,
            }),
          },
        });
      }
    }

    if (graphMetrics.unsupportedAutoSubmitCount > 0) {
      const existing = await prisma.adminAlert.findFirst({
        where: {
          kind: "unsupported_portal_auto_submit",
          resolvedAt: null,
          createdAt: { gte: twentyFourHoursAgo },
        },
      });
      if (!existing) {
        await prisma.adminAlert.create({
          data: {
            kind: "unsupported_portal_auto_submit",
            severity: "high",
            message: `${graphMetrics.unsupportedAutoSubmitCount} unsupported-portal applications were marked ready or applied today. Launch gate requires 0.`,
            metadata: JSON.stringify({
              unsupportedAutoSubmitCount:
                graphMetrics.unsupportedAutoSubmitCount,
            }),
          },
        });
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const summary = {
      success: true,
      duration: `${duration}s`,
      sessionsAudited: auditableSessions.length,
      totalAudited,
      verdicts: {
        good: totalGood,
        marginal: totalMarginal,
        bad: totalBad,
      },
      launchGates: {
        matchQualityGoodOrMarginal:
          goodMarginalRate === null ? null : Math.round(goodMarginalRate * 100),
        supportedSubmitSuccess:
          graphMetrics.supportedSuccessRate === null
            ? null
            : Math.round(graphMetrics.supportedSuccessRate * 100),
        unsupportedPortalAutoSubmits:
          graphMetrics.unsupportedAutoSubmitCount,
        blocked:
          (goodMarginalRate !== null && goodMarginalRate < 0.9) ||
          (graphMetrics.supportedSuccessRate !== null &&
            graphMetrics.supportedSuccessRate < 0.8) ||
          graphMetrics.unsupportedAutoSubmitCount > 0,
      },
      graphMetrics: {
        totalPlanned: graphMetrics.totalPlanned,
        autoSubmitCount: graphMetrics.autoSubmitCount,
        reviewRoutedCount: graphMetrics.reviewRoutedCount,
        skippedCount: graphMetrics.skippedCount,
        pendingReviewCount: graphMetrics.pendingReviewCount,
        approvedReviewCount: graphMetrics.approvedReviewCount,
        rejectedReviewCount: graphMetrics.rejectedReviewCount,
        autoSubmitRate:
          graphMetrics.autoSubmitRate === null
            ? null
            : Math.round(graphMetrics.autoSubmitRate * 100),
        supportedAttemptedCount: graphMetrics.supportedAttemptedCount,
        supportedAppliedCount: graphMetrics.supportedAppliedCount,
        supportedFailedCount: graphMetrics.supportedFailedCount,
        supportedSuccessRate:
          graphMetrics.supportedSuccessRate === null
            ? null
            : Math.round(graphMetrics.supportedSuccessRate * 100),
        unsupportedAutoSubmitCount:
          graphMetrics.unsupportedAutoSubmitCount,
        perAts: graphMetrics.atsBuckets,
      },
      alerts: {
        perUser: [...perUserBadCounts.values()].filter(
          (c) => c.total > 0 && c.bad / c.total > 0.3
        ).length,
        systemic:
          (goodMarginalRate !== null && goodMarginalRate < 0.9) ||
          (graphMetrics.supportedSuccessRate !== null &&
            graphMetrics.supportedSuccessRate < 0.8) ||
          graphMetrics.unsupportedAutoSubmitCount > 0,
      },
    };

    console.log("[Quality Audit] Complete:", summary);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Quality Audit] Failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
