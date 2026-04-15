/**
 * Worker diagnostics.
 *
 * Two goals:
 *  1) On startup, log the egress IP so we can verify which upstream anti-bot
 *     services will see us (Railway datacenter IPs are often pre-flagged).
 *  2) Capture a full-page screenshot + page URL + HTML size at the moment of
 *     a failed apply so we can see what the worker actually saw — not what
 *     our local machine saw. Upload to Vercel Blob.
 */

import { chromium, type Page } from "playwright";

let loggedEgressIp = false;
let loggedBrowserBinary = false;

/**
 * On worker startup, log which Playwright browser binary is actually being
 * resolved. We pin `channel: 'chromium'` in launch options to opt out of
 * `chromium-headless-shell` (the stripped-down binary used by Playwright's
 * default headless mode since v1.49). If the executable path still contains
 * "headless-shell", the channel setting isn't taking effect — likely because
 * the Dockerfile didn't `npx playwright install chromium` for the version
 * we're actually running.
 */
export async function logBrowserBinaryOnce(): Promise<void> {
  if (loggedBrowserBinary) return;
  loggedBrowserBinary = true;
  try {
    const defaultPath = chromium.executablePath();
    let chromiumChannelPath: string | null = null;
    try {
      // Newer Playwright supports passing options to executablePath()
      chromiumChannelPath = (chromium as unknown as {
        executablePath: (opts?: { channel?: string }) => string;
      }).executablePath({ channel: "chromium" });
    } catch {
      chromiumChannelPath = "(unable to resolve channel:chromium path)";
    }
    const isHeadlessShell = /headless[-_]shell/i.test(chromiumChannelPath || defaultPath);
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      level: isHeadlessShell ? "warn" : "info",
      event: "browser_binary",
      defaultPath,
      chromiumChannelPath,
      isHeadlessShell,
      browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH ?? null,
      // Verify xvfb / headed setup:
      headlessEnv: process.env.HEADLESS ?? null,
      display: process.env.DISPLAY ?? null,
    }));
  } catch (err) {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      level: "warn",
      event: "browser_binary",
      error: err instanceof Error ? err.message : String(err),
    }));
  }
}

export async function logEgressIpOnce(): Promise<void> {
  if (loggedEgressIp) return;
  loggedEgressIp = true;
  try {
    const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(5000) });
    const { ip } = (await res.json()) as { ip: string };
    console.log(JSON.stringify({ ts: new Date().toISOString(), level: "info", event: "egress_ip", ip }));
  } catch (err) {
    console.log(JSON.stringify({ ts: new Date().toISOString(), level: "warn", event: "egress_ip", error: err instanceof Error ? err.message : String(err) }));
  }
}

/**
 * Capture the page state for diagnosis. Uploads a full-page PNG to Vercel Blob
 * and returns its public URL. Swallows all errors — diagnosis must never
 * break the caller.
 */
export async function captureFailureSnapshot(
  page: Page,
  label: string
): Promise<{ screenshotUrl: string | null; pageUrl: string; htmlBytes: number } | null> {
  try {
    const pageUrl = page.url();
    let htmlBytes = 0;
    try {
      const html = await page.content();
      htmlBytes = html.length;
    } catch { /* page may be closed */ }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    let screenshotUrl: string | null = null;
    if (token) {
      const png = await page.screenshot({ fullPage: true, timeout: 10_000 }).catch(() => null);
      if (png) {
        const safeLabel = label.replace(/[^a-z0-9-]+/gi, "-").slice(0, 60);
        const fileName = `apply-failures/${Date.now()}-${safeLabel}.png`;
        const resp = await fetch(`https://blob.vercel-storage.com/${fileName}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-api-version": "7",
            "x-content-type": "image/png",
          },
          body: new Uint8Array(png),
        });
        if (resp.ok) {
          const data = (await resp.json()) as { url: string };
          screenshotUrl = data.url;
        }
      }
    }

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      level: "warn",
      event: "failure_snapshot",
      label,
      pageUrl,
      htmlBytes,
      screenshotUrl,
    }));

    return { screenshotUrl, pageUrl, htmlBytes };
  } catch {
    return null;
  }
}
