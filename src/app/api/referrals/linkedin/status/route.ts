import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getLinkedInStatusForUser, getReferralAccessForUser } from "@/lib/referrals/server";
import { isReferralAssistEnabledForEmail } from "@/lib/referrals/beta";
import { getReferralBackendStatus } from "@/lib/referrals/runtime";

export async function GET() {
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

  const [{ access }, status] = await Promise.all([
    getReferralAccessForUser(session.user.id),
    getLinkedInStatusForUser(session.user.id),
  ]);

  return NextResponse.json({
    access,
    ...status,
  });
}
