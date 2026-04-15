import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";

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
      linkedinUrl, githubUrl, websiteUrl, currentEmployer, currentTitle,
      school, degree, city, preferredName, yearsOfExperience, targetRole,
      pronouns, willingToRelocate, remotePreference, earliestStartDate,
      graduationYear, additionalCerts, salaryExpectation,
      gender, race, hispanicOrLatino, veteranStatus, disabilityStatus,
      applicationAnswers, workLocations,
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

    if (willingToRelocate !== undefined) {
      if (willingToRelocate !== null && typeof willingToRelocate !== "boolean") {
        return NextResponse.json({ error: "Invalid willingToRelocate value" }, { status: 400 });
      }
      data.willingToRelocate = willingToRelocate;
    }

    // Optional string profile fields (max 500 chars for URLs, 200 for text)
    const optionalStringFields: Array<{ key: string; value: unknown; maxLen: number }> = [
      { key: "linkedinUrl", value: linkedinUrl, maxLen: 500 },
      { key: "githubUrl", value: githubUrl, maxLen: 500 },
      { key: "websiteUrl", value: websiteUrl, maxLen: 500 },
      { key: "currentEmployer", value: currentEmployer, maxLen: 200 },
      { key: "currentTitle", value: currentTitle, maxLen: 200 },
      { key: "school", value: school, maxLen: 200 },
      { key: "degree", value: degree, maxLen: 200 },
      { key: "city", value: city, maxLen: 100 },
      { key: "preferredName", value: preferredName, maxLen: 100 },
      { key: "yearsOfExperience", value: yearsOfExperience, maxLen: 10 },
      { key: "targetRole", value: targetRole, maxLen: 1000 },
      { key: "pronouns", value: pronouns, maxLen: 50 },
      { key: "remotePreference", value: remotePreference, maxLen: 100 },
      { key: "earliestStartDate", value: earliestStartDate, maxLen: 100 },
      { key: "graduationYear", value: graduationYear, maxLen: 10 },
      { key: "additionalCerts", value: additionalCerts, maxLen: 500 },
      { key: "salaryExpectation", value: salaryExpectation, maxLen: 500 },
      { key: "gender", value: gender, maxLen: 100 },
      { key: "race", value: race, maxLen: 200 },
      { key: "hispanicOrLatino", value: hispanicOrLatino, maxLen: 50 },
      { key: "veteranStatus", value: veteranStatus, maxLen: 200 },
      { key: "disabilityStatus", value: disabilityStatus, maxLen: 200 },
      { key: "applicationAnswers", value: applicationAnswers, maxLen: 50000 },
      { key: "workLocations", value: workLocations, maxLen: 2000 },
    ];

    for (const field of optionalStringFields) {
      if (field.value !== undefined) {
        if (field.value !== null && (typeof field.value !== "string" || field.value.length > field.maxLen)) {
          await logError({
            userId: session.user.id,
            endpoint: "/api/profile",
            method: "PATCH",
            status: 400,
            error: `Invalid ${field.key}`,
            detail: `Value length: ${typeof field.value === "string" ? field.value.length : typeof field.value}, max: ${field.maxLen}`,
          });
          return NextResponse.json({ error: `Invalid ${field.key}` }, { status: 400 });
        }
        data[field.key] = typeof field.value === "string" ? field.value.trim() || null : null;
      }
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
        linkedinUrl: true,
        githubUrl: true,
        websiteUrl: true,
        currentEmployer: true,
        currentTitle: true,
        school: true,
        degree: true,
        city: true,
        preferredName: true,
        yearsOfExperience: true,
        targetRole: true,
        pronouns: true,
        willingToRelocate: true,
        remotePreference: true,
        earliestStartDate: true,
        graduationYear: true,
        additionalCerts: true,
        salaryExpectation: true,
        gender: true,
        race: true,
        hispanicOrLatino: true,
        veteranStatus: true,
        disabilityStatus: true,
        applicationAnswers: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Profile update error:", errMsg);
    await logError({
      userId: session.user.id,
      endpoint: "/api/profile",
      method: "PATCH",
      status: 500,
      error: "Failed to update profile",
      detail: errMsg,
    });
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
