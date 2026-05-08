import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditMatchQuality } from "@/lib/health-oversight";

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

    const completedSessions = await prisma.browseSession.findMany({
      where: {
        status: "completed",
        completedAt: { gte: todayStart },
        jobsApplied: { gt: 0 },
      },
      select: {
        id: true,
        userId: true,
        discoveries: {
          where: { status: "applied" },
          select: {
            id: true,
            jobTitle: true,
            company: true,
          },
        },
      },
    });

    if (completedSessions.length === 0) {
      console.log("[Quality Audit] No completed sessions with applications today");
      return NextResponse.json({
        success: true,
        duration: "0s",
        sessionsAudited: 0,
        totalAudited: 0,
      });
    }

    const alreadyAudited = await prisma.matchQualityAudit.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { discoveryId: true },
    });
    const auditedIds = new Set(alreadyAudited.map((a) => a.discoveryId));

    const userIds = [...new Set(completedSessions.map((s) => s.userId))];
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

    for (const session of completedSessions) {
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

    if (totalAudited > 0) {
      const systemBadRate = totalBad / totalAudited;
      if (systemBadRate > 0.2) {
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
              message: `System-wide bad match rate: ${Math.round(systemBadRate * 100)}% (${totalBad}/${totalAudited}). Matcher may need tuning.`,
              metadata: JSON.stringify({
                badRate: systemBadRate,
                totalAudited,
                totalBad,
                totalGood,
                totalMarginal,
              }),
            },
          });
        }
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const summary = {
      success: true,
      duration: `${duration}s`,
      sessionsAudited: completedSessions.length,
      totalAudited,
      verdicts: {
        good: totalGood,
        marginal: totalMarginal,
        bad: totalBad,
      },
      alerts: {
        perUser: [...perUserBadCounts.values()].filter(
          (c) => c.total > 0 && c.bad / c.total > 0.3
        ).length,
        systemic: totalAudited > 0 && totalBad / totalAudited > 0.2,
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
