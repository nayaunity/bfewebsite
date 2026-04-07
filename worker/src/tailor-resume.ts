import Anthropic from "@anthropic-ai/sdk";
import { getBrowser } from "./apply-engine";
import { getDb } from "./db";
import { tmpdir } from "os";
import { join } from "path";

// pdf-parse ships as CJS — use require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse");

const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TailorParams {
  resumeBuffer: Buffer;
  jobTitle: string;
  jobDescription: string;
  applicant: { firstName: string; lastName: string; currentTitle?: string };
}

interface TailorResult {
  tailoredPath: string;
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a tailored resume PDF from the original resume + job description.
 * Returns the path to the tailored PDF on success, or success=false on failure.
 */
export async function tailorResume(params: TailorParams): Promise<TailorResult> {
  const { resumeBuffer, jobTitle, jobDescription, applicant } = params;

  // Step 1: Extract text from original PDF
  let resumeText: string;
  try {
    const pdfData = await pdfParse(resumeBuffer);
    resumeText = pdfData.text;
  } catch (err) {
    return { tailoredPath: "", success: false, error: `PDF parse failed: ${err instanceof Error ? err.message : "unknown"}` };
  }

  if (resumeText.length < 100) {
    return { tailoredPath: "", success: false, error: "Resume text too short — likely garbled or image-only PDF" };
  }

  // Step 2: Call Claude Haiku to tailor the resume
  const jdTruncated = jobDescription.slice(0, 3000);
  const prompt = `You are an expert resume writer. Given the original resume text and a job description, create a tailored version of the resume.

RULES:
1. Rewrite the Professional Summary (3-4 sentences) to match the job description
2. Reorder experience bullets so the most relevant appear first
3. Inject 10-15 keywords from the job description naturally into the resume
4. NEVER invent experience, skills, companies, degrees, or facts not present in the original resume
5. Keep all dates, company names, job titles, and education details exactly as they appear
6. If a section (e.g. Education) exists in the original resume, include it with the EXACT entries — do not change degree names, school names, or dates
7. Output ONLY clean HTML — no markdown fences, no explanation, no preamble

The HTML must be a complete, ATS-friendly, single-column resume. Use this structure:
- System fonts only (Arial, Helvetica, sans-serif)
- Single column layout, no tables for layout
- Black text on white background
- Clear section headings (PROFESSIONAL SUMMARY, EXPERIENCE, EDUCATION, SKILLS)
- Name and contact info at top
- Font size 11-12px for body, 14-16px for name

APPLICANT NAME: ${applicant.firstName} ${applicant.lastName}
${applicant.currentTitle ? `CURRENT TITLE: ${applicant.currentTitle}` : ""}

ORIGINAL RESUME TEXT:
${resumeText.length <= 6000 ? resumeText : resumeText.slice(0, 4000) + "\n\n[...middle section truncated...]\n\n" + resumeText.slice(-1500)}

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jdTruncated}

Output the complete HTML resume now:`;

  let tailoredHTML: string;
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { tailoredPath: "", success: false, error: "No text in Claude response" };
    }
    tailoredHTML = textBlock.text;
  } catch (err) {
    return { tailoredPath: "", success: false, error: `Claude API failed: ${err instanceof Error ? err.message : "unknown"}` };
  }

  // Strip markdown fences if Claude wrapped the output
  tailoredHTML = tailoredHTML.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

  if (tailoredHTML.length < 200) {
    return { tailoredPath: "", success: false, error: "Claude returned too little HTML" };
  }

  // Step 3: Render HTML to PDF via Playwright
  const tailoredPath = join(tmpdir(), `tailored-${Date.now()}.pdf`);
  try {
    const browser = await getBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(wrapHTML(tailoredHTML), { waitUntil: "networkidle" });
    await page.pdf({
      path: tailoredPath,
      format: "Letter",
      margin: { top: "0.5in", bottom: "0.5in", left: "0.6in", right: "0.6in" },
      printBackground: true,
    });
    await page.close();
    await context.close();
  } catch (err) {
    return { tailoredPath: "", success: false, error: `PDF generation failed: ${err instanceof Error ? err.message : "unknown"}` };
  }

  return { tailoredPath, success: true };
}

// ---------------------------------------------------------------------------
// JD Fetching
// ---------------------------------------------------------------------------

/**
 * Fetch job description text. Tries DB first, then Greenhouse API.
 */
export async function fetchJobDescription(applyUrl: string): Promise<string | null> {
  // Priority 1: Database lookup
  try {
    const db = getDb();
    const result = await db.execute({
      sql: "SELECT description FROM Job WHERE applyUrl = ? LIMIT 1",
      args: [applyUrl],
    });
    const desc = result.rows?.[0]?.description as string | null;
    if (desc && desc.length > 50) {
      return stripHTML(desc);
    }
  } catch {
    // DB lookup failed — try API fallback
  }

  // Priority 2: Greenhouse API
  try {
    const gh = parseGreenhouseUrl(applyUrl);
    if (gh) {
      const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${gh.boardToken}/jobs/${gh.jobId}?content=true`;
      const resp = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        const data = (await resp.json()) as { content?: string; title?: string };
        if (data.content && data.content.length > 50) {
          return stripHTML(data.content);
        }
      }
    }
  } catch {
    // API fetch failed
  }

  return null;
}

/**
 * Check and increment the tailor quota for a user.
 * Returns true if the user is allowed to tailor (and increments the counter).
 */
export async function checkAndIncrementTailorQuota(
  userId: string,
  subscriptionTier: string
): Promise<boolean> {
  // Paid tiers: always allowed
  if (subscriptionTier === "starter" || subscriptionTier === "pro") {
    await incrementTailorCount(userId);
    return true;
  }

  // Free tier: check limit (1/month)
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT monthlyTailorCount FROM User WHERE id = ?",
    args: [userId],
  });
  const count = (result.rows?.[0]?.monthlyTailorCount as number) || 0;
  if (count >= 1) return false;

  await incrementTailorCount(userId);
  return true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function incrementTailorCount(userId: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: "UPDATE User SET monthlyTailorCount = monthlyTailorCount + 1 WHERE id = ?",
    args: [userId],
  });
}

function parseGreenhouseUrl(url: string): { boardToken: string; jobId: string } | null {
  // Match: job-boards.greenhouse.io/{boardToken}/jobs/{jobId}
  const m1 = url.match(/job-boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/);
  if (m1) return { boardToken: m1[1], jobId: m1[2] };

  // Match: boards.greenhouse.io/{boardToken}/jobs/{jobId}
  const m2 = url.match(/boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/);
  if (m2) return { boardToken: m2[1], jobId: m2[2] };

  // Match: ?gh_jid={jobId} on company domains
  const m3 = url.match(/gh_jid=(\d+)/);
  if (m3) {
    // Can't determine board token from gh_jid alone
    return null;
  }

  return null;
}

function stripHTML(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Wrap Claude's HTML output in a consistent document structure with ATS-friendly styles.
 */
function wrapHTML(bodyHTML: string): string {
  // If Claude already returned a full HTML document, use it as-is
  if (bodyHTML.toLowerCase().includes("<!doctype") || bodyHTML.toLowerCase().includes("<html")) {
    return bodyHTML;
  }

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
