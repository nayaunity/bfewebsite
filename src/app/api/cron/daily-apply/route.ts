import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canApply } from "@/lib/subscription";
import { matchJobsForUser } from "@/lib/auto-apply/job-matcher";
import { matchUserResume } from "@/lib/resume-matcher";
import { ensureApplicationEmail } from "@/lib/application-email";

export const runtime = "nodejs";
export const maxDuration = 300;

const DAILY_CAP = 10;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Daily Apply] Starting automated job matching...");
    const startTime = Date.now();

    // Find eligible users: complete profile with apps remaining (any tier)
    const eligibleUsers = await prisma.user.findMany({
      where: {
        firstName: { not: null },
        lastName: { not: null },
        phone: { not: null },
        workAuthorized: { not: null },
        countryOfResidence: { not: null },
        targetRole: { not: null },
        resumes: { some: {} }, // Has at least one resume
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        targetRole: true,
      },
    });

    console.log(`[Daily Apply] Found ${eligibleUsers.length} eligible users`);

    const results: Array<{
      userId: string;
      email: string;
      status: string;
      matchedJobs: number;
      sessionId?: string;
    }> = [];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (const user of eligibleUsers) {
      try {
        // Check tier limits
        const usage = await canApply(user.id);
        if (!usage.allowed) {
          results.push({
            userId: user.id,
            email: user.email,
            status: "skipped_monthly_limit",
            matchedJobs: 0,
          });
          continue;
        }

        // Check no existing active session
        const activeSession = await prisma.browseSession.findFirst({
          where: {
            userId: user.id,
            status: { in: ["queued", "processing"] },
          },
        });

        if (activeSession) {
          results.push({
            userId: user.id,
            email: user.email,
            status: "skipped_active_session",
            matchedJobs: 0,
          });
          continue;
        }

        // Check daily cap
        const todayApplied = await prisma.browseDiscovery.count({
          where: {
            session: { userId: user.id },
            status: "applied",
            createdAt: { gte: todayStart },
          },
        });

        if (todayApplied >= DAILY_CAP) {
          results.push({
            userId: user.id,
            email: user.email,
            status: "skipped_daily_cap",
            matchedJobs: 0,
          });
          continue;
        }

        const remaining = Math.min(DAILY_CAP - todayApplied, usage.remaining);

        // Match 3x more jobs than needed so the worker has backups when applications fail
        const matchedJobs = await matchJobsForUser(user.id, remaining * 3);

        if (matchedJobs.length === 0) {
          results.push({
            userId: user.id,
            email: user.email,
            status: "no_matches",
            matchedJobs: 0,
          });
          continue;
        }

        // Group matched jobs by company
        const companiesWithJobs = [
          ...new Set(matchedJobs.map((j) => j.company)),
        ];

        // Parse user's roles to find primary role for search terms
        let primaryRole = "Software Engineer";
        try {
          const roles = JSON.parse(user.targetRole || "[]");
          if (Array.isArray(roles) && roles.length > 0) primaryRole = roles[0];
        } catch {
          if (user.targetRole) primaryRole = user.targetRole;
        }

        // Find best resume for this role
        const resume = await matchUserResume(user.id, primaryRole, primaryRole);
        if (!resume) {
          results.push({
            userId: user.id,
            email: user.email,
            status: "no_resume",
            matchedJobs: 0,
          });
          continue;
        }

        // Ensure application email exists
        await ensureApplicationEmail(user.id);

        // Create browse session with pre-matched jobs — worker skips discovery
        const session = await prisma.browseSession.create({
          data: {
            userId: user.id,
            targetRole: primaryRole,
            companies: JSON.stringify(companiesWithJobs),
            matchedJobs: JSON.stringify(
              matchedJobs.map((j) => ({
                title: j.title,
                applyUrl: j.applyUrl,
                company: j.company,
              }))
            ),
            resumeUrl: resume.blobUrl,
            resumeName: resume.fileName,
            totalCompanies: companiesWithJobs.length,
          },
        });

        results.push({
          userId: user.id,
          email: user.email,
          status: "session_created",
          matchedJobs: matchedJobs.length,
          sessionId: session.id,
        });

        console.log(
          `[Daily Apply] ${user.email}: ${matchedJobs.length} matches across ${companiesWithJobs.length} companies → session ${session.id}`
        );
      } catch (error) {
        console.error(`[Daily Apply] Error for ${user.email}:`, error);
        results.push({
          userId: user.id,
          email: user.email,
          status: "error",
          matchedJobs: 0,
        });
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const sessionsCreated = results.filter(
      (r) => r.status === "session_created"
    ).length;

    const summary = {
      success: true,
      duration: `${duration}s`,
      eligibleUsers: eligibleUsers.length,
      sessionsCreated,
      results,
    };

    console.log("[Daily Apply] Complete:", {
      duration: `${duration}s`,
      eligible: eligibleUsers.length,
      sessionsCreated,
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[Daily Apply] Failed:", error);
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
