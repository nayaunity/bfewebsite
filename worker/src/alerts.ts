/**
 * Worker → Next.js alert hand-off.
 *
 * Fires-and-forgets a POST to /api/alerts/credit-exhausted (or similar). The
 * Next.js endpoint writes an AdminAlert row that the admin panel surfaces as a
 * red banner. No email is sent from here — per CLAUDE.md, emails require
 * explicit approval, so Resend lives only in the Next.js codebase.
 */

interface CreditAlertPayload {
  sessionId: string;
  userId: string;
  rawError: string;
}

let lastCreditAlertAt = 0;
const CREDIT_ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 1 alert per 15 min max

export async function postCreditAlert(payload: CreditAlertPayload): Promise<void> {
  const now = Date.now();
  if (now - lastCreditAlertAt < CREDIT_ALERT_COOLDOWN_MS) return;
  lastCreditAlertAt = now;

  const url = process.env.ALERT_ENDPOINT_URL;
  const secret = process.env.ALERT_SECRET;
  if (!url || !secret) {
    console.warn("[alerts] ALERT_ENDPOINT_URL / ALERT_SECRET not set — skipping credit alert");
    return;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-alert-secret": secret,
      },
      body: JSON.stringify({
        kind: "credit_exhausted",
        sessionId: payload.sessionId,
        userId: payload.userId,
        rawError: payload.rawError,
        at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn("[alerts] postCreditAlert failed:", err);
  }
}
