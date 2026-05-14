import { NextResponse } from "next/server";

import { syncLinkedInConnections } from "@/lib/referrals/server";
import { getReferralBackendStatus } from "@/lib/referrals/runtime";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      token?: string;
      connections?: Array<{
        fullName: string;
        headline?: string | null;
        currentCompany?: string | null;
        location?: string | null;
        profileUrl: string;
        avatarUrl?: string | null;
        linkedinPublicId?: string | null;
      }>;
      extensionVersion?: string | null;
      lastCursor?: string | null;
    };

    if (!body.token || !Array.isArray(body.connections)) {
      return NextResponse.json(
        { error: "token and connections are required" },
        { status: 400 }
      );
    }
    const backend = await getReferralBackendStatus();
    if (!backend.ready) {
      return NextResponse.json({ error: backend.message }, { status: 503 });
    }

    const result = await syncLinkedInConnections({
      token: body.token,
      connections: body.connections,
      extensionVersion: body.extensionVersion,
      lastCursor: body.lastCursor,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
