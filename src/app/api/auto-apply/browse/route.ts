import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canApply, usageErrorMessage } from "@/lib/subscription";
import {
  loadJobCatalog,
  matchJobsForProfile,
} from "@/lib/auto-apply/job-matcher";
import { createPlannedBrowseSession } from "@/lib/auto-apply/planned-session";
import { matchUserResume } from "@/lib/resume-matcher";
import { ensureApplicationEmail } from "@/lib/application-email";
import { logError } from "@/lib/error-logger";
import targetCompanies from "../../../../../scripts/target-companies.json";

export const runtime = "nodejs";

const validCompanyNames = new Set(targetCompanies.map((c) => c.name));
const companySlugByName = new Map(
  targetCompanies.map((c) => [c.name, (c as { slug?: string }).slug || ""])
);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { targetRole, roleLabel, companies } = body as {
    targetRole?: string;
    roleLabel?: string;
    companies?: string[];
  };

  if (!targetRole?.trim()) {
    return NextResponse.json(
      { error: "Target role is required" },
      { status: 400 }
    );
  }

  if (!companies || companies.length === 0) {
    return NextResponse.json(
      { error: "Select at least one company" },
      { status: 400 }
    );
  }

  const invalidCompanies = companies.filter((c) => !validCompanyNames.has(c));
  if (invalidCompanies.length > 0) {
    return NextResponse.json(
      { error: `Invalid companies: ${invalidCompanies.join(", ")}` },
      { status: 400 }
    );
  }

  // Check subscription limits — payment-failed copy lives in
  // usageErrorMessage so it stays consistent with /start and /apply.
  const usage = await canApply(session.user.id);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: usageErrorMessage(usage), usage },
      { status: 403 }
    );
  }

  // Validate profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      preferredName: true,
      pronouns: true,
      usState: true,
      workAuthorized: true,
      needsSponsorship: true,
      countryOfResidence: true,
      willingToRelocate: true,
      remotePreference: true,
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
      seekingInternship: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const missing: string[] = [];
  if (!user.firstName) missing.push("first name");
  if (!user.lastName) missing.push("last name");
  if (!user.email) missing.push("email");
  if (!user.phone) missing.push("phone");
  if (user.workAuthorized === null) missing.push("work authorization (go to Profile → Location & Work Authorization)");
  if (!user.countryOfResidence) missing.push("country of residence (go to Profile → Location & Work Authorization)");

  if (missing.length > 0) {
    await logError({
      userId: session.user.id,
      endpoint: "/api/auto-apply/browse",
      method: "POST",
      status: 400,
      error: "Incomplete profile blocked application",
      detail: `Missing: ${missing.join(", ")}`,
    });
    return NextResponse.json(
      { error: `Please complete your profile before applying. Missing: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Check no existing active session
  const existingSession = await prisma.browseSession.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["planning", "queued", "processing", "awaiting_review"] },
    },
  });

  if (existingSession) {
    return NextResponse.json(
      { error: "You already have an active browse session. Please wait for it to complete." },
      { status: 409 }
    );
  }

  // Match resume — use roleLabel (clean role name) for role-aware matching
  const resume = await matchUserResume(session.user.id, targetRole.trim(), roleLabel || targetRole.trim());
  if (!resume) {
    return NextResponse.json(
      { error: "No resume found. Please upload a resume first." },
      { status: 400 }
    );
  }

  // Ensure user has a dedicated application email
  await ensureApplicationEmail(session.user.id);

  const [browseAttempted, directApplied, companyFails, companyWins] =
    await Promise.all([
      prisma.browseDiscovery.findMany({
        where: {
          session: { userId: session.user.id },
          status: { in: ["applied", "applying", "failed"] },
        },
        select: { applyUrl: true },
      }),
      prisma.jobApplication.findMany({
        where: {
          userId: session.user.id,
          status: { in: ["submitted", "pending"] },
        },
        select: {
          job: {
            select: { applyUrl: true },
          },
        },
      }),
      prisma.browseDiscovery.groupBy({
        by: ["company"],
        where: {
          session: { userId: session.user.id },
          status: "failed",
        },
        _count: true,
      }),
      prisma.browseDiscovery.groupBy({
        by: ["company"],
        where: {
          session: { userId: session.user.id },
          status: "applied",
        },
        _count: true,
      }),
    ]);

  const excludeUrls = new Set([
    ...browseAttempted.map((item) => item.applyUrl),
    ...directApplied.map((item) => item.job.applyUrl),
  ]);
  const companyWinsByName = new Map(
    companyWins.map((item) => [item.company, item._count])
  );
  const userBlockedCompanies = new Set<string>();
  for (const failure of companyFails) {
    if (failure._count >= 4 && !(companyWinsByName.get(failure.company) ?? 0)) {
      userBlockedCompanies.add(failure.company.toLowerCase());
    }
  }

  const selectedCompanySlugs = new Set(
    companies
      .map((company) => companySlugByName.get(company) || "")
      .filter(Boolean)
  );
  const catalog = await loadJobCatalog();
  const filteredCatalog = catalog.filter(
    (job) =>
      companies.includes(job.company) ||
      selectedCompanySlugs.has(job.companySlug)
  );
  const maxJobs = Math.min(30, Math.max(5, companies.length * 5));
  const matchedJobs = await matchJobsForProfile(
    {
      targetRole: targetRole.trim(),
      remotePreference: user.remotePreference,
      usState: user.usState,
      city: user.city,
      yearsOfExperience: user.yearsOfExperience,
      countryOfResidence: user.countryOfResidence,
      degree: user.degree,
      school: user.school,
      seekingInternship: user.seekingInternship,
    },
    maxJobs,
    {
      catalog: filteredCatalog,
      excludeUrls,
      userBlockedCompanies,
    }
  );

  if (matchedJobs.length === 0) {
    return NextResponse.json(
      {
        error:
          "No supported catalog jobs matched this role at the companies you selected right now.",
      },
      { status: 404 }
    );
  }

  const plannedSession = await createPlannedBrowseSession({
    userId: session.user.id,
    targetRole: targetRole.trim(),
    matchedJobs: matchedJobs.map((job) => ({
      id: job.id,
      title: job.title,
      applyUrl: job.applyUrl,
      company: job.company,
      companySlug: job.companySlug,
      score: job.score,
      matchReason: job.matchReason,
    })),
    resumeUrl: resume.blobUrl,
    resumeName: resume.fileName,
    companies,
    totalCompanies: companies.length,
    seekingInternship: user.seekingInternship === true,
  });

  const messageParts: string[] = [];
  if (plannedSession.planning.autoSubmitCount > 0) {
    messageParts.push(
      `Queued ${plannedSession.planning.autoSubmitCount} high-confidence applications`
    );
  }
  if (plannedSession.planning.pendingReviewCount > 0) {
    messageParts.push(
      `${plannedSession.planning.pendingReviewCount} application${
        plannedSession.planning.pendingReviewCount === 1 ? "" : "s"
      } waiting for your review`
    );
  }
  if (plannedSession.planning.skippedCount > 0) {
    messageParts.push(
      `Skipped ${plannedSession.planning.skippedCount} low-confidence or unsupported job${
        plannedSession.planning.skippedCount === 1 ? "" : "s"
      }`
    );
  }

  return NextResponse.json({
    success: true,
    sessionId: plannedSession.sessionId,
    matchedJobs: matchedJobs.length,
    planningRunId: plannedSession.planning.planningRunId,
    pendingReviewCount: plannedSession.planning.pendingReviewCount,
    autoSubmitCount: plannedSession.planning.autoSubmitCount,
    skippedCount: plannedSession.planning.skippedCount,
    sessionStatus: plannedSession.planning.sessionStatus,
    message:
      messageParts.join(". ") ||
      `Planning finished for ${companies.length} companies, but nothing is ready to submit yet.`,
  });
}
