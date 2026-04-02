import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canApply } from "@/lib/subscription";
import { matchUserResume } from "@/lib/resume-matcher";
import { ensureApplicationEmail } from "@/lib/application-email";
import targetCompanies from "../../../../../scripts/target-companies.json";

export const runtime = "nodejs";

const validCompanyNames = new Set(targetCompanies.map((c) => c.name));

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

  // Check subscription limits
  const usage = await canApply(session.user.id);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: `Monthly limit reached (${usage.used}/${usage.limit}). Upgrade for more.`, usage },
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

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Check no existing active session
  const existingSession = await prisma.browseSession.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["queued", "processing"] },
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

  // Create browse session
  const browseSession = await prisma.browseSession.create({
    data: {
      userId: session.user.id,
      targetRole: targetRole.trim(),
      companies: JSON.stringify(companies),
      resumeUrl: resume.blobUrl,
      resumeName: resume.fileName,
      totalCompanies: companies.length,
    },
  });

  return NextResponse.json({
    success: true,
    sessionId: browseSession.id,
    message: `Browse session started for ${companies.length} companies`,
  });
}
