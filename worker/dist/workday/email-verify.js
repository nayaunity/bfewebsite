"use strict";
/**
 * Wait for a Workday email-verification link to land in the InboundEmail
 * table. Sibling of `worker/src/verification.ts:waitForVerificationCode` —
 * same polling cadence and table, but extracts a clickable URL instead of a
 * code, and filters by sender domain so we don't accidentally match an
 * unrelated Greenhouse code that arrived during the same window.
 *
 * Returns the verify URL once it's present, or null on timeout. The caller
 * navigates to that URL to complete account verification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForWorkdayVerifyLink = waitForWorkdayVerifyLink;
const db_js_1 = require("../db.js");
/**
 * Strict regex for Workday verification URLs. Handles the common patterns:
 *   - https://wd5.myworkdaysite.com/.../register/verify?token=...
 *   - https://walmart.wd5.myworkdayjobs.com/.../verify-email/...
 *   - https://*.workday.com/registration/confirm?...
 * We accept any path containing "verify" or "confirm" so we catch tenants
 * that use slightly different URL conventions.
 */
const VERIFY_URL_RX = /https?:\/\/[a-z0-9.-]*(?:myworkdayjobs\.com|myworkdaysite\.com|workday\.com)\/[^\s"'<>]*(?:verify|confirm|activate)[^\s"'<>]*/i;
function extractVerifyUrl(html, text) {
    // Try the HTML body first — most Workday emails have a button with the URL
    // wrapped in href="...". Strip HTML escapes (`&amp;` → `&`).
    if (html) {
        const m = html.match(VERIFY_URL_RX);
        if (m)
            return m[0].replace(/&amp;/g, "&");
    }
    if (text) {
        const m = text.match(VERIFY_URL_RX);
        if (m)
            return m[0];
    }
    return null;
}
async function waitForWorkdayVerifyLink(applicationEmail, maxWaitMs = 240_000, pollIntervalMs = 1_500) {
    const db = (0, db_js_1.getDb)();
    const startTime = Date.now();
    let pollCount = 0;
    let lastHtmlPreview;
    console.log(`[Workday verify] Waiting for verify link at ${applicationEmail} (max ${maxWaitMs / 1000}s)`);
    while (Date.now() - startTime < maxWaitMs) {
        pollCount++;
        const result = await db.execute({
            sql: `SELECT id, textBody, htmlBody, fromEmail FROM InboundEmail
            WHERE toEmail = ?
              AND receivedAt > datetime('now', '-5 minutes')
            ORDER BY receivedAt DESC LIMIT 5`,
            args: [applicationEmail],
        });
        if (result.rows && result.rows.length > 0) {
            for (const row of result.rows) {
                const r = row;
                const text = r.textBody ?? "";
                const html = r.htmlBody ?? "";
                lastHtmlPreview = html.slice(0, 400);
                // Filter by sender — Workday verification emails come from
                // *.myworkdayjobs.com or *.workday.com or related senders.
                const from = (r.fromEmail ?? "").toLowerCase();
                const fromLooksWorkday = from.includes("workday") ||
                    from.includes("myworkday") ||
                    from.includes("noreply") ||
                    from === "";
                if (!fromLooksWorkday)
                    continue;
                const link = extractVerifyUrl(html, text);
                if (link) {
                    // Mark this row processed so future polls don't re-extract it.
                    await db.execute({
                        sql: `UPDATE InboundEmail SET processed = 1 WHERE id = ?`,
                        args: [r.id],
                    });
                    const elapsedMs = Date.now() - startTime;
                    console.log(`[Workday verify] Link arrived after ${elapsedMs}ms (polls: ${pollCount})`);
                    return {
                        link,
                        elapsedMs,
                        pollCount,
                        inboundEmailCountInWindow: await countInboundInWindow(applicationEmail, startTime),
                    };
                }
            }
        }
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    const elapsedMs = Date.now() - startTime;
    const inboundEmailCountInWindow = await countInboundInWindow(applicationEmail, startTime);
    console.log(`[Workday verify] No link after ${elapsedMs}ms (polls: ${pollCount}, inbound emails seen: ${inboundEmailCountInWindow})`);
    return { link: null, elapsedMs, pollCount, inboundEmailCountInWindow, htmlPreview: lastHtmlPreview };
}
async function countInboundInWindow(applicationEmail, startTime) {
    try {
        const db = (0, db_js_1.getDb)();
        const startIso = new Date(startTime).toISOString().replace("T", " ").slice(0, 19);
        const result = await db.execute({
            sql: `SELECT COUNT(*) as c FROM InboundEmail WHERE toEmail = ? AND receivedAt >= ?`,
            args: [applicationEmail, startIso],
        });
        const c = result.rows?.[0]?.c;
        return typeof c === "number" ? c : Number(c) || 0;
    }
    catch {
        return 0;
    }
}
