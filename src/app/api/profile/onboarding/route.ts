import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Store full onboarding wizard data as JSON in user record.
    // Auto-apply is the product promise — flip it on by default when the user
    // finishes the wizard so they don't have to hunt for a toggle. They can
    // still turn it off later from the profile page.
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingData: JSON.stringify(data),
        onboardingCompletedAt: new Date(),
        autoApplyEnabled: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
