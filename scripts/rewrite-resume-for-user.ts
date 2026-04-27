/**
 * Manual resume rewrite for a specific user.
 * Usage: npx tsx scripts/rewrite-resume-for-user.ts <email>
 */
import { createClient } from "@libsql/client";
import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";
import puppeteer from "puppeteer-core";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/rewrite-resume-for-user.ts <email>");
  process.exit(1);
}

const db = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});

const anthropic = new Anthropic();

async function main() {
  const res = await db.execute({
    sql: "SELECT id, firstName, lastName, currentTitle, linkedinUrl, applicationAnswers, resumeUrl FROM User WHERE email = ?",
    args: [email],
  });
  const user = res.rows[0];
  if (!user) {
    console.error("User not found:", email);
    process.exit(1);
  }

  console.log("User:", user.firstName, user.lastName);

  // Parse quiz data
  const aa = JSON.parse((user.applicationAnswers as string) || "{}");
  const quizQuestions = aa.resumeQuizQuestions || [];
  const quizRaw = aa.resumeQuiz || {};
  const { submittedAt: _, ...quizAnswers } = quizRaw;

  const filled = Object.values(quizAnswers).filter(
    (v: any) => typeof v === "string" && v.trim()
  ).length;
  console.log("Quiz answers:", filled);

  if (filled === 0) {
    console.error("No quiz answers found");
    process.exit(1);
  }

  // Download resume
  const resumeUrl = user.resumeUrl as string;
  console.log("Downloading resume from:", resumeUrl.slice(0, 80));
  const resp = await fetch(resumeUrl);
  if (!resp.ok) {
    console.error("Failed to download resume:", resp.status);
    process.exit(1);
  }
  const buffer = Buffer.from(await resp.arrayBuffer());

  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46;

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
  } else {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    resumeContent = [
      {
        type: "text",
        text: `--- RESUME TEXT (extracted from DOCX) ---\n${result.value}\n--- END RESUME ---`,
      },
    ];
  }

  // Format Q&A pairs
  const qaPairs = Object.entries(quizAnswers as Record<string, string>)
    .filter(([, v]) => typeof v === "string" && v.trim())
    .map(([key, answer]) => {
      const q = quizQuestions.find((qq: any) => qq.id === key);
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
${user.linkedinUrl ? `LINKEDIN URL: ${(user.linkedinUrl as string).split("?")[0]} (hyperlink "LinkedIn" in the contact line to this URL)` : ""}

The HTML must be ATS-friendly, single-column:
- System fonts only (Arial, Helvetica, sans-serif)
- Single column layout, no tables for layout
- Black text on white background
- Clear section headings (PROFESSIONAL SUMMARY, EXPERIENCE, EDUCATION, SKILLS)
- Name and contact info at top
- Font size 11-12px for body, 14-16px for name

Output the complete HTML resume now:`;

  console.log("Calling Claude...");
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
    console.error("No text output from Claude");
    process.exit(1);
  }

  let html = textBlock.text
    .replace(/^```html?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  if (html.length < 200) {
    console.error("Output too short:", html.length);
    process.exit(1);
  }

  if (
    !html.toLowerCase().includes("<!doctype") &&
    !html.toLowerCase().includes("<html")
  ) {
    html = wrapHTML(html);
  }

  console.log("HTML length:", html.length);

  // Render PDF locally with full puppeteer
  console.log("Rendering PDF...");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfUint8 = await page.pdf({
    format: "Letter",
    margin: { top: "0.5in", bottom: "0.5in", left: "0.6in", right: "0.6in" },
    printBackground: true,
  });
  const pdfBuffer = Buffer.from(pdfUint8);
  await browser.close();
  console.log("PDF size:", pdfBuffer.length, "bytes");

  // Upload to Vercel Blob
  const timestamp = Date.now();
  const pdfName = `impact-resume-${user.firstName || "user"}-${user.lastName || ""}-${timestamp}.pdf`;
  const blob = await put(
    `resumes/${user.id}/impact-optimized/${pdfName}`,
    pdfBuffer,
    { access: "public", contentType: "application/pdf", addRandomSuffix: true }
  );
  console.log("Uploaded to:", blob.url);

  // Update applicationAnswers
  const updated = {
    ...aa,
    resumeRewrite: {
      pdfUrl: blob.url,
      createdAt: new Date().toISOString(),
    },
  };
  await db.execute({
    sql: "UPDATE User SET applicationAnswers = ? WHERE id = ?",
    args: [JSON.stringify(updated), user.id as string],
  });
  console.log("Done! Resume rewrite saved for", user.firstName, user.lastName);
  console.log("PDF URL:", blob.url);
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
      padding: 0;
    }
    h1 { font-size: 16px; margin-bottom: 2px; }
    h2 { font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #333; margin: 12px 0 6px; padding-bottom: 2px; }
    h3 { font-size: 12px; margin-bottom: 2px; }
    p { margin-bottom: 4px; }
    ul { margin-left: 18px; margin-bottom: 6px; }
    li { margin-bottom: 2px; }
    a { color: #111; text-decoration: none; }
  </style>
</head>
<body>
${bodyHTML}
</body>
</html>`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
