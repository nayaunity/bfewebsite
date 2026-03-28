import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canApply, incrementAppCount } from "@/lib/subscription";
import { matchUserResume } from "@/lib/resume-matcher";
import { ensureApplicationEmail } from "@/lib/application-email";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription limits
  const usage = await canApply(session.user.id);
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: `Monthly limit reached (${usage.used}/${usage.limit}). Upgrade your plan for more applications.`,
        usage,
      },
      { status: 403 }
    );
  }

  // Fetch user profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      usState: true,
      workAuthorized: true,
      needsSponsorship: true,
      countryOfResidence: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Validate required fields
  const missing: string[] = [];
  if (!user.firstName) missing.push("first name");
  if (!user.lastName) missing.push("last name");
  if (!user.email) missing.push("email");
  if (!user.phone) missing.push("phone");

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Check user has at least one resume
  const resumeCount = await prisma.userResume.count({
    where: { userId: session.user.id },
  });
  if (resumeCount === 0) {
    return NextResponse.json(
      { error: "Please upload at least one resume before applying" },
      { status: 400 }
    );
  }

  try {
    // Get all active jobs not already applied to or queued
    const [appliedJobs, queuedJobs] = await Promise.all([
      prisma.jobApplication.findMany({
        where: {
          userId: session.user.id,
          status: { in: ["submitted", "pending"] },
        },
        select: { jobId: true },
      }),
      prisma.applyQueue.findMany({
        where: {
          userId: session.user.id,
          status: { in: ["queued", "processing"] },
        },
        select: { jobId: true },
      }),
    ]);

    const excludeJobIds = new Set([
      ...appliedJobs.map((a) => a.jobId),
      ...queuedJobs.map((q) => q.jobId),
    ]);

    const activeJobs = await prisma.job.findMany({
      where: { isActive: true },
      select: {
        id: true,
        company: true,
        companySlug: true,
        title: true,
        applyUrl: true,
      },
    });

    const eligibleJobs = activeJobs.filter((j) => !excludeJobIds.has(j.id));

    // Cap at remaining monthly quota
    const maxToQueue = Math.min(eligibleJobs.length, usage.remaining);
    const jobsToQueue = eligibleJobs.slice(0, maxToQueue);

    // Use dedicated application email for forms (so we can read verification codes)
    const applicationEmail = await ensureApplicationEmail(session.user.id);
    const applicantData = JSON.stringify({
      firstName: user.firstName,
      lastName: user.lastName,
      email: applicationEmail,
      phone: user.phone,
      usState: user.usState,
      workAuthorized: user.workAuthorized,
      needsSponsorship: user.needsSponsorship,
      countryOfResidence: user.countryOfResidence,
    });

    let queued = 0;
    let skipped = 0;

    for (const job of jobsToQueue) {
      // Match a resume for this job
      const resume = await matchUserResume(session.user.id, job.title);
      if (!resume) {
        skipped++;
        continue;
      }

      // Insert into queue
      await prisma.applyQueue.create({
        data: {
          userId: session.user.id,
          jobId: job.id,
          resumeUrl: resume.blobUrl,
          resumeName: resume.fileName,
          applicantData,
        },
      });
      queued++;
    }

    // Increment usage counter
    if (queued > 0) {
      await incrementAppCount(session.user.id, queued);
    }

    return NextResponse.json({
      success: true,
      summary: {
        eligible: eligibleJobs.length,
        queued,
        skipped,
        remainingThisMonth: usage.remaining - queued,
      },
    });
  } catch (error) {
    console.error("Auto-apply error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auto-apply failed" },
      { status: 500 }
    );
  }
}
