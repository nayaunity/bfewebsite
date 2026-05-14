import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createLinkedInSyncToken } from "@/lib/referrals/server";
import { isReferralAssistEnabledForEmail } from "@/lib/referrals/beta";
import { getReferralBackendStatus } from "@/lib/referrals/runtime";

export async function POST(request: Request) {
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

  const origin = new URL(request.url).origin;
  const { token, expiresAt } = createLinkedInSyncToken({
    userId: session.user.id,
    origin,
  });

  return NextResponse.json({
    token,
    expiresAt,
    syncUrl: `${origin}/api/referrals/linkedin/sync`,
    statusUrl: `${origin}/api/referrals/linkedin/status`,
  });
}
