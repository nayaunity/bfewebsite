import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      firstName, lastName, phone, autoApplyEnabled,
      usState, workAuthorized, needsSponsorship, countryOfResidence,
    } = body;

    const data: Record<string, unknown> = {};

    if (firstName !== undefined) {
      if (typeof firstName !== "string" || firstName.length > 100) {
        return NextResponse.json({ error: "Invalid first name" }, { status: 400 });
      }
      data.firstName = firstName.trim() || null;
    }

    if (lastName !== undefined) {
      if (typeof lastName !== "string" || lastName.length > 100) {
        return NextResponse.json({ error: "Invalid last name" }, { status: 400 });
      }
      data.lastName = lastName.trim() || null;
    }

    if (phone !== undefined) {
      if (typeof phone !== "string" || phone.length > 20) {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }
      data.phone = phone.trim() || null;
    }

    if (autoApplyEnabled !== undefined) {
      if (typeof autoApplyEnabled !== "boolean") {
        return NextResponse.json({ error: "Invalid autoApplyEnabled value" }, { status: 400 });
      }
      data.autoApplyEnabled = autoApplyEnabled;
    }

    if (usState !== undefined) {
      if (usState !== null && (typeof usState !== "string" || usState.length > 100)) {
        return NextResponse.json({ error: "Invalid US state" }, { status: 400 });
      }
      data.usState = usState?.trim() || null;
    }

    if (workAuthorized !== undefined) {
      if (workAuthorized !== null && typeof workAuthorized !== "boolean") {
        return NextResponse.json({ error: "Invalid work authorization value" }, { status: 400 });
      }
      data.workAuthorized = workAuthorized;
    }

    if (needsSponsorship !== undefined) {
      if (needsSponsorship !== null && typeof needsSponsorship !== "boolean") {
        return NextResponse.json({ error: "Invalid sponsorship value" }, { status: 400 });
      }
      data.needsSponsorship = needsSponsorship;
    }

    if (countryOfResidence !== undefined) {
      if (countryOfResidence !== null && (typeof countryOfResidence !== "string" || countryOfResidence.length > 100)) {
        return NextResponse.json({ error: "Invalid country" }, { status: 400 });
      }
      data.countryOfResidence = countryOfResidence?.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        autoApplyEnabled: true,
        usState: true,
        workAuthorized: true,
        needsSponsorship: true,
        countryOfResidence: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
