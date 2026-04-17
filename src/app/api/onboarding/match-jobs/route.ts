import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchJobsForProfile, type MatchProfile } from "@/lib/auto-apply/job-matcher";

export const runtime = "nodejs";
export const maxDuration = 60;

const COOKIE_NAME = "bfe_temp_id";

function remoteToPreference(remote: string | null): string | null {
  if (!remote) return null;
  if (remote === "Remote") return "Remote";
  if (remote === "Hybrid") return "Remote or Hybrid";
  return "On-site";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tempId = (body.tempId as string | undefined) ?? request.cookies.get(COOKIE_NAME)?.value;
    if (!tempId) {
      return NextResponse.json({ error: "Missing tempId" }, { status: 400 });
    }

    const temp = await prisma.tempOnboarding.findUnique({ where: { id: tempId } });
    if (!temp || temp.linkedToUserId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!temp.confirmedRoles) {
      return NextResponse.json({ error: "Confirm your profile first" }, { status: 400 });
    }

    const extracted = temp.extractedData ? safeParse(temp.extractedData) : null;
    const yearsRaw = extracted?.yearsOfExperience;
    const years = typeof yearsRaw === "number" ? Math.round(yearsRaw).toString() : null;

    const profile: MatchProfile = {
      targetRole: temp.confirmedRoles,
      remotePreference: remoteToPreference(temp.confirmedRemote),
      usState: temp.confirmedState,
      city: temp.confirmedCity,
      yearsOfExperience: years,
      countryOfResidence: temp.confirmedCountry,
      degree: typeof extracted?.education === "object" && extracted.education
        ? (extracted.education as { degree?: string | null }).degree ?? null
        : null,
      school: typeof extracted?.education === "object" && extracted.education
        ? (extracted.education as { school?: string | null }).school ?? null
        : null,
    };

    const jobs = await matchJobsForProfile(profile, 10);

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("match-jobs error", error);
    return NextResponse.json({ error: "Failed to match jobs" }, { status: 500 });
  }
}

function safeParse(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
