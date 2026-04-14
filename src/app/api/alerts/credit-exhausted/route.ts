import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/alerts/credit-exhausted
 *
 * Called by the Railway worker when the Anthropic API returns a credit-balance
 * error. We record an AdminAlert row so the admin panel shows a red banner.
 * Email sending is deliberately NOT done here — per CLAUDE.md, emails require
 * explicit approval. Operators see the banner and decide what to communicate.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-alert-secret");
  const expected = process.env.ALERT_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { kind?: string; sessionId?: string; userId?: string; rawError?: string; at?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.kind !== "credit_exhausted") {
    return NextResponse.json({ error: "Unknown alert kind" }, { status: 400 });
  }

  // Dedupe: if an unresolved credit_exhausted alert exists in the last hour,
  // don't create another one.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const existing = await prisma.adminAlert.findFirst({
    where: {
      kind: "credit_exhausted",
      resolvedAt: null,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (existing) {
    return NextResponse.json({ deduped: true, alertId: existing.id });
  }

  const alert = await prisma.adminAlert.create({
    data: {
      kind: "credit_exhausted",
      severity: "high",
      message: "Anthropic API credit balance exhausted — apply sessions are paused. Top up credits in the Anthropic Console.",
      metadata: JSON.stringify({
        sessionId: body.sessionId,
        userId: body.userId,
        rawError: (body.rawError || "").slice(0, 500),
        at: body.at,
      }),
    },
  });

  console.log(`[alerts] credit_exhausted alert created: ${alert.id}`);
  return NextResponse.json({ alertId: alert.id });
}
