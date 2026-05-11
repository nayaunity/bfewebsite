import { NextRequest, NextResponse } from "next/server";
import { requireFullAdmin } from "@/lib/admin";
import { buildDeadResumeDraft } from "@/lib/dead-resume-notice";
import { Resend } from "resend";
import { logError } from "@/lib/error-logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireFullAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 },
    );
  }

  let email: string | undefined;
  try {
    const body = await request.json();
    email = body.email;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  try {
    const draft = await buildDeadResumeDraft(email);
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: "Naya <naya@theblackfemaleengineer.com>",
      to: draft.email,
      replyTo: "theblackfemaleengineer@gmail.com",
      subject: draft.subject,
      text: draft.text,
      html: draft.html,
    });
    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await logError({
      endpoint: "/api/admin/broken-resumes/nudge",
      method: "POST",
      status: 500,
      error: "Failed to send nudge",
      detail,
    });
    return NextResponse.json(
      { error: "Failed to send nudge", detail },
      { status: 500 },
    );
  }
}
