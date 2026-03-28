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
  const content = text || html;
  if (!content) return null;

  // Strip HTML tags for cleaner matching
  const plainText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  // Try specific patterns first
  const patterns = [
    /(?:code|verification|security)[:\s]+([A-Za-z0-9]{8})\b/i,
    /\b([A-Za-z0-9]{8})\b(?:\s*to\s*(?:confirm|verify))/i,
    /(?:enter|use)\s+(?:the\s+)?(?:code\s+)?([A-Za-z0-9]{8})\b/i,
  ];

  for (const pattern of patterns) {
    const match = plainText.match(pattern);
    if (match) return match[1];
  }

  // Fallback: find any standalone 8-char alphanumeric token
  // that isn't a common word or known non-code pattern
  const allMatches = plainText.match(/\b[A-Za-z0-9]{8}\b/g);
  if (allMatches) {
    for (const candidate of allMatches) {
      // Skip if it's a common word or all lowercase (likely a word, not a code)
      if (/^[a-z]+$/.test(candidate)) continue;
      // Skip common 8-letter words
      if (["password", "required", "security", "continue", "verified"].includes(candidate.toLowerCase())) continue;
      // Codes typically have mixed case or numbers
      if (/[0-9]/.test(candidate) || /[A-Z].*[a-z]|[a-z].*[A-Z]/.test(candidate)) {
        return candidate;
      }
    }
    // If still no match, return the first non-word candidate
    for (const candidate of allMatches) {
      if (!/^[a-z]+$/.test(candidate)) return candidate;
    }
  }

  return null;
}
