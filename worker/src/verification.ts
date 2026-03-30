import { getDb } from "./db";

/**
 * Poll the InboundEmail table for a Greenhouse verification code.
 * The webhook stores incoming emails; we read them here.
 */
export async function waitForVerificationCode(
  applicationEmail: string,
  maxWaitMs: number = 60_000,
  pollIntervalMs: number = 3_000
): Promise<string | null> {
  const db = getDb();
  const startTime = Date.now();

  console.log(`[Verification] Waiting for code at ${applicationEmail} (max ${maxWaitMs / 1000}s)`);

  while (Date.now() - startTime < maxWaitMs) {
    const result = await db.execute({
      sql: `SELECT id, textBody, htmlBody FROM InboundEmail
            WHERE toEmail = ? AND processed = 0
            AND receivedAt > datetime('now', '-3 minutes')
            ORDER BY receivedAt DESC LIMIT 1`,
      args: [applicationEmail],
    });

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      const textBody = (row.textBody as string) || "";
      const htmlBody = (row.htmlBody as string) || "";
      const code = extractVerificationCode(textBody, htmlBody);

      if (code) {
        // Mark as processed
        await db.execute({
          sql: `UPDATE InboundEmail SET processed = 1 WHERE id = ?`,
          args: [row.id as string],
        });
        console.log(`[Verification] Got code: ${code.slice(0, 2)}******`);
        return code;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  console.log("[Verification] Timed out waiting for code");
  return null;
}

/**
 * Extract an 8-character verification code from email body.
 * Greenhouse sends codes as 8 alphanumeric characters.
 */
function extractVerificationCode(text: string, html: string): string | null {
  // Strategy 1: Greenhouse puts the code inside an <h1> tag in the HTML
  if (html) {
    const h1Match = html.match(/<h1[^>]*>\s*([A-Za-z0-9]{8})\s*<\/h1>/i);
    if (h1Match) return h1Match[1];

    // Also try <strong>, <b>, or <code> tags
    const boldMatch = html.match(/<(?:strong|b|code)[^>]*>\s*([A-Za-z0-9]{8})\s*<\/(?:strong|b|code)>/i);
    if (boldMatch) return boldMatch[1];
  }

  // Strategy 2: Look in plain text for code near keywords
  const content = text || (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") : "");
  if (!content) return null;

  const patterns = [
    /(?:code|verification|security)[:\s]+([A-Za-z0-9]{8})\b/i,
    /(?:paste|enter|use)\s+(?:this\s+)?(?:code\s+)?.*?([A-Za-z0-9]{8})\b/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[1];
  }

  // Strategy 3: Fallback — find 8-char tokens with mixed case or numbers
  // Skip common English words and names
  const skipWords = new Set([
    "password", "required", "security", "continue", "verified", "nyaradzo",
    "applying", "position", "accepted", "complete", "entering", "personal",
    "optional", "response", "previous", "checkbox", "employer", "disabled",
  ]);

  const allMatches = content.match(/\b[A-Za-z0-9]{8}\b/g);
  if (allMatches) {
    for (const candidate of allMatches) {
      if (skipWords.has(candidate.toLowerCase())) continue;
      if (/^[a-z]+$/.test(candidate)) continue; // All lowercase = likely a word
      if (/[0-9]/.test(candidate) || /[A-Z].*[a-z]|[a-z].*[A-Z]/.test(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}
