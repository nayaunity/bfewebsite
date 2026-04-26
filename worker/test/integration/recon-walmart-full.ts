/**
 * Full Walmart Workday recon — extends recon-walmart.ts past the Create
 * Account form. Creates a REAL Walmart account at the test user's
 * applicationEmail, polls for the verify link via InboundEmail, navigates to
 * it, then walks every wizard page dumping data-automation-id attrs.
 *
 * Side effects:
 *   - One Walmart account is created at integration-test@apply.theblackfemaleengineer.com
 *   - One row in WorkdayCredential (userId=test, tenantHost=walmart...)
 *   - The account is reusable for subsequent smokes — they'll go down the
 *     signin path (helper detects existing creds).
 *
 * Required env:
 *   DATABASE_URL, DATABASE_AUTH_TOKEN  — Turso prod (read InboundEmail, write WorkdayCredential)
 *   WORKDAY_CREDENTIAL_KEY              — 64 hex chars, for password encryption
 *   INTEGRATION_TEST_USER_ID            — defaults to 1d16e543-db6e-497b-b78b-28fbf0a30626
 *
 * Usage:
 *   cd worker
 *   npx tsx test/integration/recon-walmart-full.ts
 */

import { chromium, type Page } from "playwright";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@libsql/client";
import { getOrCreateCredential } from "../../src/workday/credentials.js";
import { waitForWorkdayVerifyLink } from "../../src/workday/email-verify.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_USER_ID = process.env.INTEGRATION_TEST_USER_ID || "1d16e543-db6e-497b-b78b-28fbf0a30626";
const TENANT_HOST = "walmart.wd5.myworkdayjobs.com";

interface PageSnap {
  step: string;
  url: string;
  title: string;
  htmlBytes: number;
  inputs: Array<Record<string, unknown>>;
  buttonsAndLinks: Array<Record<string, unknown>>;
  automationIds: string[];
  progressBarText?: string;
}

async function snapshotPage(page: Page, step: string): Promise<PageSnap> {
  await page.waitForTimeout(2500);
  const data = await page.evaluate(`(function(){
    function visible(el) { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
    function snap(el) {
      return {
        tag: el.tagName.toLowerCase(),
        automationId: el.getAttribute('data-automation-id'),
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        name: el.getAttribute('name'),
        type: el.getAttribute('type'),
        placeholder: el.getAttribute('placeholder'),
        text: ((el.innerText || el.textContent) || '').trim().slice(0, 100),
        visible: visible(el),
      };
    }
    const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]')).map(snap).filter(function(s){ return s.visible; });
    const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(snap).filter(function(s){ return s.visible; });
    const allAutomationIds = Array.from(document.querySelectorAll('[data-automation-id]')).map(function(el){ return el.getAttribute('data-automation-id'); }).filter(function(v){ return !!v; });
    var progressBarText = '';
    var progressBar = document.querySelector('[data-automation-id="progressBar"]') || document.querySelector('[role="progressbar"]') || document.querySelector('[class*="progress" i]');
    if (progressBar) progressBarText = (progressBar.innerText || progressBar.textContent || '').trim().slice(0, 200);
    return {
      url: location.href,
      title: document.title,
      htmlBytes: document.documentElement.outerHTML.length,
      buttonsAndLinks: buttons,
      inputs: inputs,
      automationIds: Array.from(new Set(allAutomationIds)),
      progressBarText: progressBarText,
    };
  })()`) as Omit<PageSnap, "step">;
  return { step, ...data };
}

async function fetchOneInternUrl(): Promise<{ url: string; title: string } | null> {
  const r = await fetch(
    "https://walmart.wd5.myworkdayjobs.com/wday/cxs/walmart/WalmartExternal/jobs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: "intern" }),
    },
  );
  if (!r.ok) return null;
  const data = (await r.json()) as { jobPostings?: Array<{ title: string; externalPath: string }> };
  const intern = (data.jobPostings ?? []).find((j) => /intern/i.test(j.title));
  if (!intern) return null;
  return {
    url: `https://walmart.wd5.myworkdayjobs.com/en-US/WalmartExternal${intern.externalPath}`,
    title: intern.title,
  };
}

async function tryClickAutomationId(page: Page, automationId: string, label: string): Promise<boolean> {
  const sel = `[data-automation-id="${automationId}"]`;
  try {
    const loc = page.locator(sel).first();
    if (await loc.isVisible({ timeout: 6000 }).catch(() => false)) {
      console.log(`  click: ${label} (${automationId})`);
      await loc.click({ timeout: 8000 });
      await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(2000);
      return true;
    }
  } catch (e) {
    console.log(`  click failed for ${label}: ${e instanceof Error ? e.message.slice(0, 100) : e}`);
  }
  return false;
}

async function getApplicationEmail(): Promise<string> {
  // For recon iteration we want a FRESH email each run so signup always
  // succeeds (Walmart rejects re-registration of an existing email). All
  // `*@apply.theblackfemaleengineer.com` routes through SendGrid Inbound
  // Parse to our webhook regardless of local-part — so a unique local-part
  // works for the verify-link flow too.
  if (process.env.RECON_FRESH_EMAIL === "1") {
    const fresh = `recon-${Date.now().toString(36)}@apply.theblackfemaleengineer.com`;
    console.log(`[recon] Using fresh email: ${fresh}`);
    return fresh;
  }

  const db = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const r = await db.execute(`SELECT applicationEmail FROM User WHERE id = '${TEST_USER_ID}' LIMIT 1`);
  if (r.rows.length === 0 || !r.rows[0].applicationEmail) {
    throw new Error(`Test user ${TEST_USER_ID} has no applicationEmail`);
  }
  return r.rows[0].applicationEmail as string;
}

async function main() {
  const target = await fetchOneInternUrl();
  if (!target) { console.error("No intern URL"); process.exit(1); }
  console.log(`Target: ${target.title}\n${target.url}\n`);

  const applicationEmail = await getApplicationEmail();
  console.log(`Test applicationEmail: ${applicationEmail}\n`);

  // Provision credentials BEFORE the form fill so a crash mid-signup doesn't lose the password.
  const cred = await getOrCreateCredential(TEST_USER_ID, TENANT_HOST, applicationEmail);
  console.log(`Credential: ${cred.isNew ? "newly generated" : "EXISTING (signin path)"}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const snaps: PageSnap[] = [];

  try {
    // 01: listing
    await page.goto(target.url, { waitUntil: "networkidle", timeout: 30000 });
    snaps.push(await snapshotPage(page, "01-listing"));

    // 02: click Apply
    await tryClickAutomationId(page, "adventureButton", "Apply");
    snaps.push(await snapshotPage(page, "02-after-apply"));

    // 03: click Apply Manually (for new accounts; existing should land on signin)
    if (cred.isNew) {
      await tryClickAutomationId(page, "applyManually", "Apply Manually");
      snaps.push(await snapshotPage(page, "03-create-account-form"));

      // Fill via pressSequentially so React's controlled inputs register
      // each keystroke as a real change event. .fill() value-sets without
      // triggering React's onChange in some Workday tenants — the submit
      // stays disabled.
      const emailEl = page.locator('[data-automation-id="email"]').first();
      await emailEl.click().catch(() => {});
      await emailEl.pressSequentially(applicationEmail, { delay: 25 });

      const pwdEl = page.locator('[data-automation-id="password"]').first();
      await pwdEl.click().catch(() => {});
      await pwdEl.pressSequentially(cred.password, { delay: 25 });

      const verifyEl = page.locator('[data-automation-id="verifyPassword"]').first();
      await verifyEl.click().catch(() => {});
      await verifyEl.pressSequentially(cred.password, { delay: 25 });

      // Blur by tabbing — encourages validation to settle.
      await verifyEl.press("Tab").catch(() => {});
      await page.waitForTimeout(1500);
      console.log("Filled signup form via pressSequentially + Tab to blur");

      // Capture form state right before clicking submit.
      const beforeSubmitShot = resolve(__dirname, "recon-walmart-before-submit.png");
      await page.screenshot({ path: beforeSubmitShot, fullPage: true });
      console.log(`Before-submit screenshot: ${beforeSubmitShot}`);

      // Try normal click first; if that times out, force-click.
      const submitSel = '[data-automation-id="createAccountSubmitButton"]';
      let submitted = false;
      try {
        await page.locator(submitSel).first().click({ timeout: 5000 });
        submitted = true;
        console.log("Submit click: normal");
      } catch {
        console.log("Submit click timed out — trying force click");
        await page.locator(submitSel).first().click({ force: true, timeout: 5000 }).catch(() => {});
        submitted = true;
      }
      if (submitted) {
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(3000);
      }
      snaps.push(await snapshotPage(page, "04-after-create-submit"));
    } else {
      // Sign-in path
      await tryClickAutomationId(page, "applyManually", "Apply Manually");
      await page.waitForTimeout(1000);
      // Click "Sign In" link
      await tryClickAutomationId(page, "signInLink", "switch to Sign In");
      snaps.push(await snapshotPage(page, "03-signin-form"));

      const emailEl = page.locator('[data-automation-id="email"]').first();
      await emailEl.click().catch(() => {});
      await emailEl.pressSequentially(applicationEmail, { delay: 25 });

      const pwdEl = page.locator('[data-automation-id="password"]').first();
      await pwdEl.click().catch(() => {});
      await pwdEl.pressSequentially(cred.password, { delay: 25 });
      await pwdEl.press("Tab").catch(() => {});
      await page.waitForTimeout(1000);
      console.log("Filled signin form via pressSequentially");

      const signinSel = '[data-automation-id="signInSubmitButton"]';
      try {
        await page.locator(signinSel).first().click({ timeout: 5000 });
      } catch {
        console.log("Signin submit normal-click timed out — force click");
        await page.locator(signinSel).first().click({ force: true, timeout: 5000 }).catch(() => {});
      }
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(3000);
      snaps.push(await snapshotPage(page, "04-after-signin"));
    }

    // 05: poll for verify email (only for new accounts that need email verification)
    if (cred.isNew) {
      const url = page.url();
      const html = await page.content().catch(() => "");
      const needsVerify = /verify|confirm/i.test(url) || /please verify|check your email|verification email|confirm your email/i.test(html);
      if (needsVerify) {
        console.log("Email verify gate — polling InboundEmail (max 4 min)...");
        const result = await waitForWorkdayVerifyLink(applicationEmail, 240_000);
        if (!result.link) {
          console.error(`No verify link received. Inbound count: ${result.inboundEmailCountInWindow}, polls: ${result.pollCount}`);
          if (result.htmlPreview) console.error(`Last HTML: ${result.htmlPreview}`);
        } else {
          console.log(`Verify link received after ${result.elapsedMs}ms: ${result.link}`);
          await page.goto(result.link, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
          await page.waitForTimeout(3000);
          snaps.push(await snapshotPage(page, "05-after-verify-link"));
        }
      } else {
        console.log("No email verify gate detected — continuing");
      }
    }

    // 06+: walk wizard pages by clicking Next. Walmart's "Save & Continue"
    // is `pageFooterNextButton`, NOT `bottom-navigation-next-button`. Detect
    // the Review step from the progress bar's "current step N of N" line
    // (the bar lists ALL steps so a plain `/review/i` match fires too early).
    for (let i = 1; i <= 6; i++) {
      const snap = await snapshotPage(page, `06_${String(i).padStart(2, "0")}-wizard-step`);
      snaps.push(snap);
      const ids = new Set(snap.automationIds);
      if (ids.has("submitApplication") || ids.has("reviewSubmitButton")) {
        console.log(`[${snap.step}] reached submit page — stopping`);
        break;
      }
      // Match "current step N of N" — the last step is the Review page.
      const m = (snap.progressBarText ?? "").match(/current step (\d+) of (\d+)/i);
      if (m && m[1] === m[2]) {
        console.log(`[${snap.step}] on final wizard step (${m[1]}/${m[2]}) — stopping`);
        break;
      }
      const advanced = await tryClickAutomationId(page, "pageFooterNextButton", `Next (step ${i})`);
      if (!advanced) {
        console.log(`[${snap.step}] no pageFooterNextButton — stopping`);
        break;
      }
    }

    const finalShot = resolve(__dirname, "recon-walmart-full-final.png");
    await page.screenshot({ path: finalShot, fullPage: true });
    console.log(`\nFinal screenshot: ${finalShot}`);
  } catch (e) {
    console.error("Recon error:", e instanceof Error ? e.message : e);
  } finally {
    await context.close();
    await browser.close();
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = resolve(__dirname, `recon-walmart-full-${ts}.json`);
  writeFileSync(outPath, JSON.stringify({ target, applicationEmail, generatedAt: new Date().toISOString(), snaps }, null, 2));
  console.log(`\nWrote ${outPath}`);

  console.log("\n=== Recon Summary ===");
  for (const s of snaps) {
    console.log(`\n[${s.step}] ${s.url}`);
    console.log(`  title: "${s.title}"  inputs=${s.inputs.length} buttons=${s.buttonsAndLinks.length} aids=${s.automationIds.length}`);
    if (s.progressBarText) console.log(`  progress: "${s.progressBarText}"`);
    const wizardKws = /pageHeader|legalName|address|phone|email|password|next|submit|review|education|experience|workExperience|disability|veteran|gender|race|ethnicity|hispanic/i;
    const interesting = s.automationIds.filter((id) => wizardKws.test(id));
    if (interesting.length > 0) console.log(`  interesting aids: ${interesting.slice(0, 25).join(", ")}`);
  }
}

main().catch((e) => {
  console.error("recon-walmart-full crashed:", e);
  process.exit(1);
});
