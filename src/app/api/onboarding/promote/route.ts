import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const COOKIE_NAME = "bfe_temp_id";

function remoteToPreference(remote: string | null): string | null {
  if (!remote) return null;
  if (remote === "Remote") return "Remote";
  if (remote === "Hybrid") return "Remote or Hybrid";
  return "On-site";
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const tempId = request.cookies.get(COOKIE_NAME)?.value ?? (await request.json().catch(() => ({}))).tempId;
    if (!tempId) {
      return NextResponse.json({ skipped: "no-temp-id" });
    }

    const temp = await prisma.tempOnboarding.findUnique({ where: { id: tempId } });
    if (!temp) {
      return NextResponse.json({ skipped: "not-found" });
    }
    if (temp.linkedToUserId) {
      return NextResponse.json({ skipped: "already-linked" });
    }

    const extracted = temp.extractedData ? safeParse(temp.extractedData) : null;

    const profileUpdate: Record<string, unknown> = {
      onboardingCompletedAt: new Date(),
      autoApplyEnabled: true,
    };

    if (temp.confirmedRoles) profileUpdate.targetRole = temp.confirmedRoles;
    if (temp.confirmedRemote) {
      const pref = remoteToPreference(temp.confirmedRemote);
      if (pref) profileUpdate.remotePreference = pref;
    }
    if (temp.confirmedWorkAuth !== null && temp.confirmedWorkAuth !== undefined) {
      profileUpdate.workAuthorized = temp.confirmedWorkAuth;
    }
    if (temp.confirmedCity) profileUpdate.city = temp.confirmedCity;
    if (temp.confirmedState) profileUpdate.usState = temp.confirmedState;
    if (temp.confirmedCountry) profileUpdate.countryOfResidence = temp.confirmedCountry;
    if (temp.confirmedSeekingInternship === true || temp.confirmedSeekingInternship === false) {
      profileUpdate.seekingInternship = temp.confirmedSeekingInternship;
    }
    if (temp.resumeBlobUrl) {
      profileUpdate.resumeUrl = temp.resumeBlobUrl;
      profileUpdate.resumeName = temp.resumeName;
      profileUpdate.resumeUpdatedAt = new Date();
    }

    if (extracted) {
      const firstName = strField(extracted.firstName);
      const lastName = strField(extracted.lastName);
      const phone = strField(extracted.phone);
      const linkedin = strField(extracted.linkedinUrl);
      const currentTitle = strField(extracted.currentTitle);
      const years = typeof extracted.yearsOfExperience === "number"
        ? Math.round(extracted.yearsOfExperience).toString()
        : null;
      const education = typeof extracted.education === "object" && extracted.education
        ? extracted.education as { degree?: string | null; school?: string | null }
        : null;

      if (firstName) profileUpdate.firstName = firstName;
      if (lastName) profileUpdate.lastName = lastName;
      if (phone) profileUpdate.phone = phone;
      if (linkedin) profileUpdate.linkedinUrl = linkedin;
      if (currentTitle) profileUpdate.currentTitle = currentTitle;
      if (years) profileUpdate.yearsOfExperience = years;
      if (education?.degree) profileUpdate.degree = education.degree;
      if (education?.school) profileUpdate.school = education.school;

      // Resume-extracted graduation year. The extractor populates this when
      // it sees an "Expected: May 2027" / "Class of 2026" / dated education
      // entry. If the user didn't explicitly check the internship-only box
      // in ConfirmExtractionStep but their resume reads as a current
      // student, default them in (they can flip it later on /profile).
      const gradYear = typeof extracted.graduationYear === "number" ? extracted.graduationYear : null;
      if (gradYear && gradYear > 1900 && gradYear < 2100) {
        profileUpdate.graduationYear = String(gradYear);
        if (profileUpdate.seekingInternship === undefined) {
          const currentYear = new Date().getFullYear();
          const yearsNum = years ? parseFloat(years) : NaN;
          const isStudent =
            gradYear >= currentYear &&
            gradYear <= currentYear + 2 &&
            (Number.isNaN(yearsNum) || yearsNum < 2);
          if (isStudent) profileUpdate.seekingInternship = true;
        }
      }

      if (temp.confirmedCity === null && typeof extracted.city === "string") {
        profileUpdate.city = extracted.city;
      }
      if (temp.confirmedState === null && typeof extracted.state === "string") {
        profileUpdate.usState = extracted.state;
      }
      if (temp.confirmedCountry === null && typeof extracted.country === "string") {
        profileUpdate.countryOfResidence = extracted.country;
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: profileUpdate,
    });

    await prisma.tempOnboarding.update({
      where: { id: tempId },
      data: { linkedToUserId: userId, linkedAt: new Date() },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    console.error("promote error", error);
    return NextResponse.json({ error: "Failed to link onboarding data" }, { status: 500 });
  }
}

function strField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function safeParse(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
