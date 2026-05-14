import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isReferralAssistEnabledForEmail } from "@/lib/referrals/beta";
import { getReferralAccessForUser } from "@/lib/referrals/server";

export const maxDuration = 30;

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isReferralAssistEnabledForEmail(session.user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { access, user } = await getReferralAccessForUser(session.user.id);
  if (!access.canPreview) {
    return NextResponse.json(
      { error: access.previewReason || "Upgrade to use AI outreach" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    connectionId?: string;
    jobId?: string;
  };

  if (!body.connectionId || !body.jobId) {
    return NextResponse.json(
      { error: "connectionId and jobId are required" },
      { status: 400 }
    );
  }

  const [connection, job] = await Promise.all([
    prisma.linkedInConnection.findFirst({
      where: { id: body.connectionId, userId: session.user.id },
    }),
    prisma.job.findUnique({
      where: { id: body.jobId },
      select: {
        title: true,
        company: true,
        location: true,
        description: true,
      },
    }),
  ]);

  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const senderName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "A candidate";
  const connectionFirst = connection.fullName.split(/\s+/)[0] || "there";

  const prompt = `Write a short LinkedIn/email outreach message from ${senderName} to ${connection.fullName} (${connectionFirst}). The sender is interested in the "${job.title}" role at ${job.company} and wants to start a genuine conversation, NOT ask for a referral upfront.

Sender context:
- Name: ${senderName}
${user.currentTitle ? `- Current role: ${user.currentTitle}` : ""}
${user.currentEmployer ? `- Current company: ${user.currentEmployer}` : ""}
${user.yearsOfExperience ? `- Experience: ${user.yearsOfExperience} years` : ""}
${user.city ? `- Location: ${user.city}` : ""}

Connection context:
- Name: ${connection.fullName}
${connection.headline ? `- Role: ${connection.headline}` : ""}
- Company: ${connection.currentCompany || job.company}

Job context:
- Title: ${job.title}
- Company: ${job.company}
${job.location ? `- Location: ${job.location}` : ""}

Rules:
- Keep it under 120 words
- The goal is to open a conversation, not to ask for something
- Show genuine interest in the company and the person's experience there
- Mention the role briefly but frame it as curiosity, not a request
- Briefly mention something relevant about the sender's background so the connection knows they're serious
- End by asking for a quick chat or coffee, not a referral
- Never say "referral", "refer", or "put in a good word"
- Never use em dashes
- Do not use the phrase "spot on"
- Do not use overly formal language or buzzwords
- Sound like a real person, not a template
- Output ONLY the message text, no subject line or metadata`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("AI outreach generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate message. Please try again." },
      { status: 500 }
    );
  }
}
