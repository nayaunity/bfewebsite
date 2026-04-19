import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Save the resume-extracted fields the user reviewed on /onboarding/review.
 * Sets detailsReviewedAt = now so the page stops being a required-first-time
 * gate and behaves like a normal profile editor on subsequent visits.
 *
 * Only writes the fields we auto-extract during onboarding (per
 * /api/onboarding/promote/route.ts:74-81). Other profile edits live elsewhere.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  const trimOrNull = (v: unknown) => {
    if (typeof v !== "string") return null;
    const s = v.trim();
    return s.length > 0 ? s : null;
  };

  // Only the resume-extracted fields. Pass through unchanged null/empty values
  // so a user can clear a wrong extraction (e.g. wrong currentEmployer).
  const update = {
    firstName: trimOrNull(body.firstName),
    lastName: trimOrNull(body.lastName),
    phone: trimOrNull(body.phone),
    linkedinUrl: trimOrNull(body.linkedinUrl),
    currentTitle: trimOrNull(body.currentTitle),
    currentEmployer: trimOrNull(body.currentEmployer),
    yearsOfExperience: trimOrNull(body.yearsOfExperience),
    school: trimOrNull(body.school),
    degree: trimOrNull(body.degree),
    detailsReviewedAt: new Date(),
  };

  await prisma.user.update({ where: { id: session.user.id }, data: update });

  return NextResponse.json({ ok: true });
}
