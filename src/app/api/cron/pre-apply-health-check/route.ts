import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePacing } from "@/lib/pacing";
import { getCurrentPeriodStart } from "@/lib/subscription";
import { runPacingDiagnostics } from "@/lib/pacing-diagnostics";
import {
  computeAdaptiveStrategy,
  diagnoseAndRemediate,
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
    console.log("[Health Check] Starting pre-apply health assessment...");
    const startTime = Date.now();

    const eligibleUsers = await prisma.user.findMany({
      where: {
        subscriptionTier: { in: ["starter", "pro"] },
        subscriptionStatus: { in: ["active", "trialing"] },
        firstName: { not: null },
        lastName: { not: null },
        phone: { not: null },
        workAuthorized: { not: null },
        countryOfResidence: { not: null },
        targetRole: { not: null },
        resumes: { some: {} },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscribedAt: true,
        createdAt: true,
        currentPeriodEnd: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        monthlyAppCount: true,
      },
    });

    console.log(`[Health Check] Assessing ${eligibleUsers.length} eligible users`);

    const results: Array<{
      userId: string;
      email: string;
      strategy: string;
      dailyCap: number;
      qualityThreshold: number | null;
      escalated: boolean;
    }> = [];

    const escalations: Array<{
      name: string;
      email: string;
      reason: string;
      pacingStatus: string;
      appsSent: number;
      effectiveCap: number;
    }> = [];

    for (const user of eligibleUsers) {
      try {
        const periodStart = getCurrentPeriodStart(user);
        const allSessions = await prisma.browseSession.findMany({
          where: { userId: user.id },
          select: { jobsApplied: true, startedAt: true },
        });
        let periodApps = 0;
        for (const s of allSessions) {
          if (!s.startedAt || s.startedAt < periodStart) continue;
          periodApps += s.jobsApplied;
        }

        const pacing = calculatePacing({
          subscribedAt: user.subscribedAt,
          createdAt: user.createdAt,
          currentPeriodEnd: user.currentPeriodEnd,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          monthlyAppCount: periodApps,
        });

        const adaptive = computeAdaptiveStrategy(pacing);

        let remediationActions: string | null = null;
        let escalated = false;

        if (pacing.status === "critical" || pacing.status === "at_risk") {
          const diag = await runPacingDiagnostics(user.id, periodStart);
          const remediation = await diagnoseAndRemediate(user.id, pacing, diag);
          remediationActions = JSON.stringify(
            remediation.actions.map((a) => a.type)
          );
          escalated = remediation.requiresEscalation;

          if (escalated) {
            const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
            escalations.push({
              name,
              email: user.email,
              reason: remediation.escalationReason || "Unknown",
              pacingStatus: pacing.status,
              appsSent: pacing.appsSent,
              effectiveCap: pacing.effectiveCap,
            });
          }
        }

        await prisma.healthCheck.create({
          data: {
            userId: user.id,
            pacingStatus: pacing.status,
            appsSent: pacing.appsSent,
            effectiveCap: pacing.effectiveCap,
            daysRemaining: pacing.daysRemaining,
            dailyCapAssigned: adaptive.dailyCap,
            qualityThreshold: adaptive.qualityThreshold,
            matchMultiplier: adaptive.matchMultiplier,
            strategy: adaptive.strategy,
            remediationActions,
          },
        });

        results.push({
          userId: user.id,
          email: user.email,
          strategy: adaptive.strategy,
          dailyCap: adaptive.dailyCap,
          qualityThreshold: adaptive.qualityThreshold,
          escalated,
        });
      } catch (error) {
        console.error(`[Health Check] Error for ${user.email}:`, error);
      }
    }

    if (escalations.length > 0) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      for (const esc of escalations) {
        const existing = await prisma.adminAlert.findFirst({
          where: {
            kind: "health_escalation",
            resolvedAt: null,
            createdAt: { gte: twentyFourHoursAgo },
            metadata: { contains: esc.email },
          },
        });
        if (!existing) {
          await prisma.adminAlert.create({
            data: {
              kind: "health_escalation",
              severity: "high",
              message: `${esc.name} (${esc.email}) ${esc.pacingStatus}: ${esc.appsSent}/${esc.effectiveCap} apps. ${esc.reason}`,
              metadata: JSON.stringify({
                email: esc.email,
                pacingStatus: esc.pacingStatus,
                appsSent: esc.appsSent,
                effectiveCap: esc.effectiveCap,
              }),
            },
          });
        }
      }
      console.log(
        `[Health Check] ${escalations.length} escalations created`
      );
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const strategyCounts = results.reduce(
      (acc, r) => {
        acc[r.strategy] = (acc[r.strategy] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const summary = {
      success: true,
      duration: `${duration}s`,
      usersAssessed: results.length,
      strategies: strategyCounts,
      escalations: escalations.length,
    };

    console.log("[Health Check] Complete:", summary);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Health Check] Failed:", error);
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
