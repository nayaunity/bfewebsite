import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canApply, incrementAppCount, usageErrorMessage } from "@/lib/subscription";
import { matchUserResume } from "@/lib/resume-matcher";
import { ensureApplicationEmail } from "@/lib/application-email";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription limits — payment-failed and trial-required surfaces
  // route through usageErrorMessage so a card decline never shows up as a
  // "monthly limit reached" error.
  const usage = await canApply(session.user.id);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: usageErrorMessage(usage), usage },
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
      preferredName: true,
      pronouns: true,
      usState: true,
      workAuthorized: true,
      needsSponsorship: true,
      countryOfResidence: true,
      willingToRelocate: true,
      remotePreference: true,
      targetRole: true,
      linkedinUrl: true,
      githubUrl: true,
      websiteUrl: true,
      currentEmployer: true,
      currentTitle: true,
      school: true,
      degree: true,
      graduationYear: true,
      additionalCerts: true,
      city: true,
      yearsOfExperience: true,
      salaryExpectation: true,
      earliestStartDate: true,
      gender: true,
      race: true,
      hispanicOrLatino: true,
      veteranStatus: true,
      disabilityStatus: true,
      applicationAnswers: true,
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
      preferredName: user.preferredName,
      pronouns: user.pronouns,
      usState: user.usState,
      workAuthorized: user.workAuthorized,
      needsSponsorship: user.needsSponsorship,
      countryOfResidence: user.countryOfResidence,
      willingToRelocate: user.willingToRelocate,
      remotePreference: user.remotePreference,
      linkedinUrl: user.linkedinUrl,
      githubUrl: user.githubUrl,
      websiteUrl: user.websiteUrl,
      currentEmployer: user.currentEmployer,
      currentTitle: user.currentTitle,
      school: user.school,
      degree: user.degree,
      graduationYear: user.graduationYear,
      additionalCerts: user.additionalCerts,
      city: user.city,
      yearsOfExperience: user.yearsOfExperience,
      salaryExpectation: user.salaryExpectation,
      earliestStartDate: user.earliestStartDate,
      gender: user.gender,
      race: user.race,
      hispanicOrLatino: user.hispanicOrLatino,
      veteranStatus: user.veteranStatus,
      disabilityStatus: user.disabilityStatus,
      applicationAnswers: user.applicationAnswers,
    });

    let queued = 0;
    let skipped = 0;

    for (const job of jobsToQueue) {
      // Match a resume for this job — use profile targetRole for role-aware matching
      const resume = await matchUserResume(session.user.id, job.title, user.targetRole || undefined);
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
