import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canApply } from "@/lib/subscription";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ step: "auth", error: "No session" });
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true, email: true, createdAt: true, emailVerified: true, role: true,
          firstName: true, lastName: true, phone: true, preferredName: true, pronouns: true,
          autoApplyEnabled: true, usState: true, workAuthorized: true, needsSponsorship: true,
          countryOfResidence: true, willingToRelocate: true, remotePreference: true,
          linkedinUrl: true, githubUrl: true, websiteUrl: true,
          currentEmployer: true, currentTitle: true, school: true, degree: true,
          graduationYear: true, additionalCerts: true, city: true,
          yearsOfExperience: true, targetRole: true, salaryExpectation: true,
          earliestStartDate: true, gender: true, race: true, hispanicOrLatino: true,
          veteranStatus: true, disabilityStatus: true, applicationAnswers: true,
          onboardingData: true, subscriptionTier: true, subscriptionStatus: true,
          stripeCustomerId: true, resumeUrl: true, resumeName: true, resumeUpdatedAt: true,
          resumes: { orderBy: { uploadedAt: "desc" }, select: { id: true, name: true, fileName: true, blobUrl: true, keywords: true, isFallback: true, uploadedAt: true } },
          _count: { select: { progress: true, microWins: true } },
        },
      });
    } catch (e) {
      return NextResponse.json({ step: "getUserData", error: e instanceof Error ? e.message : String(e) });
    }

    if (!user) {
      return NextResponse.json({ step: "getUserData", error: "User not found", userId: session.user.id });
    }

    let usage;
    try {
      usage = await canApply(session.user.id);
    } catch (e) {
      return NextResponse.json({ step: "canApply", error: e instanceof Error ? e.message : String(e) });
    }

    return NextResponse.json({
      ok: true,
      session: { id: session.user.id, email: session.user.email },
      user: { id: user.id, role: user.role, tier: user.subscriptionTier },
      usage,
    });
  } catch (error) {
    return NextResponse.json({
      step: "unknown",
      error: error instanceof Error ? { message: error.message, stack: error.stack?.split("\n").slice(0, 5) } : String(error),
    }, { status: 500 });
  }
}
