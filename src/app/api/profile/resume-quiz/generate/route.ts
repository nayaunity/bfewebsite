import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface QuizQuestion {
  id: string;
  number: number;
  label: string;
  question: string;
  placeholder: string;
  hint?: string;
}

const GENERATE_TOOL = {
  name: "record_quiz_questions",
  description:
    "Record the personalized resume quiz questions generated from the resume analysis.",
  input_schema: {
    type: "object" as const,
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description:
                "Short camelCase identifier, e.g. 'teamSizeAtAcme'",
            },
            label: {
              type: "string",
              description:
                "Short 3-5 word section title, e.g. 'Your Acme Impact'",
            },
            question: {
              type: "string",
              description:
                "The conversational question to ask the user. Reference their specific role/company. 2-3 sentences max.",
            },
            placeholder: {
              type: "string",
              description:
                'Example answer the user can reference, e.g. "maybe 12 engineers, and we shipped every 2 weeks"',
            },
            hint: {
              type: ["string", "null"],
              description: "Optional short hint shown below the text area",
            },
          },
          required: ["id", "label", "question", "placeholder"],
        },
        minItems: 8,
        maxItems: 10,
      },
    },
    required: ["questions"],
  },
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      applicationAnswers: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      resumeUrl: true,
      firstName: true,
      resumes: {
        select: { blobUrl: true, fileName: true, isFallback: true },
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isPaying =
    user.subscriptionStatus === "active" &&
    ["starter", "pro"].includes(user.subscriptionTier);
  const isTrialing = user.subscriptionStatus === "trialing";

  if (!isPaying && !isTrialing) {
    return NextResponse.json(
      { error: "Resume quiz is available for Starter and Pro subscribers" },
      { status: 403 }
    );
  }

  // Check cache first
  if (user.applicationAnswers) {
    try {
      const parsed = JSON.parse(user.applicationAnswers);
      if (parsed.resumeQuizQuestions?.length > 0) {
        return NextResponse.json({
          questions: parsed.resumeQuizQuestions,
          cached: true,
        });
      }
    } catch {}
  }

  // Find the user's primary resume
  const resumeUrl =
    user.resumes.find((r) => r.isFallback)?.blobUrl ??
    user.resumes[0]?.blobUrl ??
    user.resumeUrl;

  if (!resumeUrl) {
    return NextResponse.json(
      { error: "No resume found. Please upload a resume first." },
      { status: 400 }
    );
  }

  // Download resume
  const resp = await fetch(resumeUrl);
  if (!resp.ok) {
    return NextResponse.json(
      { error: "Failed to download resume" },
      { status: 500 }
    );
  }
  const buffer = Buffer.from(await resp.arrayBuffer());

  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46;
  const isDocx = buffer[0] === 0x50 && buffer[1] === 0x4b;

  let resumeContent: Anthropic.Messages.ContentBlockParam[];

  if (isPdf) {
    resumeContent = [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: buffer.toString("base64"),
        },
      },
    ];
  } else if (isDocx) {
    // For DOCX, extract text via mammoth
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    resumeContent = [
      {
        type: "text",
        text: `--- RESUME TEXT (extracted from DOCX) ---\n${result.value}\n--- END RESUME ---`,
      },
    ];
  } else {
    return NextResponse.json(
      { error: "Unsupported resume format" },
      { status: 400 }
    );
  }

  const prompt = `You are helping a job seeker dramatically improve their resume by quantifying their impact. Read the resume above carefully.

Your job: generate 8-10 personalized questions that will extract the MISSING numbers, metrics, and measurable outcomes from this person's experience. The goal is to turn vague bullets like "managed projects" into powerful ones like "managed 12 cross-functional projects, delivering $2.3M in cost savings."

RULES:
1. Each question MUST reference a SPECIFIC role, company, or bullet point from their resume. Never ask generic questions.
2. Target the biggest gaps: team sizes they managed, dollar amounts (revenue, savings, budgets), percentage improvements, user/customer counts, timelines accelerated, systems scaled, and concrete outcomes.
3. Write in a warm, conversational tone. Use "you" language. Make the person feel like you're genuinely curious, not interrogating them.
4. Placeholders should show realistic example answers so the user knows what level of specificity you want.
5. Questions 1-7/8/9 should each target a different role or achievement from the resume.
6. The LAST question should always be an open-ended "superpower moment": ask what accomplishment their manager would brag about to their boss. Set its id to "superpowerMoment".
7. If a bullet already has strong metrics, skip it and focus on the vague ones.
8. NEVER use em-dashes in any text. Use commas or periods instead.

${user.firstName ? `The user's first name is ${user.firstName}. Use it naturally in 1-2 questions.` : ""}

Use the record_quiz_questions tool to return your questions.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [GENERATE_TOOL],
      messages: [
        {
          role: "user",
          content: [...resumeContent, { type: "text", text: prompt }],
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "Failed to generate questions" },
        { status: 500 }
      );
    }

    const input = toolUse.input as { questions: Omit<QuizQuestion, "number">[] };
    const questions: QuizQuestion[] = input.questions.map((q, i) => ({
      ...q,
      number: i + 1,
    }));

    // Cache questions in applicationAnswers
    let existing: Record<string, unknown> = {};
    if (user.applicationAnswers) {
      try {
        existing = JSON.parse(user.applicationAnswers);
      } catch {}
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        applicationAnswers: JSON.stringify({
          ...existing,
          resumeQuizQuestions: questions,
        }),
      },
    });

    return NextResponse.json({ questions, cached: false });
  } catch (err) {
    console.error("Question generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Clear cached questions to force regeneration
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { applicationAnswers: true },
  });

  let existing: Record<string, unknown> = {};
  if (user?.applicationAnswers) {
    try {
      existing = JSON.parse(user.applicationAnswers);
    } catch {}
  }

  delete existing.resumeQuizQuestions;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { applicationAnswers: JSON.stringify(existing) },
  });

  return NextResponse.json({ ok: true });
}
