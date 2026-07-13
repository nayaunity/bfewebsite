import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canApply, usageErrorMessage } from "@/lib/subscription";
import { matchJobsForUser } from "@/lib/auto-apply/job-matcher";
import { matchUserResume } from "@/lib/resume-matcher";
import { ensureApplicationEmail } from "@/lib/application-email";
import { calculatePacing } from "@/lib/pacing";
import { createPlannedBrowseSession } from "@/lib/auto-apply/planned-session";

export const runtime = "nodejs";
export const maxDuration = 300;

const DEFAULT_DAILY_CAP = 10;
const CATCHUP_DAILY_CAP = 30;

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check tier limits — gating reasons (payment-failed, trial-required,
  // monthly-cap) are surfaced via canApply().reason; share copy through
  // usageErrorMessage so the start/browse/apply paths stay in sync.
  const usage = await canApply(userId);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: usageErrorMessage(usage), usage },
      { status: 403 }
    );
  }

  // Check no existing active session
  const activeSession = await prisma.browseSession.findFirst({
    where: {
      userId,
      status: { in: ["planning", "queued", "processing", "awaiting_review"] },
    },
  });

  if (activeSession) {
    return NextResponse.json(
      { error: "You already have an active session. Please wait for it to complete.", sessionId: activeSession.id },
      { status: 409 }
    );
  }

  // Fetch user for pacing + profile validation
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      targetRole: true,
      subscribedAt: true,
      createdAt: true,
      currentPeriodEnd: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      monthlyAppCount: true,
    },
  });

  if (!user?.targetRole) {
    return NextResponse.json(
      { error: "Please set your target roles in your profile first." },
      { status: 400 }
    );
  }

  // Per-user daily cap: on-track users get 10/day, behind users catch up
  const pacing = calculatePacing({
    subscribedAt: user.subscribedAt,
    createdAt: user.createdAt,
    currentPeriodEnd: user.currentPeriodEnd,
    subscriptionTier: user.subscriptionTier || "free",
    subscriptionStatus: user.subscriptionStatus || "active",
    monthlyAppCount: user.monthlyAppCount,
  });
  const dailyCap = pacing.status === "on_track"
    ? DEFAULT_DAILY_CAP
    : CATCHUP_DAILY_CAP;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayApplied = await prisma.browseDiscovery.count({
    where: {
      session: { userId },
      status: "applied",
      createdAt: { gte: todayStart },
    },
  });

  if (todayApplied >= dailyCap) {
    return NextResponse.json(
      { error: "Daily limit reached. Try again tomorrow." },
      { status: 403 }
    );
  }

  const remaining = Math.min(dailyCap - todayApplied, usage.remaining);

  // Match jobs — 3x for backup on failures
  const matchedJobs = await matchJobsForUser(userId, remaining * 3);

  if (matchedJobs.length === 0) {
    return NextResponse.json(
      { error: "No new matching jobs found right now. Check back tomorrow — we refresh daily." },
      { status: 404 }
    );
  }

  // Parse primary role
  let primaryRole = "Software Engineer";
  try {
    const roles = JSON.parse(user.targetRole || "[]");
    if (Array.isArray(roles) && roles.length > 0) primaryRole = roles[0];
  } catch {
    if (user.targetRole) primaryRole = user.targetRole;
  }

  // Find resume
  const resume = await matchUserResume(userId, primaryRole, primaryRole);
  if (!resume) {
    return NextResponse.json(
      { error: "No resume found. Please upload a resume first." },
      { status: 400 }
    );
  }

  // Ensure application email
  await ensureApplicationEmail(userId);

  const companiesWithJobs = [...new Set(matchedJobs.map((j) => j.company))];
  const planningJobs = matchedJobs.map((job) => ({
    id: job.id,
    title: job.title,
    applyUrl: job.applyUrl,
    company: job.company,
    companySlug: job.companySlug,
    score: job.score,
    matchReason: job.matchReason,
  }));

  const plannedSession = await createPlannedBrowseSession({
    userId,
    targetRole: primaryRole,
    matchedJobs: planningJobs,
    resumeUrl: resume.blobUrl,
    resumeName: resume.fileName,
    companies: companiesWithJobs,
    totalCompanies: companiesWithJobs.length,
  });

  const { planning } = plannedSession;
  const browseSessionId = plannedSession.sessionId;

  const messageParts: string[] = [];
  if (planning.autoSubmitCount > 0) {
    messageParts.push(`Queued ${planning.autoSubmitCount} high-confidence applications`);
  }
  if (planning.pendingReviewCount > 0) {
    messageParts.push(`${planning.pendingReviewCount} application${planning.pendingReviewCount === 1 ? "" : "s"} waiting for your review`);
  }
  if (planning.skippedCount > 0) {
    messageParts.push(`Skipped ${planning.skippedCount} low-confidence or unsupported job${planning.skippedCount === 1 ? "" : "s"}`);
  }
  const message =
    messageParts.join(". ") ||
    "Planning finished, but no jobs were ready to submit right now.";

  return NextResponse.json({
    success: true,
    sessionId: browseSessionId,
    matchedJobs: matchedJobs.length,
    companies: companiesWithJobs,
    planningRunId: planning.planningRunId,
    pendingReviewCount: planning.pendingReviewCount,
    autoSubmitCount: planning.autoSubmitCount,
    skippedCount: planning.skippedCount,
    sessionStatus: planning.sessionStatus,
    message,
  });
}
