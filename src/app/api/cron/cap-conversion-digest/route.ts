import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { findCapConversionCandidates } from "@/lib/cap-conversion";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 60;

const DIGEST_EXPIRY_HOURS = 24;
const DIGEST_TO = "theblackfemaleengineer@gmail.com";
const BASE_URL = "https://www.theblackfemaleengineer.com";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await findCapConversionCandidates();

  if (candidates.length === 0) {
    console.log("[cap-conversion-digest] 0 candidates today, skipping digest email");
    return NextResponse.json({ candidateCount: 0, digestSent: false });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DIGEST_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.capConversionDigest.create({
    data: {
      token,
      candidateUserIds: JSON.stringify(candidates.map((c) => c.userId)),
      expiresAt,
    },
  });

  const approveUrl = `${BASE_URL}/admin/cap-conversion/${token}`;
  const candidateList = candidates
    .map((c) => `<li>${c.email} (capped ${c.cappedAt.toISOString().slice(0, 16).replace("T", " ")} UTC)</li>`)
    .join("");

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 560px;">
    <p><strong>${candidates.length} cap-conversion candidate${candidates.length === 1 ? "" : "s"} today.</strong></p>
    <ul>${candidateList}</ul>
    <p><a href="${approveUrl}" style="display: inline-block; background: #ef562a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Preview &amp; approve</a></p>
    <p style="color: #666; font-size: 13px;">Link expires in 24 hours. After that, these users will be skipped and you'll need to run a manual send.</p>
  </div>`;

  const text = `${candidates.length} cap-conversion candidate(s) today:\n${candidates.map((c) => `- ${c.email}`).join("\n")}\n\nPreview & approve: ${approveUrl}\n\nLink expires in 24h.`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Naya <naya@theblackfemaleengineer.com>",
    replyTo: "theblackfemaleengineer@gmail.com",
    to: DIGEST_TO,
    subject: `${candidates.length} cap-conversion candidate${candidates.length === 1 ? "" : "s"} today`,
    html,
    text,
  });

  console.log(`[cap-conversion-digest] Sent digest with ${candidates.length} candidates, token=${token.slice(0, 8)}...`);
  return NextResponse.json({
    candidateCount: candidates.length,
    digestSent: true,
    token: token.slice(0, 8) + "...",
  });
}
