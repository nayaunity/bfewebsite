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
  await page.waitForTimeout(2000);

  // Some tenants (e.g., Adobe) skip the auth gate entirely and go straight
  // to the wizard. Detect by checking for the progress bar or My Information
  // form fields rather than an auth form.
  const hasProgressBar = await page.locator(aid("progressBar")).first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  const hasWizardForm = await page.locator(aid("formField-legalName--firstName"))
    .first().isVisible({ timeout: 2000 }).catch(() => false);
  if (hasProgressBar || hasWizardForm) {
    const hasAuthForm = await page.locator(`${aid("createAccountSubmitButton")}, ${aid("signInSubmitButton")}`)
      .first().isVisible({ timeout: 1500 }).catch(() => false);
    if (!hasAuthForm) {
      steps.push("workday: no auth gate detected — wizard starts immediately");
      return { success: true, isNewAccount: false };
    }
  }

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
  //
  // Some tenants (e.g., Adobe) use different data-automation-id values for
  // the signup form. Try the configured IDs first, then fall back to
  // common alternatives.
  const emailFilled = await typeIntoWithFallback(page, [
    aid(fields.signupEmail),
    aid("email"),
    aid("signUpEmailAddress"),
    'input[type="email"]',
    'input[autocomplete="email"]',
  ], accountEmail);
  if (!emailFilled) {
    return { success: false, error: "workday-signup-email-field-not-found" };
  }

  await typeIntoWithFallback(page, [
    aid(fields.signupPassword),
    aid("password"),
    aid("signUpPassword"),
    'input[type="password"]',
  ], password);

  await typeIntoWithFallback(page, [
    aid(fields.signupPasswordVerify),
    aid("verifyPassword"),
    aid("confirmPassword"),
    'input[type="password"]:nth-of-type(2)',
  ], password);

  // Tab to blur — encourages validation to settle so the submit becomes clickable.
  await page.keyboard.press("Tab").catch(() => {});
  await page.waitForTimeout(1200);

  // CRITICAL: do NOT fill the `beecatcher` honeypot. Workday's bot detector
  // flags any account where this hidden input has a value.
  steps.push(`workday: filled signup form (email + password). Honeypot left empty.`);

  // Wait for form to settle after password fill.
  await page.waitForTimeout(1500);

  // Check ALL visible checkboxes on the signup page (terms, privacy, etc.).
  const allCheckboxes = await page.locator('input[type="checkbox"]').all();
  for (const cb of allCheckboxes) {
    if (await cb.isVisible({ timeout: 800 }).catch(() => false)) {
      const checked = await cb.isChecked().catch(() => true);
      if (!checked) await cb.check({ timeout: 2000 }).catch(() => {});
    }
  }
  // Also try custom checkbox components (Workday sometimes uses div-based toggles).
  const customCheckboxes = await page.locator('[role="checkbox"]').all();
  for (const cb of customCheckboxes) {
    if (await cb.isVisible({ timeout: 500 }).catch(() => false)) {
      const state = await cb.getAttribute("aria-checked").catch(() => "true");
      if (state !== "true") await cb.click({ timeout: 2000 }).catch(() => {});
    }
  }

  // Scroll submit button into view and give the form time to enable it.
  await page.evaluate("window.scrollTo(0, document.body.scrollHeight)").catch(() => {});
  await page.waitForTimeout(1000);

  // Submit. Try the configured button first, then common fallbacks.
  const submitClicked = await clickWithFallbackSelectors(page, [
    aid(fields.signupSubmit),
    aid("createAccountSubmitButton"),
    'button[type="submit"]',
    'button:has-text("Create Account")',
    'button:has-text("Sign Up")',
  ], steps, "Create Account submit");
  if (!submitClicked) {
    return { success: false, error: "workday-signup-submit-not-found" };
  }

  // Wait for either email-verify gate or direct redirect into the wizard.
  await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS }).catch(() => {});
  await page.waitForTimeout(2000);

  // Check for signup errors (e.g., "email already in use", validation failures).
  const errorText = await page.evaluate(`(function(){
    var errs = document.querySelectorAll('[data-automation-id*="error"], [role="alert"], .error-message, [class*="error"]');
    return Array.from(errs).map(function(e){ return (e.innerText || e.textContent || '').trim(); }).filter(Boolean).join(' | ').slice(0, 300);
  })()`).catch(() => "") as string;
  if (errorText) {
    steps.push(`workday: signup errors detected: ${errorText}`);
  }

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

  // Some tenants (e.g., Capital One) land on /login/ok?redirect=... after
  // verify/signup. Follow the redirect param to reach the actual wizard.
  const postAuthUrl = page.url();
  const redirectMatch = postAuthUrl.match(/[?&]redirect=([^&]+)/);
  if (redirectMatch) {
    const redirectPath = decodeURIComponent(redirectMatch[1]);
    const base = new URL(postAuthUrl).origin;
    const target = redirectPath.startsWith("http") ? redirectPath : `${base}${redirectPath}`;
    steps.push(`workday: following redirect param → ${target}`);
    await page.goto(target, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  // Some tenants (e.g., Capital One) redirect back to the auth page after
  // verify. The account exists but the session isn't authenticated. Detect
  // the auth form and sign in. First check if the page still shows the
  // Create Account form — if so, switch to Sign In mode first.
  const hasCreateForm = await page.locator(aid("createAccountSubmitButton")).first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  const hasSigninForm = await page.locator(aid("signInSubmitButton")).first()
    .isVisible({ timeout: 2000 }).catch(() => false);
  if (hasCreateForm || hasSigninForm) {
    steps.push(`workday: post-signup auth page detected (create=${hasCreateForm}, signin=${hasSigninForm})`);
    if (hasCreateForm && !hasSigninForm) {
      await clickIfVisible(page.locator(aid("signInLink")).first(), "signInLink (switch to signin)", steps);
      await page.waitForTimeout(1500);
    }
    const fields = fieldMapFor(args.tenant);
    await typeInto(page, aid(fields.signinEmail), accountEmail);
    await typeInto(page, aid(fields.signinPassword), password);
    await page.locator(aid(fields.signinPassword)).first().press("Tab").catch(() => {});
    await page.waitForTimeout(1500);
    await clickWithForceFallback(page, aid(fields.signinSubmit), steps, "post-signup Sign In");
    await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS }).catch(() => {});
    await page.waitForTimeout(4000);
    steps.push(`workday: post-signup signin url=${page.url()}`);

    // Follow redirect param again after signin (same logic as above).
    const postSigninUrl = page.url();
    const signinRedirect = postSigninUrl.match(/[?&]redirect=([^&]+)/);
    if (signinRedirect) {
      const rPath = decodeURIComponent(signinRedirect[1]);
      const base = new URL(postSigninUrl).origin;
      const target = rPath.startsWith("http") ? rPath : `${base}${rPath}`;
      steps.push(`workday: following post-signin redirect → ${target}`);
      await page.goto(target, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS }).catch(() => {});
      await page.waitForTimeout(3000);
    }
  }

  steps.push("workday: signup flow complete");
  return { success: true, isNewAccount: true };
}

async function fillSigninForm(args: AuthArgs, accountEmail: string, password: string): Promise<AuthResult> {
  const { page, tenant, steps } = args;
  const fields = fieldMapFor(tenant);

  // Use typeIntoVisible instead of typeInto: after switching from Create Account
  // to Sign In, both forms coexist in the DOM with identical data-automation-id
  // values. `.first()` picks the hidden Create Account field. We need the visible one.
  await typeIntoVisible(page, aid(fields.signinEmail), accountEmail);
  await typeIntoVisible(page, aid(fields.signinPassword), password);
  const pwLoc = page.locator(`${aid(fields.signinPassword)}:visible`).first();
  await pwLoc.press("Tab").catch(() =>
    page.locator(aid(fields.signinPassword)).first().press("Tab").catch(() => {}));
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
  const postSigninTitle = await page.title().catch(() => "");
  steps.push(`workday: post-signin url=${page.url()} title="${postSigninTitle}"`);
  if (process.env.WORKDAY_DEBUG === "1") {
    await page.screenshot({ path: `worker/test/integration/wd-debug-post-signin-${Date.now()}.png`, fullPage: true }).catch(() => {});
  }

  // Detect sign-in failure: if the auth page is still showing after submit,
  // the credentials were wrong or the account doesn't exist on this tenant.
  // Fall back to account creation by reloading the apply page (which shows
  // the Create Account form by default).
  const stillOnAuth = await page.locator(`${aid("createAccountSubmitButton")}, ${aid("signInSubmitButton")}`)
    .first().isVisible({ timeout: 2000 }).catch(() => false);
  if (stillOnAuth || /create account/i.test(postSigninTitle)) {
    steps.push("workday: signin failed (auth page still visible) — reloading for account creation");
    await page.reload({ waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS }).catch(() => {});
    await page.waitForTimeout(2000);
    // Re-click Apply → Apply Manually to get back to the auth gate.
    await clickIfVisible(page.locator(aid("adventureButton")).first(), "Apply (retry)", steps);
    await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS }).catch(() => {});
    await clickIfVisible(page.locator(aid("applyManually")).first(), "Apply Manually (retry)", steps);
    await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS }).catch(() => {});
    await page.waitForTimeout(2000);
    return await fillSignupForm(args, accountEmail, password);
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

async function typeIntoVisible(page: Page, selector: string, value: string): Promise<void> {
  const allEls = page.locator(selector);
  const count = await allEls.count();
  for (let i = 0; i < count; i++) {
    const el = allEls.nth(i);
    if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
      try { await el.click({ timeout: SHORT_TIMEOUT_MS }); } catch { /* ignore */ }
      await el.pressSequentially(value, { delay: 25 });
      return;
    }
  }
  await typeInto(page, selector, value);
}

async function typeIntoWithFallback(page: Page, selectors: string[], value: string): Promise<boolean> {
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      try {
        await el.click({ timeout: SHORT_TIMEOUT_MS }).catch(() => {});
        await el.pressSequentially(value, { delay: 50 });
        // Verify the value was typed correctly
        const got = await el.inputValue().catch(() => "");
        if (got !== value) {
          await el.fill(value).catch(() => {});
        }
        return true;
      } catch {
        continue;
      }
    }
  }
  return false;
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

async function clickWithFallbackSelectors(
  page: Page,
  selectors: string[],
  steps: string[],
  label: string,
): Promise<boolean> {
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      try {
        await el.click({ timeout: SHORT_TIMEOUT_MS });
        steps.push(`workday: clicked ${label} via ${sel}`);
        return true;
      } catch {
        steps.push(`workday: ${label} normal-click timed out on ${sel} — using force=true`);
        await el.click({ force: true, timeout: SHORT_TIMEOUT_MS }).catch(() => {});
        return true;
      }
    }
  }
  return false;
}
