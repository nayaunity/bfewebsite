import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canApply, usageErrorMessage } from "@/lib/subscription";
import { matchJobsForUser } from "@/lib/auto-apply/job-matcher";
import { matchUserResume } from "@/lib/resume-matcher";
import { ensureApplicationEmail } from "@/lib/application-email";

export const runtime = "nodejs";

const DAILY_CAP = 10;

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
      status: { in: ["queued", "processing"] },
    },
  });

  if (activeSession) {
    return NextResponse.json(
      { error: "You already have an active session. Please wait for it to complete.", sessionId: activeSession.id },
      { status: 409 }
    );
  }

  // Check daily cap
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayApplied = await prisma.browseDiscovery.count({
    where: {
      session: { userId },
      status: "applied",
      createdAt: { gte: todayStart },
    },
  });

  if (todayApplied >= DAILY_CAP) {
    return NextResponse.json(
      { error: "Daily limit reached (10 applications per day). Try again tomorrow." },
      { status: 403 }
    );
  }

  // Validate profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      targetRole: true,
    },
  });

  if (!user?.targetRole) {
    return NextResponse.json(
      { error: "Please set your target roles in your profile first." },
      { status: 400 }
    );
  }

  const remaining = Math.min(DAILY_CAP - todayApplied, usage.remaining);

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

  // Group by company
  const companiesWithJobs = [...new Set(matchedJobs.map((j) => j.company))];

  // Create FAST session
  const browseSession = await prisma.browseSession.create({
    data: {
      userId,
      targetRole: primaryRole,
      companies: JSON.stringify(companiesWithJobs),
      matchedJobs: JSON.stringify(
        matchedJobs.map((j) => ({
          title: j.title,
          applyUrl: j.applyUrl,
          company: j.company,
          matchScore: j.score,
          matchReason: j.matchReason,
        }))
      ),
      resumeUrl: resume.blobUrl,
      resumeName: resume.fileName,
      totalCompanies: companiesWithJobs.length,
    },
  });

  return NextResponse.json({
    success: true,
    sessionId: browseSession.id,
    matchedJobs: matchedJobs.length,
    companies: companiesWithJobs,
    message: `Found ${matchedJobs.length} matching jobs across ${companiesWithJobs.length} companies. Applying now.`,
  });
}
