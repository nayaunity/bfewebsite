import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import {
  extractEmail,
  extractName,
  isGreenhouseVerification,
} from "@/lib/application-email";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  // Authenticate webhook
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.INBOUND_EMAIL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { from, to, subject, text, html } = body;

  // Extract and validate recipient
  const toEmail = extractEmail(to || "") || to;
  if (!toEmail?.endsWith("@apply.theblackfemaleengineer.com")) {
    return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
  }

  // Verify user exists with this application email
  const user = await prisma.user.findFirst({
    where: { applicationEmail: toEmail },
    select: { id: true, email: true, firstName: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Unknown recipient" }, { status: 404 });
  }

  // Store the email
  await prisma.inboundEmail.create({
    data: {
      toEmail,
      fromEmail: extractEmail(from || "") || from || "",
      fromName: extractName(from || ""),
      subject: subject || "",
      textBody: text || null,
      htmlBody: html || null,
    },
  });

  // Forward non-verification emails to user's real email
  const isVerification = isGreenhouseVerification(subject || "", text || "");
  if (!isVerification && user.email) {
    try {
      await resend.emails.send({
        from: "BFE Auto-Apply <forwarding@apply.theblackfemaleengineer.com>",
        to: user.email,
        subject: `Fwd: ${subject || "(no subject)"}`,
        text: `--- Forwarded from your application email ---\nFrom: ${from || "Unknown"}\n\n${text || ""}`,
        html: html
          ? `<p><em>Forwarded from your application email</em><br>From: ${from || "Unknown"}</p><hr>${html}`
          : undefined,
      });
    } catch (err) {
      console.error("[InboundEmail] Forward failed:", err);
    }
  }

  return NextResponse.json({ received: true });
}
