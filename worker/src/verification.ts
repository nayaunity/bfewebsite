import { getDb } from "./db";

export interface VerificationResult {
  code: string | null;
  elapsedMs: number;
  pollCount: number;
  inboundEmailCountInWindow: number;
}

/**
 * Poll the InboundEmail table for an ATS verification code.
 * The webhook stores incoming emails; we read them here.
 *
 * Returns the code (or null on timeout) plus telemetry: how long we waited,
 * how many polls we did, and how many inbound emails arrived for this address
 * in the wait window (lets us tell delivery failure apart from extraction
 * failure when nothing comes back).
 */
export async function waitForVerificationCode(
  applicationEmail: string,
  maxWaitMs: number = 240_000,
  pollIntervalMs: number = 1_500
): Promise<VerificationResult> {
  const db = getDb();
  const startTime = Date.now();
  let pollCount = 0;

  console.log(`[Verification] Waiting for code at ${applicationEmail} (max ${maxWaitMs / 1000}s)`);

  while (Date.now() - startTime < maxWaitMs) {
    pollCount++;
    const result = await db.execute({
      sql: `SELECT id, textBody, htmlBody FROM InboundEmail
            WHERE toEmail = ? AND processed = 0
            AND receivedAt > datetime('now', '-5 minutes')
            ORDER BY receivedAt DESC LIMIT 1`,
      args: [applicationEmail],
    });

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      const textBody = (row.textBody as string) || "";
      const htmlBody = (row.htmlBody as string) || "";
      const code = extractVerificationCode(textBody, htmlBody);

      if (code) {
        await db.execute({
          sql: `UPDATE InboundEmail SET processed = 1 WHERE id = ?`,
          args: [row.id as string],
        });
        const elapsedMs = Date.now() - startTime;
        console.log(`[Verification] Code arrived after ${elapsedMs}ms (polls: ${pollCount})`);
        return {
          code,
          elapsedMs,
          pollCount,
          inboundEmailCountInWindow: await countInboundInWindow(applicationEmail, startTime),
        };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  const elapsedMs = Date.now() - startTime;
  const inboundEmailCountInWindow = await countInboundInWindow(applicationEmail, startTime);
  console.log(
    `[Verification] No usable code after ${elapsedMs}ms (polls: ${pollCount}, inbound emails seen: ${inboundEmailCountInWindow})`
  );
  return { code: null, elapsedMs, pollCount, inboundEmailCountInWindow };
}

/**
 * Count InboundEmail rows for this address that arrived during the wait window.
 * Distinguishes "email never arrived" (count 0) from "email arrived but we
 * couldn't extract the code" (count >= 1).
 */
async function countInboundInWindow(
  applicationEmail: string,
  startTime: number
): Promise<number> {
  try {
    const db = getDb();
    const startIso = new Date(startTime).toISOString().replace("T", " ").slice(0, 19);
    const result = await db.execute({
      sql: `SELECT COUNT(*) as c FROM InboundEmail
            WHERE toEmail = ? AND receivedAt >= ?`,
      args: [applicationEmail, startIso],
    });
    const c = result.rows?.[0]?.c;
    return typeof c === "number" ? c : Number(c) || 0;
  } catch {
    return 0;
  }
}

/**
 * Extract a verification code from email body. Handles common ATS formats:
 * 8-char alphanumeric (Greenhouse), 6-digit numeric (Lever, Workday), and
 * codes wrapped in <td>/<span>/<strong>/<b>/<code>/<h1> tags.
 */
export function extractVerificationCode(text: string, html: string): string | null {
  if (html) {
    // Strategy 1: Greenhouse 8-char alphanumeric inside heading/strong tags
    const h1Match = html.match(/<h1[^>]*>\s*([A-Za-z0-9]{8})\s*<\/h1>/i);
    if (h1Match) return h1Match[1];

    const boldMatch = html.match(
      /<(?:strong|b|code)[^>]*>\s*([A-Za-z0-9]{8})\s*<\/(?:strong|b|code)>/i
    );
    if (boldMatch) return boldMatch[1];

    // Strategy 1b: 6-digit numeric inside heading/strong/td/span (Lever, Workday)
    const sixDigitTag = html.match(
      /<(?:h1|h2|h3|strong|b|code|td|span)[^>]*>\s*(\d{6})\s*<\/(?:h1|h2|h3|strong|b|code|td|span)>/i
    );
    if (sixDigitTag) return sixDigitTag[1];

    // Strategy 1c: 8-char alphanumeric inside td/span (custom email templates)
    const tagWrapped = html.match(
      /<(?:td|span)[^>]*>\s*([A-Za-z0-9]{8})\s*<\/(?:td|span)>/i
    );
    if (tagWrapped) return tagWrapped[1];
  }

  const content = text || (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") : "");
  if (!content) return null;

  // Strategy 2: keyword-anchored — covers both 6-digit and 8-char codes
  const keywordPatterns = [
    /(?:code|verification|security|one[- ]time|otp|pin)[:\s]+([A-Za-z0-9]{6,8})\b/i,
    /(?:paste|enter|use|type)\s+(?:this\s+)?(?:code\s+)?.*?\b([A-Za-z0-9]{6,8})\b/i,
    /\b([A-Za-z0-9]{6,8})\b\s+(?:is your|is the)\s+(?:code|verification|security)/i,
  ];

  for (const pattern of keywordPatterns) {
    const match = content.match(pattern);
    if (match) return match[1];
  }

  // Strategy 3: standalone 6-digit code (very common standalone format)
  const standalone6 = content.match(/(?:^|\s|>)(\d{6})(?:\s|<|$)/);
  if (standalone6) return standalone6[1];

  // Strategy 4: 8-char fallback with skip-list and mixed-case heuristic
  const skipWords = new Set([
    "password", "required", "security", "continue", "verified", "nyaradzo",
    "applying", "position", "accepted", "complete", "entering", "personal",
    "optional", "response", "previous", "checkbox", "employer", "disabled",
    "verification", "application", "recently", "received", "internal",
    "external", "subject", "company", "candidate", "interview",
  ]);

  const allMatches = content.match(/\b[A-Za-z0-9]{8}\b/g);
  if (allMatches) {
    for (const candidate of allMatches) {
      if (skipWords.has(candidate.toLowerCase())) continue;
      if (/^[a-z]+$/.test(candidate)) continue;
      if (/[0-9]/.test(candidate) || /[A-Z].*[a-z]|[a-z].*[A-Z]/.test(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}
