/**
 * Walmart-specific Workday wizard driver. Drives the multi-step apply form
 * page-by-page using stable `data-automation-id` selectors confirmed by the
 * Apr 25, 2026 recon (which submitted a real test application end-to-end).
 *
 * Walmart's wizard (post-signup, 5 steps):
 *   1. My Information       — legalName, address, phone, "How Did You Hear" multiselect
 *   2. My Experience        — resume upload + LinkedIn (most fields optional)
 *   3. Application Questions — 10 tenant-specific Y/N + select fields
 *   4. Voluntary Disclosures — gender, race (optional) + REQUIRED T&C checkbox
 *   5. Review               — final confirmation; click pageFooterNextButton to submit
 *
 * Workday quirks handled:
 *   - React inputs need pressSequentially (not .fill) at >= 60ms/char
 *   - Submit buttons sometimes need force-click (covered by tooltip)
 *   - Multiselect dropdowns hide options behind promptIcon click
 *   - Hierarchical multiselects (source field) drill into submenus
 *   - role="option" includes selectedItem pills — must filter those out
 */

import type { Locator, Page } from "playwright";
import type { ApplicantData, ApplyResult } from "../apply-engine.js";
import type { WorkdayTenant } from "./tenants.js";

export interface WizardArgs {
  page: Page;
  tenant: WorkdayTenant;
  applicant: ApplicantData;
  resumePath: string;
  steps: string[];
  /** Returns ms remaining in the soft budget. */
  deadlineMs: () => number;
}

const FIELD_TIMEOUT_MS = 6_000;
const NAV_TIMEOUT_MS = 20_000;
const MAX_WIZARD_ITERATIONS = 8; // safety cap

function aid(automationId: string): string {
  return `[data-automation-id="${automationId}"]`;
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function detectStep(page: Page): Promise<{ current: number; total: number; rawText: string }> {
  const rawText = (await page.evaluate(`(function(){
    var bar = document.querySelector('[data-automation-id="progressBar"]') ||
              document.querySelector('[role="progressbar"]') ||
              document.querySelector('[class*="progress" i]');
    return bar ? (bar.innerText || bar.textContent || '') : '';
  })()`)) as string;
  const m = rawText.match(/current step (\d+) of (\d+)/i);
  if (!m) return { current: -1, total: -1, rawText: rawText.slice(0, 200) };
  return { current: parseInt(m[1], 10), total: parseInt(m[2], 10), rawText: rawText.slice(0, 200) };
}

async function typeIntoFormField(page: Page, formFieldAid: string, value: string): Promise<boolean> {
  const sel = `[data-automation-id="${formFieldAid}"] input`;
  const loc = page.locator(sel).first();
  if (!(await loc.isVisible({ timeout: 3000 }).catch(() => false))) return false;
  await loc.click({ timeout: FIELD_TIMEOUT_MS }).catch(() => {});
  await loc.pressSequentially(value, { delay: 60 });
  // Verify; if char dropped, retry via fill.
  const got = await loc.inputValue().catch(() => "");
  if (got !== value) await loc.fill(value).catch(() => {});
  return true;
}

async function selectFormFieldDropdown(page: Page, formFieldAid: string, optionText: string): Promise<boolean> {
  const triggers = [
    `[data-automation-id="${formFieldAid}"] button`,
    `[data-automation-id="${formFieldAid}"] [role="combobox"]`,
    `[data-automation-id="${formFieldAid}"] input`,
    `[data-automation-id="${formFieldAid}"]`,
  ];
  let opened = false;
  for (const sel of triggers) {
    const trigger = page.locator(sel).first();
    if (!(await trigger.isVisible({ timeout: 1500 }).catch(() => false))) continue;
    try {
      await trigger.click({ timeout: 2000 });
      opened = true;
      break;
    } catch {
      // try next trigger
    }
  }
  if (!opened) return false;
  await page.waitForTimeout(500);

  let opt: Locator = page.locator(`[role="option"]:not([data-automation-id="selectedItem"])`)
    .filter({ hasText: new RegExp(`^${escape(optionText)}`, "i") })
    .first();
  let visible = await opt.isVisible({ timeout: 1500 }).catch(() => false);

  if (!visible) {
    // Try filtering: type optionText into the formField input.
    const filterInput = page.locator(`[data-automation-id="${formFieldAid}"] input`).first();
    if (await filterInput.isVisible({ timeout: 1500 }).catch(() => false)) {
      await filterInput.click({ timeout: 1500 }).catch(() => {});
      await filterInput.pressSequentially(optionText, { delay: 30 }).catch(() => {});
      await page.waitForTimeout(700);
      opt = page.locator(`[role="option"]:not([data-automation-id="selectedItem"])`)
        .filter({ hasText: new RegExp(escape(optionText), "i") })
        .first();
      visible = await opt.isVisible({ timeout: 2000 }).catch(() => false);
    }
  }

  if (!visible) {
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }
  await opt.click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(200);
  return true;
}

/**
 * Workday hierarchical multiselect (e.g., "How Did You Hear About Us?").
 * Click promptIcon to open, list options, click first non-"Other"; if it
 * drilled into a submenu, click first sub-option. Then dismiss popover.
 */
async function selectMultiselect(page: Page, formFieldAid: string, preferText?: string): Promise<boolean> {
  // Dismiss any stuck-open popover first.
  await page.keyboard.press("Escape").catch(() => {});
  await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(200);

  const icon = page.locator(`[data-automation-id="${formFieldAid}"] [data-automation-id="promptIcon"]`).first();
  if (await icon.isVisible({ timeout: 1500 }).catch(() => false)) {
    await icon.click({ timeout: 2000 }).catch(() => {});
  } else {
    const input = page.locator(`[data-automation-id="${formFieldAid}"] input`).first();
    if (!(await input.isVisible({ timeout: 1500 }).catch(() => false))) return false;
    await input.click({ timeout: 2000 }).catch(() => {});
  }
  await page.waitForTimeout(900);

  const options = await listOptions(page);
  if (options.length === 0) {
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }
  const pick = (preferText && options.find((o) => new RegExp(escape(preferText), "i").test(o)))
    || options.find((o) => o && !/^other$/i.test(o))
    || options[0];
  const opt = page.locator(`[role="option"]:not([data-automation-id="selectedItem"])`).filter({ hasText: pick }).first();
  if (!(await opt.isVisible({ timeout: 1500 }).catch(() => false))) {
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }
  await opt.click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(700);

  // Hierarchical drill-down (e.g., source → Advertising → Billboard).
  const subOptions = await listOptions(page);
  if (subOptions.length > 0 && !subOptions.includes(pick)) {
    const subPick = subOptions.find((o) => o && !/^other$/i.test(o)) || subOptions[0];
    const subOpt = page.locator(`[role="option"]:not([data-automation-id="selectedItem"])`).filter({ hasText: subPick }).first();
    if (await subOpt.isVisible({ timeout: 1500 }).catch(() => false)) {
      await subOpt.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
  }
  await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(300);
  return true;
}

async function listOptions(page: Page): Promise<string[]> {
  return (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[role="option"]')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      if (el.getAttribute('data-automation-id') === 'selectedItem') return false;
      if (el.closest('[data-automation-id="selectedItemList"]')) return false;
      return true;
    }).map(function(el){ return ((el.innerText || el.textContent) || '').trim().split('\\n')[0].slice(0,80); });
  })()`)) as string[];
}

async function clickNextWithFallback(page: Page, steps: string[]): Promise<boolean> {
  const sel = aid("pageFooterNextButton");
  const loc = page.locator(sel).first();
  if (!(await loc.isVisible({ timeout: 3000 }).catch(() => false))) return false;
  try {
    await loc.click({ timeout: FIELD_TIMEOUT_MS });
  } catch {
    steps.push("workday-wizard: Next normal-click timed out — force click");
    await loc.click({ force: true, timeout: FIELD_TIMEOUT_MS }).catch(() => {});
  }
  await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS }).catch(() => {});
  await page.waitForTimeout(2500);
  return true;
}

// ---------------------------------------------------------------------------
// Step fillers
// ---------------------------------------------------------------------------

async function fillMyInformation(page: Page, applicant: ApplicantData, steps: string[]): Promise<void> {
  await selectMultiselect(page, "formField-source");  // "How Did You Hear About Us?" — picks first reasonable option
  await selectFormFieldDropdown(page, "formField-country", "United States of America");
  if (applicant.firstName) await typeIntoFormField(page, "formField-legalName--firstName", applicant.firstName);
  if (applicant.lastName) await typeIntoFormField(page, "formField-legalName--lastName", applicant.lastName);
  await typeIntoFormField(page, "formField-addressLine1", applicant.city || "1 Apply Lane");
  if (applicant.city) await typeIntoFormField(page, "formField-city", applicant.city);
  if (applicant.usState) await selectFormFieldDropdown(page, "formField-countryRegion", applicant.usState);
  await typeIntoFormField(page, "formField-postalCode", "80202"); // TODO: applicant.postalCode when added
  await selectFormFieldDropdown(page, "formField-phoneType", "Mobile");
  await selectFormFieldDropdown(page, "formField-countryPhoneCode", "United States of America");
  if (applicant.phone) await typeIntoFormField(page, "formField-phoneNumber", applicant.phone.replace(/\D/g, ""));
  await page.locator("h1").first().click({ force: true, timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(800);
  steps.push("workday-wizard: filled step 1 (My Information)");
}

async function fillMyExperience(page: Page, applicant: ApplicantData, resumePath: string, steps: string[]): Promise<void> {
  // Resume upload — Workday auto-extracts work history + education.
  const fileSelectors = [
    'input[type="file"][data-automation-id*="resume" i]',
    'input[type="file"][data-automation-id*="upload" i]',
    'input[type="file"]',
  ];
  for (const sel of fileSelectors) {
    const el = page.locator(sel).first();
    try {
      await el.setInputFiles(resumePath, { timeout: FIELD_TIMEOUT_MS });
      steps.push(`workday-wizard: uploaded resume via ${sel}`);
      await page.waitForTimeout(4000);
      break;
    } catch {
      // try next
    }
  }
  // LinkedIn URL is at the bottom of the page, plain text input.
  if (applicant.linkedinUrl) {
    const linkedinInput = page.locator(`label:has-text("LinkedIn") + input, [aria-label*="LinkedIn" i]`).first();
    if (await linkedinInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await linkedinInput.click().catch(() => {});
      await linkedinInput.pressSequentially(applicant.linkedinUrl, { delay: 30 }).catch(() => {});
    }
  }
  steps.push("workday-wizard: filled step 2 (My Experience)");
}

interface FieldRef {
  aid: string;
  text: string;
}

async function fillApplicationQuestions(page: Page, steps: string[]): Promise<void> {
  const fields: FieldRef[] = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
      var r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && el.querySelector('button[aria-haspopup], select, [data-automation-id="multiSelectContainer"]');
    }).map(function(el){
      return { aid: el.getAttribute('data-automation-id') || '', text: (el.innerText || el.textContent || '').trim().slice(0, 200) };
    });
  })()`)) as FieldRef[];

  for (const ff of fields) {
    const preferText = answerForApplicationQuestion(ff.text);
    const isMultiselect = (await page.locator(`[data-automation-id="${ff.aid}"] [data-automation-id="multiSelectContainer"]`).count()) > 0;
    if (isMultiselect) {
      await selectMultiselect(page, ff.aid, preferText || undefined);
      continue;
    }
    const trigger = page.locator(`[data-automation-id="${ff.aid}"] button[aria-haspopup]`).first();
    if (!(await trigger.isVisible({ timeout: 1500 }).catch(() => false))) continue;
    await trigger.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
    const opts = await listOptions(page);
    if (opts.length === 0) {
      await page.keyboard.press("Escape").catch(() => {});
      continue;
    }
    let pick = preferText
      ? opts.find((o) => new RegExp(escape(preferText), "i").test(o))
      : undefined;
    pick = pick || opts.find((o) => o && !/select one/i.test(o)) || opts[0];
    const opt = page.locator(`[role="option"]:not([data-automation-id="selectedItem"])`).filter({ hasText: pick }).first();
    if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) {
      await opt.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(200);
  }
  steps.push(`workday-wizard: filled step 3 (Application Questions, ${fields.length} fields)`);
}

/**
 * Heuristic answer policy for Walmart's tenant-specific Application Questions.
 * Matches on question text. Verified against the live form Apr 25, 2026 — these
 * answers cleared validation and advanced the wizard.
 */
function answerForApplicationQuestion(question: string): string {
  const q = question.toLowerCase();
  if (/sponsorship|visa|h-?1b/.test(q)) return "No";
  if (/family member|spouse.*partner|partner.*spouse|relative.*walmart|walmart.*relative/.test(q)) return "No";
  if (/uniformed services|military.*spouse/.test(q)) return "No";
  if (/qualifications|legally able|authorized.*work|provide work auth|able to provide/.test(q)) return "Yes";
  if (/walmart associate|sam.s club|affiliation/.test(q)) return "Have never been";
  if (/age category|age range/.test(q)) return "18 years";
  if (/mobile text|sms|text message/.test(q)) return "Opt-Out";
  if (/certify|certif/.test(q)) return "Yes";
  if (/eligibility|industry/.test(q)) return "No";
  return "";
}

async function fillVoluntaryDisclosures(page: Page, steps: string[]): Promise<void> {
  // T&C checkbox is the only required field on this step.
  const tcCheckbox = page.locator(`input[type="checkbox"]`).first();
  if (await tcCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    await tcCheckbox.check({ timeout: 2000 }).catch(() => {});
  }
  steps.push("workday-wizard: filled step 4 (Voluntary Disclosures, T&C checked)");
}

// ---------------------------------------------------------------------------
// Wizard driver
// ---------------------------------------------------------------------------

export async function runWalmartWizard(args: WizardArgs): Promise<ApplyResult> {
  const { page, applicant, resumePath, steps, deadlineMs } = args;

  for (let iter = 0; iter < MAX_WIZARD_ITERATIONS; iter++) {
    if (deadlineMs() <= 0) return { success: false, error: "workday-wizard-budget-exhausted", steps };

    const step = await detectStep(page);
    steps.push(`workday-wizard: at step ${step.current}/${step.total} url=${page.url()}`);

    if (step.current === -1) {
      return { success: false, error: "workday-wizard-progress-bar-not-found", steps };
    }

    // Auth gate detection: step 1/6 means we're still on Sign In.
    if (step.current === 1 && step.total === 6) {
      return { success: false, error: "workday-wizard-auth-incomplete", steps };
    }

    // Final step → Review. Submit unless DRY_RUN.
    if (step.current === step.total) {
      if (process.env.DRY_RUN === "true") {
        steps.push("workday-wizard: reached Review (DRY_RUN — submit SKIPPED)");
        return { success: true, steps };
      }
      steps.push("workday-wizard: reached Review — submitting");
      await clickNextWithFallback(page, steps);
      await page.waitForTimeout(5000);
      // Walmart redirects to /jobTasks/completed/application + the body shows
      // "Application Submitted ✓" on a successful submission.
      const url = page.url();
      const bodyText = ((await page.evaluate(`document.body.innerText`).catch(() => "")) as string).slice(0, 1000);
      const success =
        /\/(completed|confirmation)\/application/i.test(url) ||
        /application submitted|thank you|application received/i.test(bodyText);
      if (success) {
        steps.push("workday-wizard: ✓ submission confirmed");
        return { success: true, steps };
      }
      steps.push(`workday-wizard: post-submit url=${url} bodyExcerpt="${bodyText.slice(0, 200)}"`);
      return { success: false, error: "workday-wizard-submit-no-confirmation", steps };
    }

    // Per-step fillers.
    if (step.current === 1) await fillMyInformation(page, applicant, steps);
    else if (step.current === 2) await fillMyExperience(page, applicant, resumePath, steps);
    else if (step.current === 3) await fillApplicationQuestions(page, steps);
    else if (step.current === 4) await fillVoluntaryDisclosures(page, steps);
    else steps.push(`workday-wizard: no filler for step ${step.current}, attempting Next`);

    const advanced = await clickNextWithFallback(page, steps);
    if (!advanced) {
      return { success: false, error: `workday-wizard-stuck-step-${step.current}`, steps };
    }
  }

  return { success: false, error: "workday-wizard-iteration-cap-hit", steps };
}
