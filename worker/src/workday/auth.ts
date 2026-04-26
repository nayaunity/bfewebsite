/**
 * Workday auth gate. Detects "Apply" → "Apply Manually" → Create Account /
 * Sign In screen and forks to the appropriate flow.
 *
 * Reconnaissance against Walmart (Apr 25, 2026) confirmed Workday's stable
 * data-automation-id selectors for the apply gate:
 *   - "adventureButton"             → primary Apply button on listing page
 *   - "applyManually"               → "Apply Manually" option on the gate
 *   - "applyWithLinkedIn"           → LinkedIn (we ignore)
 *   - "useMyLastApplication"        → autofill from prior app (we ignore for first attempt)
 * On the Create Account page:
 *   - "email" / "password" / "verifyPassword"  (text/password inputs)
 *   - "createAccountSubmitButton"
 *   - "beecatcher" (HONEYPOT — must remain empty)
 *   - "signInLink"
 * On the Sign In page:
 *   - "email" / "password"
 *   - "signInSubmitButton"
 *
 * Flow:
 *  1. Click Apply → wait for the "Apply Manually" option
 *  2. Click Apply Manually
 *  3. Land on Create Account by default. If we have existing creds, click
 *     "Sign In" link first to switch into signin mode.
 *  4. Fill the form and submit
 *  5. For new accounts: poll for verify email, navigate to verify URL
 */

import type { Locator, Page } from "playwright";
import type { ApplicantData } from "../apply-engine.js";
import { fieldMapFor, type WorkdayTenant } from "./tenants.js";
import { getOrCreateCredential } from "./credentials.js";
import { waitForWorkdayVerifyLink } from "./email-verify.js";

export interface AuthArgs {
  page: Page;
  tenant: WorkdayTenant;
  userId: string;
  applicationEmail: string;
  applicant: ApplicantData;
  steps: string[];
  /** Returns ms remaining in the soft budget. */
  deadlineMs: () => number;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  isNewAccount?: boolean;
}

const SHORT_TIMEOUT_MS = 8_000;
const NAV_TIMEOUT_MS = 20_000;

function aid(automationId: string): string {
  return `[data-automation-id="${automationId}"]`;
}

async function clickIfVisible(loc: Locator, label: string, steps: string[]): Promise<boolean> {
  try {
    if (await loc.isVisible({ timeout: SHORT_TIMEOUT_MS })) {
      await loc.click({ timeout: SHORT_TIMEOUT_MS });
      steps.push(`workday: clicked ${label}`);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export async function signupOrSignin(args: AuthArgs): Promise<AuthResult> {
  const { page, tenant, userId, applicationEmail, steps, deadlineMs } = args;

  const cred = await getOrCreateCredential(userId, tenant.host, applicationEmail);
  steps.push(`workday: creds ${cred.isNew ? "newly generated" : "existing"} for ${tenant.host} (email=${cred.email})`);
  // For signin, ALWAYS use the email stored at signup time, not the caller-
  // provided applicationEmail. If the user's applicationEmail was later
  // rotated, the stored email is what Walmart still has on file.
  const accountEmail = cred.email;

  // Step 1: click "Apply" on the listing page. Workday's primary apply
  // button is consistently `data-automation-id="adventureButton"`.
  const applied = await clickIfVisible(
    page.locator(aid("adventureButton")).first(),
    "Apply (adventureButton)",
    steps,
  );
  if (!applied) {
    return { success: false, error: "workday-apply-button-not-found" };
  }
  await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS }).catch(() => {});

  // Step 2: click "Apply Manually" on the gate.
  const manual = await clickIfVisible(
    page.locator(aid("applyManually")).first(),
    "Apply Manually",
    steps,
  );
  if (!manual) {
    return { success: false, error: "workday-apply-manually-not-found" };
  }
  await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS }).catch(() => {});

  // Step 3: switch to signin mode if we have existing creds.
  if (!cred.isNew) {
    const switched = await clickIfVisible(
      page.locator(aid("signInLink")).first(),
      "Sign In link (existing creds path)",
      steps,
    );
    if (!switched) {
      // Page might already be in signin mode — proceed.
      steps.push("workday: signInLink not visible — assuming already on Sign In");
    }
    await page.waitForTimeout(1000);
    return await fillSigninForm(args, accountEmail, cred.password);
  }

  if (deadlineMs() <= 0) return { success: false, error: "workday-budget-exhausted" };

  return await fillSignupForm(args, accountEmail, cred.password);
}

async function fillSignupForm(args: AuthArgs, accountEmail: string, password: string): Promise<AuthResult> {
  const { page, tenant, applicationEmail, steps, deadlineMs } = args;
  const fields = fieldMapFor(tenant);

  // Workday's React inputs need real keystrokes to register the change event.
  // `.fill()` value-sets without dispatching React's onChange in some tenants,
  // which leaves the submit button perpetually disabled. Use pressSequentially
  // (per-keystroke) and Tab to blur after.
  await typeInto(page, aid(fields.signupEmail), accountEmail);
  await typeInto(page, aid(fields.signupPassword), password);
  await typeInto(page, aid(fields.signupPasswordVerify), password);
  // Tab to blur — encourages validation to settle so the submit becomes clickable.
  await page.locator(aid(fields.signupPasswordVerify)).first().press("Tab").catch(() => {});
  await page.waitForTimeout(1200);

  // CRITICAL: do NOT fill the `beecatcher` honeypot. Workday's bot detector
  // flags any account where this hidden input has a value.
  steps.push(`workday: filled signup form (email + password). Honeypot left empty.`);

  // Some tenants have an "I agree to the terms" checkbox. Walmart does not as
  // of Apr 25, 2026, but tenants vary. We try a generic terms checkbox click
  // and silently no-op if not present.
  const termsCheckbox = page.locator('[data-automation-id*="terms"]').first();
  await termsCheckbox.check({ timeout: 2000 }).catch(() => {});

  // Submit. Try normal click; fall back to force-click if the button reports
  // un-actionable — Walmart's submit is sometimes covered by a tooltip.
  await clickWithForceFallback(page, aid(fields.signupSubmit), steps, "Create Account submit");

  // Wait for either email-verify gate or direct redirect into the wizard.
  await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS }).catch(() => {});
  await page.waitForTimeout(2000);

  // Check page state. If the URL or page text indicates we need to verify
  // email, poll the inbound table for the verify link.
  const url = page.url();
  const html = await page.content().catch(() => "");
  const needsEmailVerify =
    /verify|confirm/i.test(url) ||
    /please verify|check your email|verification email|confirm your email/i.test(html);

  if (needsEmailVerify) {
    steps.push("workday: email verification gate detected, polling InboundEmail");
    const remainingForVerify = Math.min(deadlineMs() - 30_000, 240_000);
    if (remainingForVerify <= 0) {
      return { success: false, error: "workday-budget-exhausted-before-verify" };
    }
    // Poll the InboundEmail table at the SAME address Workday will send the
    // verify link to — the account email we just signed up with.
    const result = await waitForWorkdayVerifyLink(accountEmail, remainingForVerify);
    if (!result.link) {
      return {
        success: false,
        error: `workday-verify-email-timeout (inboundCount=${result.inboundEmailCountInWindow}, polls=${result.pollCount})`,
      };
    }
    steps.push(`workday: navigating to verify link after ${result.elapsedMs}ms`);
    await page.goto(result.link, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  steps.push("workday: signup flow complete");
  return { success: true, isNewAccount: true };
}

async function fillSigninForm(args: AuthArgs, accountEmail: string, password: string): Promise<AuthResult> {
  const { page, tenant, steps } = args;
  const fields = fieldMapFor(tenant);

  await typeInto(page, aid(fields.signinEmail), accountEmail);
  await typeInto(page, aid(fields.signinPassword), password);
  await page.locator(aid(fields.signinPassword)).first().press("Tab").catch(() => {});
  await page.waitForTimeout(1500);
  steps.push("workday: filled signin form");

  if (process.env.WORKDAY_DEBUG === "1") {
    await page.screenshot({ path: `worker/test/integration/wd-debug-pre-signin-${Date.now()}.png`, fullPage: true }).catch(() => {});
  }

  await clickWithForceFallback(page, aid(fields.signinSubmit), steps, "Sign In submit");
  // Workday's signin transition is sometimes a SPA state change rather than
  // a real navigation. Wait longer for the wizard's progress bar to repaint.
  await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS }).catch(() => {});
  await page.waitForTimeout(4000);

  // Observability: log the URL + page title so we can see what state we're in.
  steps.push(`workday: post-signin url=${page.url()} title="${await page.title().catch(() => "")}"`);
  if (process.env.WORKDAY_DEBUG === "1") {
    await page.screenshot({ path: `worker/test/integration/wd-debug-post-signin-${Date.now()}.png`, fullPage: true }).catch(() => {});
  }

  steps.push("workday: signin flow complete");
  return { success: true, isNewAccount: false };
}

/**
 * Type into a Workday React input with real keystrokes so the controlled
 * component's onChange fires. Plain .fill() can leave validation in a stale
 * state with the submit button disabled.
 */
async function typeInto(page: Page, selector: string, value: string): Promise<void> {
  const el = page.locator(selector).first();
  try {
    await el.click({ timeout: SHORT_TIMEOUT_MS });
  } catch {
    // ignore — the locator might still be type-able even without a focused click
  }
  await el.pressSequentially(value, { delay: 25 });
}

/**
 * Click that falls back to force=true when actionability checks fail. Workday
 * sometimes covers the submit button with a transient tooltip overlay; the
 * underlying click still registers correctly when forced.
 */
async function clickWithForceFallback(
  page: Page,
  selector: string,
  steps: string[],
  label: string,
): Promise<void> {
  try {
    await page.locator(selector).first().click({ timeout: SHORT_TIMEOUT_MS });
    steps.push(`workday: clicked ${label}`);
    return;
  } catch {
    steps.push(`workday: ${label} normal-click timed out — using force=true`);
    await page.locator(selector).first().click({ force: true, timeout: SHORT_TIMEOUT_MS }).catch(() => {});
  }
}
