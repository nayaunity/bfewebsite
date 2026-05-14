import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getReferralAccessForUser, getWarmMatchesForUser } from "@/lib/referrals/server";
import { isReferralAssistEnabledForEmail } from "@/lib/referrals/beta";
import { getReferralBackendStatus } from "@/lib/referrals/runtime";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isReferralAssistEnabledForEmail(session.user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const backend = await getReferralBackendStatus();
  if (!backend.ready) {
    return NextResponse.json({ error: backend.message }, { status: 503 });
  }

  const limitParam = new URL(request.url).searchParams.get("limit");
  const limit = Math.max(1, Math.min(Number(limitParam || 18) || 18, 50));
  const [{ access }, matches] = await Promise.all([
    getReferralAccessForUser(session.user.id),
    getWarmMatchesForUser(session.user.id, limit),
  ]);

  if (!access.canPreview) {
    return NextResponse.json(
      { error: access.previewReason || "Referral previews unavailable", access },
      { status: 403 }
    );
  }

  return NextResponse.json({ matches, access });
}
