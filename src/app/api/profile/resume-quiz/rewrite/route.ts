import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      currentTitle: true,
      applicationAnswers: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      resumeUrl: true,
      resumes: {
        select: { id: true, blobUrl: true, fileName: true, isFallback: true },
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

  if (!isPaying) {
    return NextResponse.json(
      { error: "upgrade_required", upgradeUrl: "/pricing" },
      { status: 403 }
    );
  }

  // Parse quiz answers
  let quizAnswers: Record<string, string> = {};
  let quizQuestions: Array<{ id: string; label: string; question: string }> = [];
  if (user.applicationAnswers) {
    try {
      const parsed = JSON.parse(user.applicationAnswers);
      if (parsed.resumeQuiz) {
        const { submittedAt: _, ...answers } = parsed.resumeQuiz;
        quizAnswers = answers;
      }
      if (parsed.resumeQuizQuestions) {
        quizQuestions = parsed.resumeQuizQuestions;
      }
    } catch {}
  }

  if (Object.keys(quizAnswers).length === 0) {
    return NextResponse.json(
      { error: "Please complete the resume quiz first" },
      { status: 400 }
    );
  }

  // Find primary resume
  const resumeUrl =
    user.resumes.find((r) => r.isFallback)?.blobUrl ??
    user.resumes[0]?.blobUrl ??
    user.resumeUrl;

  if (!resumeUrl) {
    return NextResponse.json(
      { error: "No resume found" },
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

  // Format Q&A pairs for the prompt
  const qaPairs = Object.entries(quizAnswers)
    .filter(([, v]) => typeof v === "string" && v.trim())
    .map(([key, answer]) => {
      const q = quizQuestions.find((qq) => qq.id === key);
      const label = q?.label || key;
      return `**${label}**: ${answer}`;
    })
    .join("\n");

  const prompt = `You are an expert resume writer. The document above is this person's current resume. Below are their answers to a quiz where they provided the specific numbers, metrics, and outcomes that are MISSING from their resume.

QUIZ ANSWERS (use these to enrich the resume):
${qaPairs}

YOUR TASK: Rewrite this resume so every bullet point LEADS WITH IMPACT. The #1 problem with this resume is that achievements are described vaguely instead of quantified.

REWRITE RULES:
1. Every bullet should start with a NUMBER or RESULT when possible: "$2.3M in savings", "Reduced deploy time by 40%", "Managed team of 12", "Served 50,000 users".
2. Use the quiz answers to inject the specific metrics they provided into the corresponding bullets. Map each answer to the right role/company.
3. Keep the EXACT same jobs, companies, dates, education, and contact info. Never invent experience.
4. You may restructure bullets within a job to put the highest-impact ones first.
5. Rewrite the Professional Summary (3-4 sentences) to lead with their most impressive quantified achievement.
6. NEVER move bullets between jobs. Each bullet stays under its original role.
7. Keep the same overall section order (Summary, Experience, Education, Skills or whatever order the original uses).
8. If a quiz answer doesn't clearly map to a specific bullet, weave it into the most relevant role's bullet naturally.
9. NEVER use em-dashes. Use commas or periods instead.
10. Output ONLY clean HTML. No markdown fences, no explanation, no preamble.

APPLICANT: ${user.firstName || ""} ${user.lastName || ""}
${user.currentTitle ? `CURRENT TITLE: ${user.currentTitle}` : ""}

The HTML must be ATS-friendly, single-column:
- System fonts only (Arial, Helvetica, sans-serif)
- Single column layout, no tables for layout
- Black text on white background
- Clear section headings (PROFESSIONAL SUMMARY, EXPERIENCE, EDUCATION, SKILLS)
- Name and contact info at top
- Font size 11-12px for body, 14-16px for name

Output the complete HTML resume now:`;

  let rewrittenHTML: string;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: [...resumeContent, { type: "text", text: prompt }],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No output from Claude" },
        { status: 500 }
      );
    }
    rewrittenHTML = textBlock.text;
  } catch (err) {
    console.error("Resume rewrite failed:", err);
    return NextResponse.json(
      { error: "Resume rewrite failed" },
      { status: 500 }
    );
  }

  // Strip markdown fences
  rewrittenHTML = rewrittenHTML
    .replace(/^```html?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  if (rewrittenHTML.length < 200) {
    return NextResponse.json(
      { error: "Rewrite produced too little output" },
      { status: 500 }
    );
  }

  // Wrap if not a full HTML doc
  if (
    !rewrittenHTML.toLowerCase().includes("<!doctype") &&
    !rewrittenHTML.toLowerCase().includes("<html")
  ) {
    rewrittenHTML = wrapHTML(rewrittenHTML);
  }

  // Convert HTML to PDF using a serverless-friendly approach:
  // Store HTML and let the client render/download, OR use Puppeteer.
  // For now, store the HTML and create a simple PDF via the browser-side.
  // We'll upload the HTML as a blob and let the user download it.

  // Actually, let's generate a proper PDF. On Vercel serverless we can use
  // @vercel/og or a lightweight HTML-to-PDF. But Playwright won't work on
  // Vercel Edge. Instead, store the HTML and provide a download endpoint.
  // The client-side component will render and offer print-to-PDF.

  const timestamp = Date.now();
  const fileName = `impact-resume-${user.firstName || "user"}-${user.lastName || ""}-${timestamp}.html`;

  const blob = await put(
    `resumes/${user.id}/impact-optimized/${fileName}`,
    rewrittenHTML,
    { access: "public", contentType: "text/html", addRandomSuffix: true }
  );

  // Save the rewrite URL in applicationAnswers
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
        resumeRewrite: {
          htmlUrl: blob.url,
          createdAt: new Date().toISOString(),
        },
      }),
    },
  });

  return NextResponse.json({
    htmlUrl: blob.url,
    message: "Resume rewritten successfully. Open the URL to view, then use your browser's Print to save as PDF.",
  });
}

function wrapHTML(bodyHTML: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #111;
      background: #fff;
      padding: 0.5in 0.6in;
    }
    h1 { font-size: 16px; margin-bottom: 2px; }
    h2 { font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #333; margin: 12px 0 6px; padding-bottom: 2px; }
    h3 { font-size: 12px; margin-bottom: 2px; }
    p { margin-bottom: 4px; }
    ul { margin-left: 18px; margin-bottom: 6px; }
    li { margin-bottom: 2px; }
    a { color: #111; text-decoration: none; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
${bodyHTML}
</body>
</html>`;
}
