import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";
import {
  GENDER_OPTIONS,
  RACE_OPTIONS,
  YES_NO_DECLINE,
  VETERAN_OPTIONS,
  DISABILITY_OPTIONS,
  PRONOUN_OPTIONS,
} from "@/lib/eeo-options";

/**
 * Persists the mandatory self-identification (EEO + work-auth) answers
 * collected on /onboarding/self-identification immediately after Stripe
 * checkout. Mirrors /api/profile/review (sets a *CompletedAt timestamp
 * that the dashboard pages use as a gate).
 *
 * The 5 demographic + pronouns fields must be one of the allowed values
 * (which include "Prefer not to say"). workAuthorized + needsSponsorship
 * must be real booleans because most job apps hard-filter on them.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  const allowedOrNull = (v: unknown, allowed: readonly string[]) =>
    typeof v === "string" && allowed.includes(v) ? v : null;

  const gender = allowedOrNull(body.gender, GENDER_OPTIONS);
  const race = allowedOrNull(body.race, RACE_OPTIONS);
  const hispanicOrLatino = allowedOrNull(body.hispanicOrLatino, YES_NO_DECLINE);
  const veteranStatus = allowedOrNull(body.veteranStatus, VETERAN_OPTIONS);
  const disabilityStatus = allowedOrNull(body.disabilityStatus, DISABILITY_OPTIONS);

  // Pronouns: dropdown value must be a known option. "Other" means the user
  // typed something custom in pronounsCustom; persist the custom value.
  let pronouns: string | null = null;
  const pronounChoice = typeof body.pronouns === "string" ? body.pronouns : "";
  if (pronounChoice === "Other") {
    const custom = typeof body.pronounsCustom === "string" ? body.pronounsCustom.trim() : "";
    if (custom.length > 0 && custom.length <= 50) pronouns = custom;
  } else if (PRONOUN_OPTIONS.includes(pronounChoice as (typeof PRONOUN_OPTIONS)[number])) {
    pronouns = pronounChoice;
  }

  const workAuthorized = typeof body.workAuthorized === "boolean" ? body.workAuthorized : null;
  const needsSponsorship = typeof body.needsSponsorship === "boolean" ? body.needsSponsorship : null;

  const missing: string[] = [];
  if (!gender) missing.push("gender");
  if (!race) missing.push("race");
  if (!hispanicOrLatino) missing.push("hispanicOrLatino");
  if (!veteranStatus) missing.push("veteranStatus");
  if (!disabilityStatus) missing.push("disabilityStatus");
  if (!pronouns) missing.push("pronouns");
  if (workAuthorized === null) missing.push("workAuthorized");
  if (needsSponsorship === null) missing.push("needsSponsorship");

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "All fields are required.", missing },
      { status: 400 }
    );
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        gender,
        race,
        hispanicOrLatino,
        veteranStatus,
        disabilityStatus,
        pronouns,
        workAuthorized,
        needsSponsorship,
        selfIdCompletedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await logError({
      userId: session.user.id,
      endpoint: "/api/profile/self-identification",
      method: "POST",
      status: 500,
      error: "Failed to save self-identification",
      detail,
    });
    return NextResponse.json(
      { error: "Could not save. Please try again." },
      { status: 500 }
    );
  }
}
