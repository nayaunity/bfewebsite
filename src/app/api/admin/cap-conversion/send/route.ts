import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDraft } from "@/lib/cap-conversion";
import { requireAdmin } from "@/lib/admin";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  await requireAdmin();

  const { token } = await request.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const digest = await prisma.capConversionDigest.findUnique({ where: { token } });
  if (!digest) return NextResponse.json({ error: "Digest not found" }, { status: 404 });
  if (digest.status === "approved") {
    return NextResponse.json({ error: "Already approved" }, { status: 409 });
  }
  if (digest.expiresAt < new Date()) {
    return NextResponse.json({ error: "Digest expired" }, { status: 410 });
  }

  const userIds = JSON.parse(digest.candidateUserIds) as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, subscriptionTier: true, conversionEmailSentAt: true },
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const u of users) {
    if (u.subscriptionTier !== "free" || u.conversionEmailSentAt) {
      skipped++;
      continue;
    }
    try {
      const draft = await buildDraft(u.email, { createCoupon: true });
      await resend.emails.send({
        from: "Naya <naya@theblackfemaleengineer.com>",
        replyTo: "theblackfemaleengineer@gmail.com",
        to: u.email,
        subject: draft.subject,
        html: draft.html,
        text: draft.text,
      });
      await prisma.user.update({
        where: { id: u.id },
        data: { conversionEmailSentAt: new Date() },
      });
      sent++;
    } catch (e) {
      console.error(`[cap-conversion send] ${u.email}:`, e instanceof Error ? e.message : e);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  await prisma.capConversionDigest.update({
    where: { token },
    data: {
      status: "approved",
      approvedAt: new Date(),
      sentCount: sent,
    },
  });

  return NextResponse.json({ sent, skipped, failed, total: users.length });
}
