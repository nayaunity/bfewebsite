import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { batchApply } from "@/lib/auto-apply/batch-apply";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      resumeUrl: true,
      resumeName: true,
      role: true,
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
  if (!user.resumeUrl) missing.push("resume");

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `Missing required fields: ${missing.join(", ")}. Please complete your profile first.`,
      },
      { status: 400 }
    );
  }

  try {
    const result = await batchApply(user.id, {
      firstName: user.firstName!,
      lastName: user.lastName!,
      email: user.email,
      phone: user.phone!,
      resumeUrl: user.resumeUrl!,
      resumeName: user.resumeName || "resume.pdf",
      usState: user.usState,
      workAuthorized: user.workAuthorized,
      needsSponsorship: user.needsSponsorship,
      countryOfResidence: user.countryOfResidence,
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalEligible: result.totalEligible,
        submitted: result.submitted,
        skipped: result.skipped,
        failed: result.failed,
      },
      results: result.results,
    });
  } catch (error) {
    console.error("Auto-apply error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Auto-apply failed",
      },
      { status: 500 }
    );
  }
}
