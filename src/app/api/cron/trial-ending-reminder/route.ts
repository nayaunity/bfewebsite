import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import {
  buildTrialEndingDraft,
  findTrialEndingCandidates,
} from "@/lib/trial-ending-reminder";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await findTrialEndingCandidates();

  if (candidates.length === 0) {
    console.log("[trial-ending-reminder] 0 candidates, nothing to send");
    return NextResponse.json({ candidateCount: 0, sent: 0 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  let failed = 0;

  for (const c of candidates) {
    try {
      const draft = await buildTrialEndingDraft(c.email);
      await resend.emails.send({
        from: "Naya <naya@theblackfemaleengineer.com>",
        replyTo: "theblackfemaleengineer@gmail.com",
        to: c.email,
        subject: draft.subject,
        html: draft.html,
        text: draft.text,
      });
      await prisma.user.update({
        where: { id: c.userId },
        data: { trialEndReminderSentAt: new Date() },
      });
      sent++;
    } catch (e) {
      console.error(
        `[trial-ending-reminder] ${c.email}:`,
        e instanceof Error ? e.message : e
      );
      failed++;
    }
  }

  console.log(
    `[trial-ending-reminder] sent=${sent} failed=${failed} of ${candidates.length} candidates`
  );
  return NextResponse.json({
    candidateCount: candidates.length,
    sent,
    failed,
  });
}
