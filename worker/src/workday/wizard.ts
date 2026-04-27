/**
 * Cross-tenant Workday wizard driver. Drives the multi-step apply form
 * page-by-page using stable `data-automation-id` selectors.
 *
 * Typical wizard (post-signup, 5 steps):
 *   1. My Information       — legalName, address, phone, "How Did You Hear" multiselect
 *   2. My Experience        — resume upload + LinkedIn (most fields optional)
 *   3. Application Questions — tenant-specific Y/N + select fields
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
import { answerForQuestion, type WorkdayTenant } from "./tenants.js";

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

async function clearAndType(page: Page, loc: Locator, value: string): Promise<void> {
  await loc.click().catch(() => {});
  await loc.fill(value).catch(async () => {
    await loc.press("Control+a").catch(() => {});
    await loc.press("Backspace").catch(() => {});
    await page.waitForTimeout(100);
    await loc.pressSequentially(value, { delay: 80 });
  });
  await page.waitForTimeout(200);
  const got = await loc.inputValue().catch(() => "");
  if (got.trim() !== value.trim()) {
    await loc.evaluate((el: HTMLInputElement, v: string) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      if (nativeSetter) nativeSetter.call(el, v);
      const tracker = (el as any)._valueTracker;
      if (tracker) tracker.setValue("");
      el.dispatchEvent(new Event("focus", { bubbles: true }));
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: v }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
    }, value).catch(() => {});
  }
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

type StepType = "my-information" | "my-experience" | "application-questions" | "voluntary-disclosures" | "self-identify" | "unknown";

// Workday wizard steps are consistently ordered across tenants. 5-step
// wizards: MI, ME, AQ, VD, Review. 6-step add "Self Identify" before Review.
// 7-step add a second VD/consent page. Review = `current === total`.
const STEP_MAP_5: Record<number, StepType> = {
  1: "my-information",
  2: "my-experience",
  3: "application-questions",
  4: "voluntary-disclosures",
};
const STEP_MAP_6: Record<number, StepType> = {
  1: "my-information",
  2: "my-experience",
  3: "application-questions",
  4: "voluntary-disclosures",
  5: "self-identify",
};
const STEP_MAP_7: Record<number, StepType> = {
  1: "my-information",
  2: "my-experience",
  3: "application-questions",
  4: "voluntary-disclosures",
  5: "self-identify",
  6: "voluntary-disclosures",
};

async function detectStepType(page: Page, stepNumber: number, totalSteps: number): Promise<StepType> {
  const map = totalSteps >= 7 ? STEP_MAP_7 : totalSteps >= 6 ? STEP_MAP_6 : STEP_MAP_5;
  const mapped = map[stepNumber];
  if (mapped) return mapped;

  // Fallback for unexpected step numbers: detect by unique form elements.
  const signals = (await page.evaluate(`(function(){
    var hasLegalName = !!document.querySelector('[data-automation-id*="legalName"]');
    var hasCountry = !!document.querySelector('[data-automation-id="formField-country"]');
    var hasAddress = !!document.querySelector('[data-automation-id*="addressLine"]');
    var hasFileUpload = !!document.querySelector('input[type="file"]');
    var dropdowns = document.querySelectorAll('[data-automation-id^="formField-"] button[aria-haspopup]');
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');
    return {
      hasLegalName: hasLegalName,
      hasCountry: hasCountry,
      hasAddress: hasAddress,
      hasFileUpload: hasFileUpload,
      dropdownCount: dropdowns.length,
      checkboxCount: checkboxes.length,
    };
  })()`)) as {
    hasLegalName: boolean; hasCountry: boolean; hasAddress: boolean;
    hasFileUpload: boolean; dropdownCount: number; checkboxCount: number;
  };

  if (signals.hasLegalName || (signals.hasAddress && signals.hasCountry)) return "my-information";
  if (signals.hasFileUpload) return "my-experience";
  if (signals.dropdownCount >= 3) return "application-questions";
  if (signals.checkboxCount > 0 && signals.dropdownCount <= 2) return "voluntary-disclosures";
  if (signals.dropdownCount >= 2) return "application-questions";
  return "unknown";
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
  await page.waitForTimeout(600);

  // Hierarchical drill-down: if sub-options appeared, pick the first one.
  const subOpts = await listOptions(page);
  if (subOpts.length > 0) {
    const subPick = subOpts.find(o => o && !/^other$/i.test(o)) || subOpts[0];
    const subOpt = page.locator('[role="option"]:not([data-automation-id="selectedItem"])').filter({ hasText: subPick }).first();
    if (await subOpt.isVisible({ timeout: 1500 }).catch(() => false)) {
      await subOpt.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
  }

  for (const okSel of ['button:has-text("OK")', 'button:has-text("Done")', '[data-automation-id="promptDone"]']) {
    const okBtn = page.locator(okSel).first();
    if (await okBtn.isVisible({ timeout: 400 }).catch(() => false)) {
      await okBtn.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(300);
      break;
    }
  }

  await page.keyboard.press("Escape").catch(() => {});
  await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(300);

  const sfd_selected = await page.locator(`[data-automation-id="${formFieldAid}"] [data-automation-id="selectedItem"]`).count().catch(() => 0);
  const sfd_inputVal = await page.locator(`[data-automation-id="${formFieldAid}"] input`).first().inputValue().catch(() => "");
  return sfd_selected > 0 || sfd_inputVal.trim().length > 0;
}

async function selectFirstDropdownOption(page: Page, formFieldAid: string): Promise<boolean> {
  let trigger = page.locator(`[data-automation-id="${formFieldAid}"] button[aria-haspopup]`).first();
  if (!(await trigger.isVisible({ timeout: 1500 }).catch(() => false))) {
    trigger = page.locator(`[data-automation-id="${formFieldAid}"] button`).first();
    if (!(await trigger.isVisible({ timeout: 1000 }).catch(() => false))) return false;
  }
  const preBtnText = (await trigger.textContent().catch(() => "")).trim();
  const preSelectedCount = await page.locator(`[data-automation-id="${formFieldAid}"] [data-automation-id="selectedItem"]`).count().catch(() => 0);
  await trigger.click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(600);
  const opts = await listOptions(page);
  if (opts.length === 0) { await page.keyboard.press("Escape").catch(() => {}); return false; }
  const pick = opts.find(o => o && !/select|other/i.test(o)) || opts[0];
  const opt = page.locator('[role="option"]:not([data-automation-id="selectedItem"])').filter({ hasText: pick }).first();
  if (!(await opt.isVisible({ timeout: 1500 }).catch(() => false))) {
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }
  await opt.click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(600);

  // Hierarchical: if sub-options appeared, pick first non-Other.
  const fdSubOpts = await listOptions(page);
  if (fdSubOpts.length > 0 && !fdSubOpts.includes(pick)) {
    const subPick = fdSubOpts.find(o => o && !/^other$/i.test(o)) || fdSubOpts[0];
    const subOpt = page.locator('[role="option"]:not([data-automation-id="selectedItem"])').filter({ hasText: subPick }).first();
    if (await subOpt.isVisible({ timeout: 1500 }).catch(() => false)) {
      await subOpt.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
  }

  for (const okSel of ['button:has-text("OK")', 'button:has-text("Done")', '[data-automation-id="promptDone"]']) {
    const okBtn = page.locator(okSel).first();
    if (await okBtn.isVisible({ timeout: 400 }).catch(() => false)) {
      await okBtn.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(300);
      break;
    }
  }

  await page.keyboard.press("Escape").catch(() => {});
  await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(300);

  // Check selectedItem (multiselects) or button text change (regular dropdowns)
  const fdSelected = await page.locator(`[data-automation-id="${formFieldAid}"] [data-automation-id="selectedItem"]`).count().catch(() => 0);
  if (fdSelected > preSelectedCount) return true;
  const postBtnText = (await trigger.textContent().catch(() => "")).trim();
  if (postBtnText !== preBtnText && postBtnText.length > 0) return true;
  return false;
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
    || options.find((o) => o && !/^other$|referral|employee refer/i.test(o))
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
  // Confirm: click any OK/Done button in the popup before dismissing.
  for (const okSel of ['button:has-text("OK")', 'button:has-text("Done")', '[data-automation-id="promptDone"]', 'button:has-text("✓")']) {
    const okBtn = page.locator(okSel).first();
    if (await okBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await okBtn.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(300);
      break;
    }
  }

  await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(300);

  const selected = await page.locator(`[data-automation-id="${formFieldAid}"] [data-automation-id="selectedItem"]`).count().catch(() => 0);
  return selected > 0;
}

async function fillSearchableDropdown(page: Page, formFieldAid: string, searchTexts: string | string[], steps: string[]): Promise<boolean> {
  const fieldContainer = page.locator(`[data-automation-id="${formFieldAid}"]`).first();
  const input = fieldContainer.locator("input").first();
  if (!(await input.isVisible({ timeout: 1500 }).catch(() => false))) return false;
  const existing = await input.inputValue().catch(() => "");
  if (existing.trim()) return true;
  const hasSelected = await fieldContainer.locator('[data-automation-id="selectedItem"]').count().catch(() => 0);
  if (hasSelected > 0) return true;

  const primaryTexts = Array.isArray(searchTexts) ? searchTexts : [searchTexts];
  const searchTerms: string[] = [];
  const seen = new Set<string>();
  for (const text of primaryTexts) {
    for (const t of [text, text.split(" ").slice(0, 2).join(" "), text.split(" ")[0]]) {
      const lower = t.toLowerCase();
      if (!seen.has(lower) && t.length > 0) { seen.add(lower); searchTerms.push(t); }
    }
  }

  async function checkSelected(): Promise<boolean> {
    const sel = await fieldContainer.locator('[data-automation-id="selectedItem"]').count().catch(() => 0);
    return sel > 0;
  }

  async function clickOkDone(): Promise<void> {
    for (const okSel of ['button:has-text("OK")', 'button:has-text("Done")', '[data-automation-id="promptDone"]']) {
      const okBtn = page.locator(okSel).first();
      if (await okBtn.isVisible({ timeout: 800 }).catch(() => false)) {
        await okBtn.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(500);
        break;
      }
    }
  }

  // Strategy 1: Click promptIcon FIRST (before typing, which destroys it).
  // BofA-style multiselects: promptIcon opens a search dialog; typing in the
  // inline input enters "search mode" and hides the promptIcon permanently.
  const promptIcon = fieldContainer.locator('[data-automation-id="promptIcon"]').first();
  if (await promptIcon.isVisible({ timeout: 1500 }).catch(() => false)) {
    await promptIcon.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(2000);
    // Dump field state after clicking promptIcon
    const postClickDump = await page.evaluate((aid) => {
      const field = document.querySelector(`[data-automation-id="${aid}"]`);
      if (!field) return "FIELD_NOT_FOUND";
      const aids = Array.from(field.querySelectorAll("[data-automation-id]")).slice(0, 25).map(d => d.getAttribute("data-automation-id"));
      const btns = Array.from(field.querySelectorAll("button, [role='button']")).map(b => {
        const txt = (b.textContent || "").trim().slice(0, 30);
        const aid2 = (b as Element).getAttribute("data-automation-id") || "";
        return `btn[${aid2}|${txt}]`;
      });
      const hasDialog = !!document.querySelector('[role="dialog"]');
      const lbCount = document.querySelectorAll('[role="listbox"]').length;
      return `aids=[${aids.join(",")}] btns=[${btns.join(",")}] dialog=${hasDialog} lbs=${lbCount}`;
    }, formFieldAid).catch(() => "eval-error");
    steps.push(`workday-wizard: post-promptIcon ${formFieldAid}: ${postClickDump}`);

    // Check if clicking promptIcon opened a pre-loaded list (before typing anything).
    const preloadOpts = await page.evaluate(() => {
      const lbs = Array.from(document.querySelectorAll('[role="listbox"]'));
      if (lbs.length === 0) return { count: 0, sample: [] as string[] };
      const lastLb = lbs[lbs.length - 1];
      const opts = Array.from(lastLb.querySelectorAll('[role="option"]'))
        .map(o => (o.textContent || "").trim())
        .filter(t => t && !/^(no items|partial list.*|all)\.?$/i.test(t));
      return { count: opts.length, sample: opts.slice(0, 5) };
    }).catch(() => ({ count: 0, sample: [] as string[] }));
    steps.push(`workday-wizard: promptIcon preload ${formFieldAid}: ${preloadOpts.count} opts [${preloadOpts.sample.join("|")}]`);

    if (preloadOpts.count > 0) {
      // Browse preloaded list for a matching option
      const targetLower = primaryTexts[0].toLowerCase();
      const matchIdx = preloadOpts.sample.findIndex(o => o.toLowerCase().includes(targetLower.split(" ")[0]));
      if (matchIdx >= 0) {
        for (let i = 0; i <= matchIdx; i++) await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(1500);
        await clickOkDone();
        await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(500);
        if (await checkSelected()) {
          steps.push(`workday-wizard: selected from ${formFieldAid} preloaded list`);
          return true;
        }
      }
    }

    for (const searchTerm of searchTerms) {

      // After clicking promptIcon, the field enters search mode with a searchBox input.
      // Find the search input (may be the same input, now with data-automation-id="searchBox").
      const searchInput = fieldContainer.locator('[data-automation-id="searchBox"], input').first();
      if (await searchInput.isVisible({ timeout: 1500 }).catch(() => false)) {
        await searchInput.fill("").catch(() => {});
        await searchInput.pressSequentially(searchTerm, { delay: 60 });
        await page.waitForTimeout(2000);
        // Some fields need Enter to trigger search
        await page.keyboard.press("Enter").catch(() => {});
        await page.waitForTimeout(2000);

        // Check for options in the LAST listbox (most recently opened = ours).
        // Avoid picking up options from other fields' listboxes (e.g., skills).
        const opts = await page.evaluate(() => {
          const lbs = Array.from(document.querySelectorAll('[role="listbox"]'));
          if (lbs.length === 0) return [] as string[];
          const lastLb = lbs[lbs.length - 1];
          return Array.from(lastLb.querySelectorAll('[role="option"]'))
            .map(o => (o.textContent || "").trim())
            .filter(t => t && !/^(no items|partial list.*|all)\.?$/i.test(t));
        }).catch(() => [] as string[]);
        steps.push(`workday-wizard: prompt-search ${formFieldAid} "${searchTerm}": ${opts.length} opts [${opts.slice(0, 3).join("|")}]`);

        if (opts.length > 0) {
          // Select first valid option via keyboard
          await page.keyboard.press("ArrowDown");
          await page.waitForTimeout(200);
          await page.keyboard.press("Enter");
          await page.waitForTimeout(1500);
          await clickOkDone();
          await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
          await page.waitForTimeout(500);
          if (await checkSelected()) {
            steps.push(`workday-wizard: selected from ${formFieldAid} via promptIcon "${searchTerm}"`);
            return true;
          }
        }
      }

      // Also check if a dialog opened (some tenants use a full dialog)
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible({ timeout: 500 }).catch(() => false)) {
        const dialogInput = dialog.locator('input[type="text"]').first();
        if (await dialogInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await dialogInput.fill("").catch(() => {});
          await dialogInput.pressSequentially(searchTerm, { delay: 60 });
          await page.waitForTimeout(3000);
          const dialogOpts = dialog.locator('[role="option"], [role="row"], [data-automation-id="promptOption"]').filter({
            hasNotText: /^(no items|partial list|all)\.?$/i
          });
          const optCount = await dialogOpts.count().catch(() => 0);
          steps.push(`workday-wizard: prompt-dialog ${formFieldAid} "${searchTerm}": ${optCount} options`);
          if (optCount > 0) {
            await dialogOpts.first().click({ timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(1000);
            await clickOkDone();
            if (await checkSelected()) {
              steps.push(`workday-wizard: selected from ${formFieldAid} via dialog "${searchTerm}"`);
              return true;
            }
          }
        }
      }

      // Clear search for next term (stay in search mode)
      const clearBtn = fieldContainer.locator('[data-automation-id="clearSearchButton"]').first();
      if (await clearBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await clearBtn.click({ timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(500);
      } else {
        // No clear button — select all and delete
        const activeInput = fieldContainer.locator('[data-automation-id="searchBox"], input').first();
        await activeInput.fill("").catch(() => {});
        await page.waitForTimeout(300);
      }
    }
    // Exit search mode after exhausting all terms
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(500);
  }

  // Strategy 2: Inline search (type in the input, pick from autocomplete).
  const inlineInput = fieldContainer.locator("input").first();
  for (const text of searchTerms) {
    await inlineInput.click().catch(() => {});
    await inlineInput.fill("").catch(() => {});
    await inlineInput.pressSequentially(text, { delay: 60 });
    await page.waitForTimeout(3500);

    const scopedOpts = await page.evaluate(() => {
      const lbs = Array.from(document.querySelectorAll('[role="listbox"]'));
      if (lbs.length === 0) return [] as string[];
      const lastLb = lbs[lbs.length - 1];
      return Array.from(lastLb.querySelectorAll('[role="option"]'))
        .map(o => (o.textContent || "").trim())
        .filter(t => t && !/^(no items|partial list.*|all)\.?$/i.test(t));
    }).catch(() => [] as string[]);

    if (scopedOpts.length > 0) {
      steps.push(`workday-wizard: inline-search ${formFieldAid} "${text}": ${scopedOpts.length} opts`);
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(200);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1500);
      await clickOkDone();
      await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(500);
      if (await checkSelected()) {
        steps.push(`workday-wizard: selected from ${formFieldAid} inline "${text}"`);
        return true;
      }
    }

    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(300);
  }

  // Clear any typed text so the next caller with different terms can try fresh
  await inlineInput.click().catch(() => {});
  await inlineInput.fill("").catch(() => {});
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(300);
  steps.push(`workday-wizard: ${formFieldAid} searchable dropdown failed for "${searchTerms[0]}"`);
  return false;
}

async function selectDropdownViaKeyboard(page: Page, formFieldAid: string, preferText?: string): Promise<boolean> {
  const trigger = page.locator(`[data-automation-id="${formFieldAid}"] button[aria-haspopup]`).first();
  if (!(await trigger.isVisible({ timeout: 1500 }).catch(() => false))) return false;
  const preBtnText = (await trigger.textContent().catch(() => "")).trim();
  const preSelectedCount = await page.locator(`[data-automation-id="${formFieldAid}"] [data-automation-id="selectedItem"]`).count().catch(() => 0);
  await trigger.focus().catch(() => {});
  await trigger.press("Enter").catch(() => trigger.press("Space").catch(() => {}));
  await page.waitForTimeout(600);
  const opts = await listOptions(page);
  if (opts.length === 0) { await page.keyboard.press("Escape").catch(() => {}); return false; }

  if (preferText) {
    const idx = opts.findIndex(o => new RegExp(escape(preferText), "i").test(o));
    if (idx >= 0) {
      for (let i = 0; i <= idx; i++) await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
    } else {
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
    }
  } else {
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(500);
  await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(300);

  const selected = await page.locator(`[data-automation-id="${formFieldAid}"] [data-automation-id="selectedItem"]`).count().catch(() => 0);
  if (selected > preSelectedCount) return true;
  // For regular dropdowns (non-multiselect), check if button text actually changed
  const postBtnText = (await trigger.textContent().catch(() => "")).trim();
  if (postBtnText !== preBtnText && postBtnText.length > 0 && !/select|choose|--/i.test(postBtnText)) return true;
  return false;
}

async function dumpPageFields(page: Page): Promise<string> {
  return (await page.evaluate(`(function(){
    var fields = Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
      var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
    }).map(function(el){
      var aid = el.getAttribute('data-automation-id') || '';
      var label = (el.innerText || el.textContent || '').trim().split('\\n')[0].slice(0, 60);
      var inputs = el.querySelectorAll('input, select, textarea, button[aria-haspopup], [data-automation-id="multiSelectContainer"]');
      var filled = Array.from(inputs).some(function(i){ return i.value && i.value.trim(); });
      var hasDropdown = !!el.querySelector('button[aria-haspopup], [data-automation-id="multiSelectContainer"], [data-automation-id="promptIcon"]');
      var hasSelected = !!el.querySelector('[data-automation-id="selectedItem"]');
      var state = filled ? 'filled' : hasSelected ? 'selected' : hasDropdown ? 'dropdown-empty' : 'empty';
      return aid + ' [' + state + '] "' + label + '"';
    });
    var errors = Array.from(document.querySelectorAll('[data-automation-id*="error"], [role="alert"]')).map(function(e){
      return 'ERR: ' + (e.innerText || e.textContent || '').trim().slice(0, 100);
    }).filter(Boolean);
    return fields.concat(errors).join(' | ');
  })()`).catch(() => "dump-failed")) as string;
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
  // Scroll to bottom so footer buttons are in viewport.
  await page.evaluate("window.scrollTo(0, document.body.scrollHeight)").catch(() => {});
  await page.waitForTimeout(500);

  const sels = [
    aid("pageFooterNextButton"),
    aid("bottom-navigation-next-button"),
    'button:has-text("Save and Continue")',
    'button:has-text("Next")',
    'button:has-text("Continue")',
  ];
  for (const sel of sels) {
    const loc = page.locator(sel).first();
    if (!(await loc.isVisible({ timeout: 2000 }).catch(() => false))) continue;
    try {
      await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
      await loc.click({ timeout: FIELD_TIMEOUT_MS });
    } catch {
      steps.push("workday-wizard: Next normal-click timed out — force click");
      await loc.click({ force: true, timeout: FIELD_TIMEOUT_MS }).catch(() => {});
    }
    await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS }).catch(() => {});
    await page.waitForTimeout(2500);
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Step fillers
// ---------------------------------------------------------------------------

async function fillWorkdayDate(page: Page, fieldSuffix: string, steps: string[]): Promise<void> {
  const month = fieldSuffix === "endDate" ? "12" : "01";
  const year = fieldSuffix === "endDate" ? "2025" : "2024";

  const container = page.locator(`[data-automation-id="formField-${fieldSuffix}"]`).first();
  if (!(await container.isVisible({ timeout: 1500 }).catch(() => false))) return;

  // Variant A: <select> for month + text <input> for year
  const sel = container.locator("select").first();
  if (await sel.isVisible({ timeout: 1000 }).catch(() => false)) {
    await sel.selectOption(month).catch(() =>
      sel.selectOption({ index: parseInt(month) }).catch(() => {}),
    );
  } else {
    // Variant B: Workday custom dropdown for month
    const monthBtn = container.locator('[data-automation-id="dateSectionMonth-input"], [data-automation-id*="month" i]').first();
    if (await monthBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await monthBtn.click().catch(() => {});
      await page.waitForTimeout(400);
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      const mName = monthNames[parseInt(month) - 1];
      const opt = page.locator('[role="option"]').filter({ hasText: mName }).first();
      if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) {
        await opt.click().catch(() => {});
      }
      await page.waitForTimeout(300);
    }
  }

  // Year input
  const yearInput = container.locator('[data-automation-id="dateSectionYear-input"], input[type="text"]').last();
  if (await yearInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    const yVal = await yearInput.inputValue().catch(() => "");
    if (!yVal) {
      await yearInput.click().catch(() => {});
      await yearInput.pressSequentially(year, { delay: 60 });
      await yearInput.press("Tab").catch(() => {});
    }
  }

  // Variant C: single date input (MM/YYYY)
  const inputs = await container.locator("input").all();
  if (inputs.length === 1) {
    const val = await inputs[0].inputValue().catch(() => "");
    if (!val) {
      await inputs[0].click().catch(() => {});
      await inputs[0].pressSequentially(`${month}/${year}`, { delay: 60 });
    }
  }
}

async function fillMyInformation(page: Page, applicant: ApplicantData, tenant: WorkdayTenant, steps: string[]): Promise<void> {
  // Fill country FIRST — some tenants (Visa) reveal "How Did You Hear" only
  // after country is set.
  await selectFormFieldDropdown(page, "formField-country", "United States of America");
  await page.waitForTimeout(800);

  // Wait for source field to appear (Visa reveals it after country selection).
  const sourceField = page.locator('[data-automation-id="formField-source"]').first();
  if (!(await sourceField.isVisible({ timeout: 500 }).catch(() => false))) {
    await page.waitForTimeout(2000);
  }

  // "How Did You Hear About Us?" multiselect — required by some tenants.
  // Try known automation IDs first, then discover any unfilled multiselect.
  const sourceAids = ["formField-source", "formField-sourcePrompt", "formField-sourceSection"];
  let sourceFilled = false;
  for (const sa of sourceAids) {
    if (await selectMultiselect(page, sa, "Internet")) { sourceFilled = true; break; }
  }
  // Fallback: try as a regular dropdown with preferred non-referral options.
  if (!sourceFilled) {
    for (const label of ["Internet", "Website", "Job Board", "Online"]) {
      sourceFilled = await selectFormFieldDropdown(page, "formField-source", label);
      if (sourceFilled) break;
    }
    if (!sourceFilled) sourceFilled = await selectFirstDropdownOption(page, "formField-source");
  }
  if (!sourceFilled) {
    // Discover all multiselect containers on the page and try each one
    // (except country phone code which is also a multiselect).
    const msFields = (await page.evaluate(`(function(){
      return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
        var r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return false;
        var ms = el.querySelector('[data-automation-id="multiSelectContainer"], [data-automation-id="promptIcon"]');
        return !!ms;
      }).map(function(el){
        return { aid: el.getAttribute('data-automation-id') || '', text: (el.innerText || el.textContent || '').trim().slice(0, 200) };
      });
    })()`)) as { aid: string; text: string }[];
    for (const msf of msFields) {
      if (msf.aid === "formField-countryPhoneCode") continue;
      if (/hear|source|referral|how did/i.test(msf.text)) {
        sourceFilled = await selectMultiselect(page, msf.aid);
        if (sourceFilled) break;
      }
    }
    // Last resort: try every multiselect that isn't phone code
    if (!sourceFilled) {
      for (const msf of msFields) {
        if (msf.aid === "formField-countryPhoneCode") continue;
        sourceFilled = await selectMultiselect(page, msf.aid);
        if (sourceFilled) break;
      }
    }
    // Some tenants use a regular dropdown (not multiselect) for this field.
    if (!sourceFilled) {
      const allDropdowns = (await page.evaluate(`(function(){
        return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
          var r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && el.querySelector('button[aria-haspopup]');
        }).map(function(el){
          return { aid: el.getAttribute('data-automation-id') || '', text: (el.innerText || el.textContent || '').trim().slice(0, 200) };
        });
      })()`)) as { aid: string; text: string }[];
      for (const dd of allDropdowns) {
        if (/hear|source|how did you/i.test(dd.text)) {
          sourceFilled = await selectFirstDropdownOption(page, dd.aid);
          if (!sourceFilled) sourceFilled = await selectMultiselect(page, dd.aid, "Internet");
          if (sourceFilled) break;
        }
      }
    }
  }
  // Keyboard-based fallback for source dropdown.
  if (!sourceFilled) {
    sourceFilled = await selectDropdownViaKeyboard(page, "formField-source", "Internet");
    if (!sourceFilled) sourceFilled = await selectDropdownViaKeyboard(page, "formField-source");
    if (sourceFilled) steps.push("workday-wizard: filled source via keyboard");
  }
  // Fallback for source: try native <select> element (some tenants use HTML select)
  if (!sourceFilled) {
    const nativeSelect = page.locator('[data-automation-id="formField-source"] select').first();
    if (await nativeSelect.isVisible({ timeout: 1500 }).catch(() => false)) {
      const optCount = await nativeSelect.locator("option").count().catch(() => 0);
      if (optCount > 1) {
        await nativeSelect.selectOption({ index: 1 }).catch(() => {});
        sourceFilled = true;
        steps.push("workday-wizard: filled source via native <select>");
      }
    }
  }
  // Last resort: try searchable dropdown pattern for source.
  if (!sourceFilled) {
    sourceFilled = await fillSearchableDropdown(page, "formField-source", "Internet", steps);
  }
  // Diag: dump source field state after all attempts
  if (!sourceFilled) {
    const srcDiag = await page.evaluate(`(function(){
      var el = document.querySelector('[data-automation-id="formField-source"]');
      if (!el) return 'formField-source NOT FOUND';
      var html = el.outerHTML.slice(0, 1200);
      var hasBtn = !!el.querySelector('button[aria-haspopup]');
      var hasPrompt = !!el.querySelector('[data-automation-id="promptIcon"]');
      var hasInput = !!el.querySelector('input');
      var hasMSC = !!el.querySelector('[data-automation-id="multiSelectContainer"]');
      var hasSelected = !!el.querySelector('[data-automation-id="selectedItem"]');
      var btnText = el.querySelector('button') ? el.querySelector('button').textContent.trim().slice(0, 80) : 'NO_BTN';
      return 'hasBtn=' + hasBtn + ' hasPrompt=' + hasPrompt + ' hasInput=' + hasInput + ' hasMSC=' + hasMSC + ' hasSelected=' + hasSelected + ' btnText=' + btnText + ' html=' + html;
    })()`).catch(() => "diag-failed");
    steps.push("workday-wizard: source-diag: " + (srcDiag as string).slice(0, 600));
  }

  // Some tenants have Y/N radio buttons on My Information (e.g., Adobe's
  // "Have you been employed by X in the past?"). Click "No" on all of them.
  const radioGroups = await page.locator('[data-automation-id^="formField-"] input[type="radio"]').all();
  if (radioGroups.length > 0) {
    const noLabels = await page.locator('label:has-text("No")').all();
    for (const label of noLabels) {
      if (await label.isVisible({ timeout: 1000 }).catch(() => false)) {
        await label.click({ timeout: 2000 }).catch(() => {});
      }
    }
  }

  // Name fields: some tenants use legalName--firstName, others use firstName directly.
  if (applicant.firstName) {
    const nameFilled = await typeIntoFormField(page, "formField-legalName--firstName", applicant.firstName);
    if (!nameFilled) await typeIntoFormField(page, "formField-firstName", applicant.firstName);
  }
  if (applicant.lastName) {
    const nameFilled = await typeIntoFormField(page, "formField-legalName--lastName", applicant.lastName);
    if (!nameFilled) await typeIntoFormField(page, "formField-lastName", applicant.lastName);
  }
  await typeIntoFormField(page, "formField-addressLine1", applicant.city || "1 Apply Lane");
  await typeIntoFormField(page, "formField-addressLine2", "Apt 1");
  if (applicant.city) await typeIntoFormField(page, "formField-city", applicant.city);
  if (applicant.usState) await selectFormFieldDropdown(page, "formField-countryRegion", applicant.usState);
  await typeIntoFormField(page, "formField-postalCode", "80202");

  // Email field: some tenants use formField-emailAddress (Adobe), others
  // don't have email on My Information (email was captured at signup).
  const emailFilled = await typeIntoFormField(page, "formField-emailAddress",
    applicant.email || "");
  if (!emailFilled) {
    await typeIntoFormField(page, "formField-email", applicant.email || "");
  }

  const phoneLabels = ["Mobile", "Cell", "Cellular", "Home"];
  let phoneTypeFilled = false;
  for (const pl of phoneLabels) {
    phoneTypeFilled = await selectFormFieldDropdown(page, "formField-phoneType", pl);
    if (phoneTypeFilled) break;
    phoneTypeFilled = await selectFormFieldDropdown(page, "formField-phoneDeviceType", pl);
    if (phoneTypeFilled) break;
  }
  if (!phoneTypeFilled) {
    phoneTypeFilled = await selectFirstDropdownOption(page, "formField-phoneType");
    if (!phoneTypeFilled) phoneTypeFilled = await selectFirstDropdownOption(page, "formField-phoneDeviceType");
  }
  if (!phoneTypeFilled) {
    phoneTypeFilled = await selectDropdownViaKeyboard(page, "formField-phoneType", "Mobile");
    if (!phoneTypeFilled) phoneTypeFilled = await selectDropdownViaKeyboard(page, "formField-phoneDeviceType", "Mobile");
    if (phoneTypeFilled) steps.push("workday-wizard: filled phone type via keyboard");
  }
  if (!phoneTypeFilled) {
    // Broad discovery: find any formField with "phone" + "type" or "device" in
    // its label, checking ALL interactive elements (dropdown, select, multiselect).
    const phoneFields = (await page.evaluate(`(function(){
      return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
        var r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return false;
        var hasInteractive = el.querySelector('button[aria-haspopup], select, [data-automation-id="multiSelectContainer"], [data-automation-id="promptIcon"], [role="listbox"], [role="combobox"]');
        if (!hasInteractive) return false;
        var text = (el.innerText || el.textContent || '').toLowerCase();
        return /phone.*type|device.*type|phone.*device/i.test(text);
      }).map(function(el){
        var aid = el.getAttribute('data-automation-id') || '';
        var hasSelect = !!el.querySelector('select');
        return { aid: aid, hasSelect: hasSelect };
      });
    })()`)) as { aid: string; hasSelect: boolean }[];
    for (const pf of phoneFields) {
      if (pf.hasSelect) {
        const sel = page.locator(`[data-automation-id="${pf.aid}"] select`).first();
        if (await sel.isVisible({ timeout: 1500 }).catch(() => false)) {
          await sel.selectOption({ label: "Mobile" }).catch(() =>
            sel.selectOption({ index: 1 }).catch(() => {}));
          phoneTypeFilled = true;
          steps.push(`workday-wizard: selected phone type via <select> in ${pf.aid}`);
          break;
        }
      }
      phoneTypeFilled = await selectFormFieldDropdown(page, pf.aid, "Mobile");
      if (phoneTypeFilled) break;
    }
  }
  if (!phoneTypeFilled) {
    // Last resort: find ALL unfilled dropdowns on the page, check if any have
    // no selected value and are near phone-related fields.
    const allUnfilled = (await page.evaluate(`(function(){
      return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
        var r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return false;
        var btn = el.querySelector('button[aria-haspopup]');
        if (!btn) return false;
        var selected = el.querySelector('[data-automation-id="selectedItem"]');
        if (selected) return false;
        var aid = (el.getAttribute('data-automation-id') || '').toLowerCase();
        if (/country|countryregion|countryphone|source/i.test(aid)) return false;
        return true;
      }).map(function(el){
        return { aid: el.getAttribute('data-automation-id') || '', text: (el.innerText || el.textContent || '').trim().slice(0, 80) };
      });
    })()`)) as { aid: string; text: string }[];
    for (const uf of allUnfilled) {
      phoneTypeFilled = await selectFormFieldDropdown(page, uf.aid, "Mobile");
      if (!phoneTypeFilled) phoneTypeFilled = await selectDropdownViaKeyboard(page, uf.aid, "Mobile");
      if (phoneTypeFilled) {
        steps.push(`workday-wizard: filled unfilled dropdown ${uf.aid} ("${uf.text}") with Mobile`);
        break;
      }
    }
  }
  await selectFormFieldDropdown(page, "formField-countryPhoneCode", "United States of America");
  if (applicant.phone) await typeIntoFormField(page, "formField-phoneNumber", applicant.phone.replace(/\D/g, ""));

  // Fill any remaining required empty text inputs (e.g., referral name/email
  // sub-fields that appear after "How Did You Hear" selection).
  const remainingInputs = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"] input[type="text"], [data-automation-id^="formField-"] input:not([type])')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      if (el.type === 'file' || el.type === 'hidden') return false;
      if (el.value && el.value.trim()) return false;
      var ff = el.closest('[data-automation-id^="formField-"]');
      if (!ff) return false;
      var label = (ff.innerText || ff.textContent || '').trim().toLowerCase();
      if (/first name|last name|address|city|postal|zip|phone number|email/i.test(label)) return false;
      return true;
    }).map(function(el){
      var ff = el.closest('[data-automation-id^="formField-"]');
      return { aid: ff.getAttribute('data-automation-id') || '', label: (ff.innerText || ff.textContent || '').trim().split('\\n')[0].slice(0, 100) };
    });
  })()`)) as { aid: string; label: string }[];
  for (const ri of remainingInputs) {
    const label = ri.label.toLowerCase();
    let value = "N/A";
    if (/name|email|refer/i.test(label)) value = "Job Board";
    const input = page.locator(`[data-automation-id="${ri.aid}"] input`).first();
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.click().catch(() => {});
      await input.pressSequentially(value, { delay: 60 });
    }
  }

  // Catch-all: fill any remaining unfilled required dropdowns on My Information.
  const myInfoUnfilledDropdowns = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      var btn = el.querySelector('button[aria-haspopup], [data-automation-id="promptIcon"]');
      if (!btn) return false;
      var selected = el.querySelector('[data-automation-id="selectedItem"]');
      if (selected) return false;
      var aid = (el.getAttribute('data-automation-id') || '');
      if (/country|countryregion|countryphone|phoneType|phoneDeviceType|legalName/i.test(aid)) return false;
      var filled = Array.from(el.querySelectorAll('input, select')).some(function(i){ return i.value && i.value.trim(); });
      if (filled) return false;
      return true;
    }).map(function(el){
      return { aid: el.getAttribute('data-automation-id') || '', text: (el.innerText || el.textContent || '').trim().split('\\n')[0].slice(0, 80) };
    });
  })()`)) as { aid: string; text: string }[];
  for (const uf of myInfoUnfilledDropdowns) {
    const text = uf.text.toLowerCase();
    let filled = false;
    let method = "";
    if (/hear|source|how did/i.test(text)) {
      for (const label of ["Internet", "Website", "Job Board", "Online"]) {
        filled = await selectFormFieldDropdown(page, uf.aid, label);
        if (filled) { method = `selectFormFieldDropdown("${label}")`; break; }
      }
      if (!filled) { filled = await selectMultiselect(page, uf.aid, "Internet"); if (filled) method = "selectMultiselect(Internet)"; }
    }
    if (!filled) { filled = await selectFirstDropdownOption(page, uf.aid); if (filled) method = "selectFirstDropdownOption"; }
    if (!filled) { filled = await selectMultiselect(page, uf.aid); if (filled) method = "selectMultiselect(any)"; }
    if (!filled) { filled = await selectDropdownViaKeyboard(page, uf.aid); if (filled) method = "selectDropdownViaKeyboard"; }
    if (filled) {
      // Verify the fill actually stuck by checking selectedItem or non-empty button text
      const verifySelected = await page.locator(`[data-automation-id="${uf.aid}"] [data-automation-id="selectedItem"]`).count().catch(() => 0);
      const verifyBtn = await page.locator(`[data-automation-id="${uf.aid}"] button`).first().textContent().catch(() => "");
      const verifyInput = await page.locator(`[data-automation-id="${uf.aid}"] input`).first().inputValue().catch(() => "");
      steps.push(`workday-wizard: catch-all filled dropdown "${uf.text}" (${uf.aid}) via ${method} [sel=${verifySelected} btn="${(verifyBtn||"").trim().slice(0,40)}" inp="${(verifyInput||"").trim().slice(0,40)}"]`);
      // If no selectedItem and no meaningful button/input text, the fill was a false positive
      if (verifySelected === 0 && !(verifyBtn||"").trim() && !(verifyInput||"").trim()) {
        steps.push(`workday-wizard: catch-all ${uf.aid} false-positive detected, retrying with fillSearchableDropdown`);
        filled = false;
      }
    }
    if (!filled && /hear|source|how did/i.test(text)) {
      filled = await fillSearchableDropdown(page, uf.aid, ["Internet", "Website", "Job Board"], steps);
      if (filled) steps.push(`workday-wizard: catch-all filled source via fillSearchableDropdown (${uf.aid})`);
    }
  }

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

  // Wait for Workday's resume parser to populate fields.
  await page.waitForTimeout(3000);

  // Work Experience fields — some tenants (e.g., Adobe) require Job Title,
  // Company, From, To even after resume upload. Fill only if present and empty.
  const jobTitleField = page.locator('[data-automation-id="formField-jobTitle"] input').first();
  if (await jobTitleField.isVisible({ timeout: 2000 }).catch(() => false)) {
    const jtVal = await jobTitleField.inputValue().catch(() => "");
    if (!jtVal) {
      await jobTitleField.click().catch(() => {});
      await jobTitleField.pressSequentially(applicant.currentTitle || "Software Engineer Intern", { delay: 60 });
    }

    // Company field — try standard automation IDs, then discover by label text.
    const companySels = [
      '[data-automation-id="formField-company"] input',
      '[data-automation-id*="company" i] input',
    ];
    let companyFilled = false;
    for (const cs of companySels) {
      const cf = page.locator(cs).first();
      if (await cf.isVisible({ timeout: 1500 }).catch(() => false)) {
        const cVal = await cf.inputValue().catch(() => "");
        if (!cVal) {
          await cf.click().catch(() => {});
          await cf.pressSequentially("University of Maryland", { delay: 60 });
        }
        companyFilled = true;
        break;
      }
    }
    if (!companyFilled) {
      // Label-based fallback: find any required empty input labeled "Company"
      const compByLabel = page.locator('label:has-text("Company")').locator("..").locator("input").first();
      if (await compByLabel.isVisible({ timeout: 1500 }).catch(() => false)) {
        const cVal = await compByLabel.inputValue().catch(() => "");
        if (!cVal) {
          await compByLabel.click().catch(() => {});
          await compByLabel.pressSequentially("University of Maryland", { delay: 60 });
        }
      }
    }

    const locationField = page.locator('[data-automation-id="formField-location"] input').first();
    if (await locationField.isVisible({ timeout: 1500 }).catch(() => false)) {
      const lVal = await locationField.inputValue().catch(() => "");
      if (!lVal) {
        await locationField.click().catch(() => {});
        await locationField.pressSequentially(applicant.city || "Denver, CO", { delay: 60 });
      }
    }

    const roleDescField = page.locator('[data-automation-id="formField-roleDescription"] textarea').first();
    if (await roleDescField.isVisible({ timeout: 1500 }).catch(() => false)) {
      const rdVal = await roleDescField.inputValue().catch(() => "");
      if (!rdVal) {
        await roleDescField.click().catch(() => {});
        await roleDescField.pressSequentially(
          "Developed software solutions and collaborated with cross-functional teams to deliver projects on time.",
          { delay: 30 },
        );
      }
    }

    await fillWorkdayDate(page, "startDate", steps);
    await fillWorkdayDate(page, "endDate", steps);
    steps.push("workday-wizard: filled work experience fields");
  }

  // Education fields — School, Degree, Field of Study BEFORE catch-all so
  // searchable dropdown selections register properly.
  const schoolTerms = [
    "University of Maryland",
    "University of Maryland, College Park",
    "University of Maryland-College Park",
    "UMD",
    "Maryland",
    "College Park",
    "Univ of Maryland",
    "Univ Maryland",
  ];
  let schoolFilled = await fillSearchableDropdown(page, "formField-school", schoolTerms, steps);
  if (!schoolFilled) {
    schoolFilled = await fillSearchableDropdown(page, "formField-schoolName", schoolTerms.slice(0, 3), steps);
  }
  let fosFilled = await fillSearchableDropdown(page, "formField-fieldOfStudy",
    ["Computer Science", "Computer Science and Engineering", "Information Technology"], steps);
  if (!fosFilled) await selectFormFieldDropdown(page, "formField-fieldOfStudy", "Computer");
  let degreeFilled = await selectFormFieldDropdown(page, "formField-degree", "Bachelor");
  if (!degreeFilled) degreeFilled = await selectFormFieldDropdown(page, "formField-degree", "Bachelor's Degree");
  if (!degreeFilled) degreeFilled = await selectFirstDropdownOption(page, "formField-degree");
  if (!degreeFilled) degreeFilled = await fillSearchableDropdown(page, "formField-degree",
    ["Bachelor", "Bachelor's", "BS", "B.S."], steps);
  if (!degreeFilled) degreeFilled = await selectDropdownViaKeyboard(page, "formField-degree", "Bachelor");
  // Education dates: From / To
  await fillWorkdayDate(page, "educationStartDate", steps);
  await fillWorkdayDate(page, "educationEndDate", steps);
  // Some tenants use "from" / "to" automation IDs for education
  const fromField = page.locator('[data-automation-id="formField-from"], [data-automation-id="formField-startYear"]').first();
  if (await fromField.isVisible({ timeout: 1000 }).catch(() => false)) {
    const input = fromField.locator("input").first();
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      const val = await input.inputValue().catch(() => "");
      if (!val) { await input.click().catch(() => {}); await input.pressSequentially("2023", { delay: 60 }); }
    }
  }
  const toField = page.locator('[data-automation-id="formField-to"], [data-automation-id="formField-endYear"]').first();
  if (await toField.isVisible({ timeout: 1000 }).catch(() => false)) {
    const input = toField.locator("input").first();
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      const val = await input.inputValue().catch(() => "");
      if (!val) { await input.click().catch(() => {}); await input.pressSequentially("2026", { delay: 60 }); }
    }
  }
  // firstYearAttended / lastYearAttended (BofA, P&G, etc.)
  const fyaField = page.locator('[data-automation-id="formField-firstYearAttended"] input').first();
  if (await fyaField.isVisible({ timeout: 500 }).catch(() => false)) {
    const v = await fyaField.inputValue().catch(() => "");
    if (!v) { await fyaField.click().catch(() => {}); await fyaField.pressSequentially("2023", { delay: 60 }); }
  }
  const lyaField = page.locator('[data-automation-id="formField-lastYearAttended"] input').first();
  if (await lyaField.isVisible({ timeout: 500 }).catch(() => false)) {
    const v = await lyaField.inputValue().catch(() => "");
    if (!v) { await lyaField.click().catch(() => {}); await lyaField.pressSequentially("2026", { delay: 60 }); }
  }

  // Language and proficiency fields (HP Inc, some other tenants)
  const langField = page.locator('[data-automation-id="formField-language"]').first();
  if (await langField.isVisible({ timeout: 500 }).catch(() => false)) {
    let langFilled = await selectFormFieldDropdown(page, "formField-language", "English");
    if (!langFilled) langFilled = await selectFirstDropdownOption(page, "formField-language");
    if (!langFilled) await fillSearchableDropdown(page, "formField-language", "English", steps);
  }

  // Language proficiency "Overall" — often has hex automation ID. Discover by label.
  const profFields = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      var text = (el.innerText || el.textContent || '').toLowerCase();
      if (!/^overall|proficiency|fluency/i.test(text.trim())) return false;
      var sel = el.querySelector('[data-automation-id="selectedItem"]');
      if (sel) return false;
      return !!el.querySelector('button[aria-haspopup], [data-automation-id="promptIcon"], select');
    }).map(function(el){ return el.getAttribute('data-automation-id') || ''; });
  })()`)) as string[];
  for (const pAid of profFields) {
    let filled = await selectFormFieldDropdown(page, pAid, "Advanced");
    if (!filled) filled = await selectFormFieldDropdown(page, pAid, "Intermediate");
    if (!filled) await selectFirstDropdownOption(page, pAid);
  }

  steps.push("workday-wizard: filled education fields");

  // Skills tagger: some tenants require adding at least one skill via a tag input.
  const skillsInput = page.locator('[data-automation-id*="skill" i] input, [data-automation-id*="skills" i] input').first();
  if (await skillsInput.isVisible({ timeout: 1500 }).catch(() => false)) {
    const sVal = await skillsInput.inputValue().catch(() => "");
    if (!sVal) {
      await skillsInput.click().catch(() => {});
      await skillsInput.pressSequentially("Python", { delay: 60 });
      await page.waitForTimeout(600);
      const skillOpt = page.locator('[role="option"]').filter({ hasText: /Python/i }).first();
      if (await skillOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skillOpt.click().catch(() => {});
      } else {
        await page.keyboard.press("Enter").catch(() => {});
      }
      await page.waitForTimeout(300);
      steps.push("workday-wizard: added skill 'Python' via tag input");
    }
  }

  // Catch-all: discover ALL empty required text inputs on the page and fill
  // them with sensible defaults. Skip fields already handled above.
  const emptyFields = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"] input[type="text"], [data-automation-id^="formField-"] input:not([type])')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      if (el.type === 'file' || el.type === 'hidden') return false;
      if (el.value && el.value.trim()) return false;
      var ff = el.closest('[data-automation-id^="formField-"]');
      if (!ff) return false;
      var aid = ff.getAttribute('data-automation-id') || '';
      if (/school|degree|fieldOfStudy|skill/i.test(aid)) return false;
      return true;
    }).map(function(el){
      var ff = el.closest('[data-automation-id^="formField-"]');
      var label = (ff.innerText || ff.textContent || '').trim().split('\\n')[0].slice(0, 100);
      return { aid: ff.getAttribute('data-automation-id') || '', label: label };
    });
  })()`)) as { aid: string; label: string }[];
  for (const ef of emptyFields) {
    const label = ef.label.toLowerCase();
    let value = "";
    if (/company/i.test(label)) value = "University of Maryland";
    else if (/job title|role|position/i.test(label)) value = applicant.currentTitle || "Software Engineer Intern";
    else if (/location|city/i.test(label)) value = applicant.city || "Denver, CO";
    else if (/gpa/i.test(label)) value = "3.5";
    else continue;
    const input = page.locator(`[data-automation-id="${ef.aid}"] input`).first();
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.click().catch(() => {});
      await input.fill("").catch(() => {});
      await input.pressSequentially(value, { delay: 60 });
      const got = await input.inputValue().catch(() => "");
      if (!got) await input.fill(value).catch(() => {});
      steps.push(`workday-wizard: catch-all filled "${ef.label}" (${ef.aid}) = "${value}"`);
    }
  }

  // Catch-all for unfilled required dropdowns (hex-ID fields like "Overall" proficiency).
  const unfilledDropdowns = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      var btn = el.querySelector('button[aria-haspopup], [data-automation-id="promptIcon"]');
      if (!btn) return false;
      var selected = el.querySelector('[data-automation-id="selectedItem"]');
      if (selected) return false;
      var aid = (el.getAttribute('data-automation-id') || '');
      if (/country|countryregion|countryphone|source|phoneType|degree|school/i.test(aid)) return false;
      return true;
    }).map(function(el){
      return { aid: el.getAttribute('data-automation-id') || '', text: (el.innerText || el.textContent || '').trim().split('\\n')[0].slice(0, 80) };
    });
  })()`)) as { aid: string; text: string }[];
  for (const uf of unfilledDropdowns) {
    const filled = await selectFirstDropdownOption(page, uf.aid);
    if (filled) steps.push(`workday-wizard: catch-all filled dropdown "${uf.text}" (${uf.aid})`);
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

async function fillApplicationQuestions(page: Page, tenant: WorkdayTenant, steps: string[]): Promise<void> {
  const fields: FieldRef[] = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
      var r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && el.querySelector('button[aria-haspopup], select, [data-automation-id="multiSelectContainer"]');
    }).map(function(el){
      return { aid: el.getAttribute('data-automation-id') || '', text: (el.innerText || el.textContent || '').trim().slice(0, 200) };
    });
  })()`)) as FieldRef[];

  for (const ff of fields) {
    const preferText = answerForQuestion(tenant, ff.text);
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
  // Check all visible checkboxes (acknowledgments, terms, certifications).
  const checkboxes = await page.locator('input[type="checkbox"]').all();
  let cbChecked = 0;
  for (const cb of checkboxes) {
    if (await cb.isVisible({ timeout: 500 }).catch(() => false)) {
      const checked = await cb.isChecked().catch(() => true);
      if (!checked) {
        await cb.check({ timeout: 2000 }).catch(() => {});
        cbChecked++;
      }
    }
  }

  // Also handle text inputs on the AQ page (e.g., salary, "Please explain" free-text fields).
  const textInputs = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"] input[type="text"], [data-automation-id^="formField-"] textarea')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      var ff = el.closest('[data-automation-id^="formField-"]');
      if (!ff) return false;
      if (ff.querySelector('button[aria-haspopup], select, [data-automation-id="multiSelectContainer"]')) return false;
      return !el.value;
    }).map(function(el){
      var ff = el.closest('[data-automation-id^="formField-"]');
      var label = (ff.innerText || ff.textContent || '').trim().split('\\n')[0].slice(0, 200);
      return { aid: ff.getAttribute('data-automation-id') || '', tag: el.tagName, label: label };
    });
  })()`)) as { aid: string; tag: string; label: string }[];
  for (const ti of textInputs) {
    const input = page.locator(`[data-automation-id="${ti.aid}"] ${ti.tag.toLowerCase()}`).first();
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      const label = ti.label.toLowerCase();
      let value = "N/A";
      if (/salary|compensation|pay|wage/i.test(label)) value = "70000";
      else if (/year|experience/i.test(label)) value = "0";
      else if (/date|when|graduation/i.test(label)) value = "05/2026";
      await input.click().catch(() => {});
      await input.pressSequentially(value, { delay: 30 }).catch(() => {});
    }
  }

  // Re-scan for conditional dropdowns that appeared after answering earlier questions.
  for (let rescan = 0; rescan < 3; rescan++) {
    await page.waitForTimeout(500);
    const newDropdowns: FieldRef[] = (await page.evaluate(`(function(){
      return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
        var r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return false;
        var hasDropdown = el.querySelector('button[aria-haspopup], select, [data-automation-id="multiSelectContainer"]');
        if (!hasDropdown) return false;
        var selected = el.querySelector('[data-automation-id="selectedItem"]');
        if (selected) return false;
        var filled = Array.from(el.querySelectorAll('input, select')).some(function(i){ return i.value && i.value.trim(); });
        return !filled;
      }).map(function(el){
        return { aid: el.getAttribute('data-automation-id') || '', text: (el.innerText || el.textContent || '').trim().slice(0, 200) };
      });
    })()`)) as FieldRef[];
    if (newDropdowns.length === 0) break;
    for (const ff of newDropdowns) {
      const preferText = answerForQuestion(tenant, ff.text);
      const trigger = page.locator(`[data-automation-id="${ff.aid}"] button[aria-haspopup]`).first();
      if (!(await trigger.isVisible({ timeout: 1500 }).catch(() => false))) continue;
      await trigger.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(500);
      const opts = await listOptions(page);
      if (opts.length === 0) { await page.keyboard.press("Escape").catch(() => {}); continue; }
      let pick = preferText ? opts.find((o) => new RegExp(escape(preferText), "i").test(o)) : undefined;
      pick = pick || opts.find((o) => o && !/select one/i.test(o)) || opts[0];
      const opt = page.locator(`[role="option"]:not([data-automation-id="selectedItem"])`).filter({ hasText: pick }).first();
      if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) {
        await opt.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(300);
      }
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(200);
    }
  }

  // Re-scan text inputs for conditional fields too.
  const lateTextInputs = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"] input[type="text"], [data-automation-id^="formField-"] textarea')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      var ff = el.closest('[data-automation-id^="formField-"]');
      if (!ff) return false;
      return !el.value;
    }).map(function(el){
      var ff = el.closest('[data-automation-id^="formField-"]');
      var label = (ff.innerText || ff.textContent || '').trim().split('\\n')[0].slice(0, 200);
      return { aid: ff.getAttribute('data-automation-id') || '', tag: el.tagName, label: label };
    });
  })()`)) as { aid: string; tag: string; label: string }[];
  for (const ti of lateTextInputs) {
    const input = page.locator(`[data-automation-id="${ti.aid}"] ${ti.tag.toLowerCase()}`).first();
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      const label = ti.label.toLowerCase();
      let value = "N/A";
      if (/salary|compensation|pay|wage/i.test(label)) value = "70000";
      else if (/year|experience/i.test(label)) value = "0";
      else if (/date|when|start|available/i.test(label)) value = "05/2026";
      await input.click().catch(() => {});
      await input.pressSequentially(value, { delay: 30 }).catch(() => {});
    }
  }

  // Dismiss any stuck popover/dropdown before the main loop tries Next.
  await page.keyboard.press("Escape").catch(() => {});
  await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(500);

  steps.push(`workday-wizard: filled step 3 (Application Questions, ${fields.length} dropdowns, ${cbChecked} checkboxes)`);
}

async function fillVoluntaryDisclosures(page: Page, applicant: ApplicantData, steps: string[]): Promise<void> {
  // Dropdowns on VD/Self-Identify/Consent pages (gender, race, veteran, consent).
  const genderFields = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      if (!el.querySelector('button[aria-haspopup], select, [role="listbox"], [data-automation-id="multiSelectContainer"], [data-automation-id="promptIcon"]')) return false;
      var aid = (el.getAttribute('data-automation-id') || '').toLowerCase();
      if (/date|esignature/.test(aid)) return false;
      if (el.querySelector('[data-automation-id*="dateSection"]')) return false;
      return true;
    }).map(function(el){
      var isMs = !!el.querySelector('[data-automation-id="multiSelectContainer"], [data-automation-id="promptIcon"]');
      return { aid: el.getAttribute('data-automation-id') || '', text: (el.innerText || el.textContent || '').trim().slice(0, 200), isMultiselect: isMs };
    });
  })()`)) as (FieldRef & { isMultiselect: boolean })[];
  for (const ff of genderFields) {
    const label = ff.text.toLowerCase();
    let preferText = "Decline to Self Identify";
    if (/consent|terms|conditions|acknowledge|agree|certif/i.test(label)) preferText = "Yes";
    else if (/gender/i.test(label)) preferText = "Decline to Self Identify";
    else if (/race|ethnic/i.test(label)) preferText = "Decline to Self Identify";
    else if (/veteran/i.test(label)) preferText = "not a veteran";
    else if (/disability|disab/i.test(label)) preferText = "prefer not";
    else if (/citizen/i.test(label)) preferText = "United States";
    else if (/nationality/i.test(label)) preferText = "United States";
    else if (/marital/i.test(label)) preferText = "Single";
    else if (/engage|contract|business.*relat|current.*role|worked.*for|employed.*by|relative|family.*member|previous.*worker/i.test(label)) preferText = "No";

    if (ff.isMultiselect) {
      await selectMultiselect(page, ff.aid, preferText);
      continue;
    }

    const trigger = page.locator(`[data-automation-id="${ff.aid}"] button[aria-haspopup]`).first();
    if (!(await trigger.isVisible({ timeout: 1500 }).catch(() => false))) continue;
    await trigger.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
    const opts = await listOptions(page);
    if (opts.length === 0) { await page.keyboard.press("Escape").catch(() => {}); continue; }
    let pick = opts.find((o) => new RegExp(escape(preferText), "i").test(o))
      || (/consent|terms|agree|certif/i.test(label) ? opts.find((o) => /^yes/i.test(o)) : undefined)
      || opts.find((o) => /decline|prefer not|choose not/i.test(o))
      || opts.find((o) => o && !/select one/i.test(o))
      || opts[0];
    const opt = page.locator(`[role="option"]:not([data-automation-id="selectedItem"])`).filter({ hasText: pick }).first();
    if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) {
      await opt.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(200);
  }

  // Fallback: retry unfilled dropdowns (citizenship, nationality, etc.) via keyboard + searchable dropdown.
  const vdUnfilled = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      var hasDropdown = !!el.querySelector('button[aria-haspopup], [data-automation-id="multiSelectContainer"], [data-automation-id="promptIcon"]');
      if (!hasDropdown) return false;
      var hasSelected = !!el.querySelector('[data-automation-id="selectedItem"]');
      var filled = Array.from(el.querySelectorAll('input, select')).some(function(i){ return i.value && i.value.trim(); });
      return !hasSelected && !filled;
    }).map(function(el){
      return { aid: el.getAttribute('data-automation-id') || '', text: (el.innerText || el.textContent || '').trim().split('\\n')[0].slice(0, 80) };
    });
  })()`)) as { aid: string; text: string }[];
  for (const uf of vdUnfilled) {
    const label = uf.text.toLowerCase();
    let preferText = "";
    if (/citizen/i.test(label)) preferText = "United States";
    else if (/nationality/i.test(label)) preferText = "United States";
    else if (/marital/i.test(label)) preferText = "Single";
    else if (/gender/i.test(label)) preferText = "Decline";
    let filled = await selectDropdownViaKeyboard(page, uf.aid, preferText || undefined);
    if (!filled) filled = await selectFirstDropdownOption(page, uf.aid);
    if (!filled) filled = await fillSearchableDropdown(page, uf.aid, preferText ? [preferText] : ["United States"], steps);
    if (filled) steps.push(`workday-wizard: VD fallback filled "${uf.text}" (${uf.aid})`);
  }

  // T&C / acknowledgment checkboxes (standard + custom + role-based).
  const checkboxes = await page.locator('input[type="checkbox"]').all();
  for (const cb of checkboxes) {
    if (await cb.isVisible({ timeout: 500 }).catch(() => false)) {
      const checked = await cb.isChecked().catch(() => true);
      if (!checked) await cb.check({ timeout: 2000 }).catch(() => {});
    }
  }
  const roleCheckboxes = await page.locator('[role="checkbox"]').all();
  for (const cb of roleCheckboxes) {
    if (await cb.isVisible({ timeout: 500 }).catch(() => false)) {
      const state = await cb.getAttribute("aria-checked").catch(() => "true");
      if (state !== "true") await cb.click({ timeout: 2000 }).catch(() => {});
    }
  }

  // Radio buttons: click "Yes" for any consent/terms radio groups.
  const yesRadios = await page.locator('label:has-text("Yes") input[type="radio"], label:has-text("I consent") input[type="radio"], label:has-text("I agree") input[type="radio"]').all();
  for (const radio of yesRadios) {
    if (await radio.isVisible({ timeout: 500 }).catch(() => false)) {
      const checked = await radio.isChecked().catch(() => true);
      if (!checked) await radio.check({ timeout: 2000 }).catch(() => {});
    }
  }
  // Also try clicking label elements directly (for custom radio-like components).
  const yesLabels = await page.locator('label:has-text("Yes, I have read"), label:has-text("Yes, I consent"), label:has-text("I acknowledge")').all();
  for (const label of yesLabels) {
    if (await label.isVisible({ timeout: 500 }).catch(() => false)) {
      await label.click({ timeout: 2000 }).catch(() => {});
    }
  }

  // Workday hides native checkboxes behind styled labels (e.g., Capital One's
  // "acceptTermsAndAgreements"). Force-check any unchecked hidden checkbox.
  // Do NOT click the label afterward — that toggles the state back off.
  const consentSels = [
    '[data-automation-id="formField-acceptTermsAndAgreements"]',
    '[data-automation-id*="consent" i]',
  ];
  for (const cSel of consentSels) {
    const container = page.locator(cSel).first();
    if (!(await container.isVisible({ timeout: 500 }).catch(() => false))) continue;
    const cb = container.locator('input[type="checkbox"]').first();
    if (await cb.count() > 0) {
      const checked = await cb.isChecked().catch(() => true);
      if (!checked) {
        await cb.check({ force: true, timeout: 2000 }).catch(() => {});
        steps.push(`workday-wizard: force-checked hidden consent checkbox in ${cSel}`);
      }
    }
  }
  // Text inputs (e-signature pages: Name + Date fields).
  // First pass: formField-* containers (skip dateSection inputs — handled by date widget).
  const emptyInputs = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"] input')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      if (el.type === 'file' || el.type === 'hidden' || el.type === 'checkbox' || el.type === 'radio') return false;
      var ownAid = el.getAttribute('data-automation-id') || '';
      if (/dateSection/i.test(ownAid)) return false;
      return !el.value || !el.value.trim();
    }).map(function(el){
      var ff = el.closest('[data-automation-id^="formField-"]');
      var label = (ff.innerText || ff.textContent || '').trim().split('\\n')[0].slice(0, 100);
      return { aid: ff.getAttribute('data-automation-id') || '', label: label, type: el.type || 'text', sel: 'formField' };
    });
  })()`)) as { aid: string; label: string; type: string; sel: string }[];

  // Second pass: ANY visible empty input on the page (catches fields outside formField containers).
  // Also skip dateSection inputs.
  const allEmptyInputs = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('input')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      if (el.type === 'file' || el.type === 'hidden' || el.type === 'checkbox' || el.type === 'radio') return false;
      if (el.closest('[data-automation-id^="formField-"]')) return false;
      var ownAid = el.getAttribute('data-automation-id') || '';
      if (/dateSection/i.test(ownAid)) return false;
      return !el.value || !el.value.trim();
    }).map(function(el){
      var parent = el.parentElement;
      var nearby = '';
      for (var p = el; p && p !== document.body; p = p.parentElement) {
        var t = (p.innerText || p.textContent || '').trim();
        if (t.length > 2 && t.length < 200) { nearby = t.split('\\n')[0].slice(0, 100); break; }
      }
      var aid = el.getAttribute('data-automation-id') || el.id || '';
      return { aid: aid, label: nearby, type: el.type || 'text', sel: 'loose' };
    });
  })()`)) as { aid: string; label: string; type: string; sel: string }[];

  const combined = [...emptyInputs, ...allEmptyInputs];
  let textFilled = 0;
  for (let i = 0; i < combined.length; i++) {
    const ti = combined[i];
    const label = ti.label.toLowerCase();
    let value = "";
    if (/\bname\b|signature/i.test(label) && !/date/i.test(label)) value = `${applicant.firstName} ${applicant.lastName}`;
    else if (/\bdate\b|today/i.test(label) || ti.aid.toLowerCase().includes("date")) value = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    else continue;
    const input = ti.sel === "formField"
      ? page.locator(`[data-automation-id="${ti.aid}"] input`).first()
      : ti.aid
        ? page.locator(`[data-automation-id="${ti.aid}"], #${ti.aid}`).first()
        : page.locator("input").filter({ hasText: "" }).nth(i);
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await clearAndType(page, input, value);
      textFilled++;
      steps.push(`workday-wizard: filled ${ti.sel} input "${ti.label}" = "${value}"`);
    }
  }

  // Catch-all: fill any remaining empty text inputs and textareas
  // (handles conditional "If yes, describe...", graduation dates, etc.).
  // Skip inputs inside dropdown containers (those are filter/search inputs, not value inputs).
  const remainingEmpty = (await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"] input[type="text"], [data-automation-id^="formField-"] input:not([type]), [data-automation-id^="formField-"] textarea')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      if (el.type === 'file' || el.type === 'hidden' || el.type === 'checkbox' || el.type === 'radio') return false;
      var ownAid = el.getAttribute('data-automation-id') || '';
      if (/dateSection/i.test(ownAid)) return false;
      var ff = el.closest('[data-automation-id^="formField-"]');
      if (ff && (ff.querySelector('button[aria-haspopup]') || ff.querySelector('[data-automation-id="promptIcon"]') || ff.querySelector('[data-automation-id="multiSelectContainer"]'))) return false;
      return !el.value || !el.value.trim();
    }).map(function(el){
      var ff = el.closest('[data-automation-id^="formField-"]');
      return { aid: (ff ? ff.getAttribute('data-automation-id') : '') || '', tag: el.tagName, label: ((ff ? ff.innerText : '') || '').trim().split('\\n')[0].slice(0, 100) };
    });
  })()`)) as { aid: string; tag: string; label: string }[];
  for (const re of remainingEmpty) {
    const lbl = re.label.toLowerCase();
    let val = "N/A";
    if (/graduation.*date|expected.*date|anticipated.*date/i.test(lbl)) val = "05/2026";
    else if (/\bdate\b/i.test(lbl)) val = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    else if (/salary|compensation|pay/i.test(lbl)) val = "70000";
    const el = page.locator(`[data-automation-id="${re.aid}"] ${re.tag.toLowerCase()}`).first();
    if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
      await el.click().catch(() => {});
      await el.pressSequentially(val, { delay: 30 }).catch(() => {});
      textFilled++;
      steps.push(`workday-wizard: filled remaining empty ${re.tag} "${re.label}" = "${val}"`);
    }
  }

  // E-signature date: Workday uses a multi-part date widget (month dropdown +
  // day input + year input) with dateSectionMonth-input / dateSectionDay-input /
  // dateSectionYear-input automation IDs, NOT a simple text input. Try the
  // widget first, then fall back to text input approaches.
  if (textFilled === 0 || !combined.some((ti) => /date/i.test(ti.label))) {
    const now = new Date();
    const monthIdx = now.getMonth();
    const dayStr = String(now.getDate()).padStart(2, "0");
    const yearStr = String(now.getFullYear());
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const todayStr = `${String(monthIdx + 1).padStart(2, "0")}/${dayStr}/${yearStr}`;
    let dateFilled = false;

    // Strategy 1: Workday multi-part date widget (month/day/year components).
    // Find any formField container that has date widget sub-components.
    const dateContainerAids = [
      "formField-dateOfBirth",
      "formField-esignatureDate", "formField-date", "formField-dateSigned",
      "formField-signatureDate", "formField-Date", "formField-expectedGraduationDate",
      "formField-graduationDate",
    ];
    for (const aid of dateContainerAids) {
      const container = page.locator(`[data-automation-id="${aid}"]`).first();
      if (!(await container.isVisible({ timeout: 500 }).catch(() => false))) continue;

      // DOB uses a past date; other date fields use today's date
      const isDob = /dateOfBirth|dob/i.test(aid);
      const useMonth = isDob ? 0 : monthIdx; // January for DOB
      const useDay = isDob ? "15" : dayStr;
      const useYear = isDob ? "2003" : yearStr;
      const useDateStr = `${String(useMonth + 1).padStart(2, "0")}/${useDay}/${useYear}`;

      // Month: text input, <select>, or custom dropdown button
      const monthEl = container.locator('[data-automation-id="dateSectionMonth-input"], [data-automation-id*="month" i]').first();
      const monthSel = container.locator("select").first();
      if (await monthEl.isVisible({ timeout: 500 }).catch(() => false)) {
        const tag = await monthEl.evaluate((el: Element) => el.tagName).catch(() => "");
        if (tag === "INPUT") {
          await clearAndType(page, monthEl, String(useMonth + 1));
          await monthEl.press("Tab").catch(() => {});
        } else {
          await monthEl.click().catch(() => {});
          await page.waitForTimeout(400);
          const opt = page.locator('[role="option"]').filter({ hasText: monthNames[useMonth] }).first();
          if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) await opt.click().catch(() => {});
          await page.waitForTimeout(300);
        }
      } else if (await monthSel.isVisible({ timeout: 500 }).catch(() => false)) {
        await monthSel.selectOption(String(useMonth + 1).padStart(2, "0")).catch(() =>
          monthSel.selectOption({ index: useMonth + 1 }).catch(() => {}));
      }

      // Day input
      const dayInput = container.locator('[data-automation-id="dateSectionDay-input"]').first();
      if (await dayInput.isVisible({ timeout: 500 }).catch(() => false)) {
        await clearAndType(page, dayInput, useDay);
        await dayInput.press("Tab").catch(() => {});
      }

      // Year input
      const yearInput = container.locator('[data-automation-id="dateSectionYear-input"]').first();
      if (await yearInput.isVisible({ timeout: 500 }).catch(() => false)) {
        await clearAndType(page, yearInput, useYear);
        await yearInput.press("Tab").catch(() => {});
      }

      // Single-input variant: one text input inside the container
      const singleInputs = await container.locator("input:not([type='hidden']):not([type='checkbox'])").all();
      if (singleInputs.length === 1) {
        const val = await singleInputs[0].inputValue().catch(() => "");
        if (!val.trim()) {
          await singleInputs[0].click().catch(() => {});
          await singleInputs[0].pressSequentially(useDateStr, { delay: 60 });
          dateFilled = true;
        }
      }

      // Count as filled if we found the container (even if we couldn't
      // confirm every sub-component — the container existing is a strong signal).
      if (!dateFilled) {
        const anyInput = await container.locator("input, select, button[aria-haspopup]").count();
        dateFilled = anyInput > 0;
      }
      if (dateFilled) {
        textFilled++;
        steps.push(`workday-wizard: filled date widget in "${aid}"`);
        break;
      }
    }

    // Strategy 2: find dateSectionMonth/Day/Year anywhere on the page
    // (for containers with unknown automation-ids).
    if (!dateFilled) {
      const allMonths = page.locator('[data-automation-id="dateSectionMonth-input"]');
      const monthCount = await allMonths.count().catch(() => 0);
      const monthWidget = allMonths.first();
      if (await monthWidget.isVisible({ timeout: 500 }).catch(() => false)) {
        const tag = await monthWidget.evaluate((el: Element) => el.tagName).catch(() => "");
        // Check if this date widget is inside a DOB container
        const s2IsDob = await monthWidget.evaluate((el: Element) => {
          for (let p: Element | null = el; p; p = p.parentElement) {
            const aid = p.getAttribute("data-automation-id") || "";
            if (/dateOfBirth|dob/i.test(aid)) return true;
            const text = (p.textContent || "").toLowerCase();
            if (/date of birth/i.test(text) && text.length < 200) return true;
          }
          return false;
        }).catch(() => false);
        const s2Month = s2IsDob ? "01" : String(monthIdx + 1).padStart(2, "0");
        const s2Day = s2IsDob ? "15" : dayStr;
        const s2Year = s2IsDob ? "2003" : yearStr;
        const monthVal = s2Month;
        steps.push(`workday-wizard: date S2 found ${monthCount} month widgets (tag=${tag}, dob=${s2IsDob}), filling M=${monthVal} D=${s2Day} Y=${s2Year}`);
        if (tag === "INPUT") {
          // Workday's date widget auto-advances: after 2 digits in month the
          // cursor jumps to day, after 2 in day it jumps to year. Type the
          // full date as continuous digits into the month field and let
          // auto-advance distribute them: MMDDYYYY.
          await monthWidget.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
          await monthWidget.click().catch(async () => {
            await monthWidget.evaluate((e: HTMLInputElement) => { e.focus(); e.select(); }).catch(() => {});
          });
          await page.waitForTimeout(200);
          await page.keyboard.press("Control+a");
          await page.keyboard.press("Backspace");
          await page.waitForTimeout(100);
          const fullDate = `${monthVal}${s2Day}${s2Year}`;
          await page.keyboard.type(fullDate, { delay: 80 });
          await page.waitForTimeout(500);
          const mAfter = await monthWidget.inputValue().catch(() => "?");
          const dAfter = await page.locator('[data-automation-id="dateSectionDay-input"]').first().inputValue().catch(() => "?");
          const yAfter = await page.locator('[data-automation-id="dateSectionYear-input"]').first().inputValue().catch(() => "?");
          steps.push(`workday-wizard: date S2 typed "${fullDate}" → "${mAfter}/${dAfter}/${yAfter}"`);
        } else {
          await monthWidget.click().catch(() => {});
          await page.waitForTimeout(400);
          const s2MonthName = monthNames[s2IsDob ? 0 : monthIdx];
          const opt = page.locator('[role="option"]').filter({ hasText: s2MonthName }).first();
          if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) await opt.click().catch(() => {});
          await page.waitForTimeout(300);
          const dayW = page.locator('[data-automation-id="dateSectionDay-input"]').first();
          if (await dayW.isVisible({ timeout: 500 }).catch(() => false)) {
            await clearAndType(page, dayW, s2Day);
          }
          const yearW = page.locator('[data-automation-id="dateSectionYear-input"]').first();
          if (await yearW.isVisible({ timeout: 500 }).catch(() => false)) {
            await clearAndType(page, yearW, s2Year);
          }
        }
        // Click somewhere neutral to dismiss any open popover and trigger blur validation.
        await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(500);
        dateFilled = true;
        textFilled++;
        const mVal = await monthWidget.inputValue().catch(() => "?");
        const dVal = await page.locator('[data-automation-id="dateSectionDay-input"]').first().inputValue().catch(() => "?");
        const yVal = await page.locator('[data-automation-id="dateSectionYear-input"]').first().inputValue().catch(() => "?");
        steps.push(`workday-wizard: filled date widget (global dateSection* search) → ${mVal}/${dVal}/${yVal}`);
      }
    }

    // Strategy 3: simple text input in a known container
    if (!dateFilled) {
      for (const da of dateContainerAids) {
        const loc = page.locator(`[data-automation-id="${da}"] input`).first();
        if (await loc.isVisible({ timeout: 500 }).catch(() => false)) {
          await loc.click().catch(() => {});
          await loc.pressSequentially(todayStr, { delay: 60 });
          textFilled++;
          dateFilled = true;
          steps.push(`workday-wizard: filled date text input in "${da}"`);
          break;
        }
      }
    }

    // Strategy 4: label-based text input lookup
    if (!dateFilled) {
      const dateLabelInput = page.locator('label:has-text("Date")').locator("..").locator("input").first();
      if (await dateLabelInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        const val = await dateLabelInput.inputValue().catch(() => "");
        if (!val.trim()) {
          await dateLabelInput.click().catch(() => {});
          await dateLabelInput.pressSequentially(todayStr, { delay: 60 });
          textFilled++;
          dateFilled = true;
          steps.push("workday-wizard: filled date via label lookup");
        }
      }
    }

    // Strategy 5: placeholder/aria-label
    if (!dateFilled) {
      const placeholderInput = page.locator('input[placeholder*="date" i], input[placeholder*="today" i], input[aria-label*="date" i]').first();
      if (await placeholderInput.isVisible({ timeout: 500 }).catch(() => false)) {
        await placeholderInput.click().catch(() => {});
        await placeholderInput.pressSequentially(todayStr, { delay: 60 });
        textFilled++;
        dateFilled = true;
        steps.push("workday-wizard: filled date via placeholder/aria-label");
      }
    }

    // Strategy 6: discover any formField with "graduation" or "expected date" in
    // its label — some tenants use hex automation IDs with non-standard widgets.
    if (!dateFilled) {
      const dateByLabel = (await page.evaluate(`(function(){
        return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
          var r = el.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) return false;
          var text = (el.innerText || el.textContent || '').toLowerCase();
          if (!/graduation|expected.*date/i.test(text)) return false;
          var filled = Array.from(el.querySelectorAll('input, select, [data-automation-id="selectedItem"]')).some(function(i){
            return (i.value && i.value.trim()) || i.getAttribute('data-automation-id') === 'selectedItem';
          });
          return !filled;
        }).map(function(el){ return el.getAttribute('data-automation-id') || ''; });
      })()`)) as string[];
      for (const fieldAid of dateByLabel) {
        const container = page.locator(`[data-automation-id="${fieldAid}"]`).first();
        // Try date widget sub-components
        const monthW = container.locator('[data-automation-id="dateSectionMonth-input"], [data-automation-id*="month" i]').first();
        if (await monthW.isVisible({ timeout: 500 }).catch(() => false)) {
          const tag = await monthW.evaluate((el: Element) => el.tagName).catch(() => "");
          if (tag === "INPUT") {
            const fullDate = `${String(monthIdx + 1).padStart(2, "0")}${dayStr}${yearStr}`;
            await monthW.click().catch(() => {});
            await page.keyboard.press("Control+a");
            await page.keyboard.press("Backspace");
            await page.keyboard.type(fullDate, { delay: 80 });
          } else {
            await monthW.click().catch(() => {});
            await page.waitForTimeout(400);
            const opt = page.locator('[role="option"]').filter({ hasText: monthNames[monthIdx] }).first();
            if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) await opt.click().catch(() => {});
          }
          dateFilled = true;
          textFilled++;
          steps.push(`workday-wizard: filled graduation date widget in ${fieldAid}`);
          break;
        }
        // Try single text input
        const singleInput = container.locator("input:not([type='hidden']):not([type='checkbox'])").first();
        if (await singleInput.isVisible({ timeout: 500 }).catch(() => false)) {
          const val = await singleInput.inputValue().catch(() => "");
          if (!val.trim()) {
            await singleInput.click().catch(() => {});
            await singleInput.pressSequentially("05/2026", { delay: 60 });
            dateFilled = true;
            textFilled++;
            steps.push(`workday-wizard: filled graduation date text input in ${fieldAid}`);
            break;
          }
        }
        // Try dropdown (button, or any clickable element)
        const dropBtn = container.locator("button").first();
        if (await dropBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await dropBtn.click().catch(() => {});
          await page.waitForTimeout(600);
          const opts = await listOptions(page);
          const pick = opts.find(o => /2026|2027/i.test(o)) || opts[opts.length - 1];
          if (pick) {
            const opt = page.locator('[role="option"]:not([data-automation-id="selectedItem"])').filter({ hasText: pick }).first();
            if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) {
              await opt.click().catch(() => {});
              dateFilled = true;
              textFilled++;
              steps.push(`workday-wizard: selected graduation date "${pick}" from dropdown in ${fieldAid}`);
            }
          }
          await page.keyboard.press("Escape").catch(() => {});
          if (dateFilled) break;
        }
        // Last resort: try selectFormFieldDropdown with date-like values
        if (await selectFormFieldDropdown(page, fieldAid, "2026")) {
          dateFilled = true;
          textFilled++;
          steps.push(`workday-wizard: selected graduation date via selectFormFieldDropdown in ${fieldAid}`);
          break;
        }
        if (await selectFormFieldDropdown(page, fieldAid, "May")) {
          dateFilled = true;
          textFilled++;
          steps.push(`workday-wizard: selected graduation month via selectFormFieldDropdown in ${fieldAid}`);
          break;
        }
      }
    }

    if (!dateFilled) {
      steps.push("workday-wizard: no date widget found on this page");
    }
  }

  await page.waitForTimeout(1000);
  steps.push(`workday-wizard: filled VD/signature (${genderFields.length} dropdowns, ${textFilled} text fields, checkboxes checked)`);
}

// ---------------------------------------------------------------------------
// Wizard driver
// ---------------------------------------------------------------------------

export async function runWorkdayWizard(args: WizardArgs): Promise<ApplyResult> {
  const { page, tenant, applicant, resumePath, steps, deadlineMs } = args;

  let lastStep = -1;
  let sameStepRetries = 0;

  for (let iter = 0; iter < MAX_WIZARD_ITERATIONS; iter++) {
    if (deadlineMs() <= 0) return { success: false, error: "workday-wizard-budget-exhausted", steps };

    const step = await detectStep(page);
    steps.push(`workday-wizard: at step ${step.current}/${step.total} url=${page.url()}`);

    if (step.current === -1) {
      return { success: false, error: "workday-wizard-progress-bar-not-found", steps };
    }

    // Auth gate detection: if the page URL still contains /login or
    // /createAccount, auth didn't complete. Also catch the Walmart-specific
    // pattern where step 1/6 is the sign-in page (wizard proper is 5 steps).
    const currentUrl = page.url();
    if (/\/(login|createAccount|signIn)\b/i.test(currentUrl)) {
      return { success: false, error: "workday-wizard-auth-incomplete", steps };
    }
    if (step.current === 1 && step.total > 5) {
      const hasAuthForm = await page.locator('[data-automation-id="createAccountSubmitButton"], [data-automation-id="signInSubmitButton"]')
        .first().isVisible({ timeout: 2000 }).catch(() => false);
      if (hasAuthForm) {
        return { success: false, error: "workday-wizard-auth-incomplete", steps };
      }
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
      // Workday redirects to /jobTasks/completed/application on success.
      const url = page.url();
      const bodyText = ((await page.evaluate(`document.body.innerText`).catch(() => "")) as string).slice(0, 1000);
      const success =
        /\/(completed|confirmation)\/application/i.test(url) ||
        /Job_Application_ID=/i.test(url) ||
        /application submitted|thank you|application received/i.test(bodyText);
      if (success) {
        steps.push("workday-wizard: ✓ submission confirmed");
        return { success: true, steps };
      }
      steps.push(`workday-wizard: post-submit url=${url} bodyExcerpt="${bodyText.slice(0, 200)}"`);
      return { success: false, error: "workday-wizard-submit-no-confirmation", steps };
    }

    const stepType = await detectStepType(page, step.current, step.total);
    steps.push(`workday-wizard: detected step type = ${stepType}`);
    if (stepType === "my-information") await fillMyInformation(page, applicant, tenant, steps);
    else if (stepType === "my-experience") await fillMyExperience(page, applicant, resumePath, steps);
    else if (stepType === "application-questions") await fillApplicationQuestions(page, tenant, steps);
    else if (stepType === "voluntary-disclosures") await fillVoluntaryDisclosures(page, applicant, steps);
    else if (stepType === "self-identify") await fillVoluntaryDisclosures(page, applicant, steps);
    else steps.push(`workday-wizard: unknown step type "${stepType}" at step ${step.current}, attempting Next`);

    const preClickStep = step.current;
    const advanced = await clickNextWithFallback(page, steps);
    if (!advanced) {
      const stuckErrors = (await page.evaluate(`(function(){
        var errs = document.querySelectorAll('[data-automation-id*="error"], [role="alert"], [class*="error" i]');
        return Array.from(errs).map(function(e){ return (e.innerText || e.textContent || '').trim(); }).filter(Boolean).join(' | ').slice(0, 300);
      })()`).catch(() => "") as string);
      if (stuckErrors) steps.push(`workday-wizard: stuck-step errors: ${stuckErrors}`);
      const diag = await dumpPageFields(page);
      steps.push(`workday-wizard: no-next-dump: ${diag}`);
      return { success: false, error: `workday-wizard-stuck-step-${step.current}`, steps };
    }

    // Check if we actually advanced to the next step
    const postClick = await detectStep(page);
    if (postClick.current === preClickStep) {
      const errors = (await page.evaluate(`(function(){
        var errs = document.querySelectorAll('[data-automation-id*="error"], [role="alert"], [class*="error" i]');
        return Array.from(errs).map(function(e){ return (e.innerText || e.textContent || '').trim(); }).filter(Boolean).join(' | ').slice(0, 300);
      })()`).catch(() => "") as string);
      if (errors) steps.push(`workday-wizard: validation errors: ${errors}`);
      const fieldDump = await dumpPageFields(page);
      steps.push(`workday-wizard: retry-dump: ${fieldDump}`);
    }

    if (postClick.current === lastStep) {
      sameStepRetries++;
      if (sameStepRetries >= 3) {
        const diag = await dumpPageFields(page);
        steps.push(`workday-wizard: stuck on step ${postClick.current} after ${sameStepRetries} retries`);
        steps.push(`workday-wizard: page-dump: ${diag}`);
        return { success: false, error: `workday-wizard-stuck-step-${postClick.current}`, steps };
      }
    } else {
      lastStep = postClick.current;
      sameStepRetries = 0;
    }
  }

  return { success: false, error: "workday-wizard-iteration-cap-hit", steps };
}
