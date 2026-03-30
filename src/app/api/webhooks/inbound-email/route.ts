import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import {
  extractEmail,
  extractName,
  isGreenhouseVerification,
} from "@/lib/application-email";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Inbound email webhook — accepts both:
 * - JSON body (Cloudflare Email Workers): { from, to, subject, text, html }
 * - Form data (SendGrid Inbound Parse): multipart form with envelope, from, to, subject, text, html fields
 */
export async function POST(request: NextRequest) {
  let from = "";
  let to = "";
  let subject = "";
  let text = "";
  let html = "";

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    // JSON format (Cloudflare Email Workers or direct POST)
    const secret = request.headers.get("x-webhook-secret");
    if (secret !== process.env.INBOUND_EMAIL_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    from = body.from || "";
    to = body.to || "";
    subject = body.subject || "";
    text = body.text || "";
    html = body.html || "";
  } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    // SendGrid Inbound Parse format
    // Auth via query param since SendGrid doesn't support custom headers
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");
    if (secret !== process.env.INBOUND_EMAIL_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await request.formData();
    from = (formData.get("from") as string) || "";
    to = (formData.get("to") as string) || "";
    subject = (formData.get("subject") as string) || "";
    text = (formData.get("text") as string) || "";
    html = (formData.get("html") as string) || "";

    // SendGrid also sends an "envelope" field with JSON containing the real to/from
    const envelope = formData.get("envelope") as string;
    if (envelope) {
      try {
        const env = JSON.parse(envelope);
        if (env.to?.[0]) to = env.to[0];
        if (env.from) from = env.from;
      } catch {}
    }
  } else {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  }

  // Extract and validate recipient
  const toEmail = extractEmail(to) || to;
  if (!toEmail?.endsWith("@apply.theblackfemaleengineer.com")) {
    return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
  }

  // Verify user exists with this application email
  const user = await prisma.user.findFirst({
    where: { applicationEmail: toEmail },
    select: { id: true, email: true, firstName: true },
  });

  if (!user) {
    // Still store the email even if user not found (might be timing issue)
    await prisma.inboundEmail.create({
      data: {
        toEmail,
        fromEmail: extractEmail(from) || from,
        fromName: extractName(from),
        subject,
        textBody: text || null,
        htmlBody: html || null,
      },
    });
    return NextResponse.json({ received: true, userFound: false });
  }

  // Store the email
  await prisma.inboundEmail.create({
    data: {
      toEmail,
      fromEmail: extractEmail(from) || from,
      fromName: extractName(from),
      subject,
      textBody: text || null,
      htmlBody: html || null,
    },
  });

  // Forward non-verification emails to user's real email
  const isVerification = isGreenhouseVerification(subject, text);
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
