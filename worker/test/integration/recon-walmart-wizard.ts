/**
 * Focused wizard-walking recon. Creates a Walmart account at a fresh email
 * (no DB persistence — single-shot), drives through the wizard with
 * field-fill attempts at each step, and dumps everything to JSON +
 * screenshots for hand inspection.
 *
 * Side effects:
 *   - One Walmart account at recon-{ts}@apply.theblackfemaleengineer.com
 *
 * Usage:
 *   cd worker
 *   npx tsx test/integration/recon-walmart-wizard.ts
 */

import { chromium, type Page, type Locator } from "playwright";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_EMAIL = `recon-${Date.now().toString(36)}@apply.theblackfemaleengineer.com`;
const PASSWORD = `Re${Date.now().toString(36)}!Cn8Aa#2`; // 16+ chars, classes covered

interface PageSnap {
  step: string;
  url: string;
  title: string;
  inputs: Array<Record<string, unknown>>;
  formFields: Array<{ aid: string; labelText: string }>;
  buttons: Array<{ aid: string | null; text: string }>;
  progressBarText: string;
}

async function snapshot(page: Page, step: string): Promise<PageSnap> {
  await page.waitForTimeout(2500);
  // Looser visibility check: only require the element to have rendered with
  // non-zero dimensions. Don't restrict to viewport — Workday's wizard has
  // many fields that scroll below the fold but are still real form fields.
  const data = await page.evaluate(`(function(){
    function rendered(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
    var inputs = Array.from(document.querySelectorAll('input, select, textarea')).filter(rendered).map(function(el) {
      return { tag: el.tagName.toLowerCase(), type: el.type, aid: el.getAttribute('data-automation-id'), aria: el.getAttribute('aria-label'), name: el.getAttribute('name'), placeholder: el.getAttribute('placeholder') };
    });
    var formFields = Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(rendered).map(function(el) {
      var aid = el.getAttribute('data-automation-id');
      var lbl = el.querySelector('label, [role="label"]');
      var labelText = lbl ? (lbl.innerText || lbl.textContent || '').trim() : '';
      // Fallback: grab the first text-bearing node at the top of the formField.
      if (!labelText) {
        var fullText = (el.innerText || el.textContent || '').trim();
        labelText = fullText.split('\\n')[0].trim().slice(0, 200);
      }
      var requiredMark = !!el.querySelector('abbr[aria-label="required"], abbr.css-1fc83zd, [aria-required="true"]');
      // Detect input/dropdown type for handler selection.
      var hasInput = !!el.querySelector('input[type="text"], textarea');
      var hasMultiselect = !!el.querySelector('[data-automation-id="multiSelectContainer"]');
      var hasRadio = !!el.querySelector('[role="radiogroup"], input[type="radio"]');
      var hasCheckbox = !!el.querySelector('input[type="checkbox"]');
      var hasSelect = !!el.querySelector('button[aria-haspopup], select');
      var kind = hasMultiselect ? 'multiselect'
               : hasRadio ? 'radio'
               : hasCheckbox ? 'checkbox'
               : hasSelect ? 'select'
               : hasInput ? 'text'
               : 'unknown';
      return { aid: aid, labelText: labelText, required: requiredMark, kind: kind };
    });
    var buttons = Array.from(document.querySelectorAll('button, [role="button"]')).filter(rendered).map(function(el) {
      return { aid: el.getAttribute('data-automation-id'), text: ((el.innerText || el.textContent) || '').trim().slice(0, 60) };
    });
    var bar = document.querySelector('[data-automation-id="progressBar"]') || document.querySelector('[role="progressbar"]');
    var progressBarText = bar ? (bar.innerText || bar.textContent || '').trim() : '';
    return { url: location.href, title: document.title, inputs: inputs, formFields: formFields, buttons: buttons, progressBarText: progressBarText };
  })()`) as Omit<PageSnap, "step">;
  return { step, ...data };
}

async function fetchOneInternUrl(): Promise<string | null> {
  const r = await fetch(
    "https://walmart.wd5.myworkdayjobs.com/wday/cxs/walmart/WalmartExternal/jobs",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: "intern" }) },
  );
  if (!r.ok) return null;
  const data = (await r.json()) as { jobPostings?: Array<{ title: string; externalPath: string }> };
  const j = (data.jobPostings ?? [])[0];
  if (!j) return null;
  return `https://walmart.wd5.myworkdayjobs.com/en-US/WalmartExternal${j.externalPath}`;
}

async function tryClick(loc: Locator, label: string): Promise<boolean> {
  try {
    if (await loc.isVisible({ timeout: 5000 }).catch(() => false)) {
      try {
        await loc.click({ timeout: 5000 });
      } catch {
        await loc.click({ force: true, timeout: 5000 }).catch(() => {});
      }
      console.log(`  click: ${label}`);
      return true;
    }
  } catch {}
  console.log(`  click MISS: ${label}`);
  return false;
}

async function typeIntoFormField(page: Page, formFieldAid: string, value: string, label?: string): Promise<boolean> {
  const sel = `[data-automation-id="${formFieldAid}"] input`;
  const loc = page.locator(sel).first();
  if (!(await loc.isVisible({ timeout: 3000 }).catch(() => false))) {
    console.log(`  type MISS: ${label ?? formFieldAid}`);
    return false;
  }
  await loc.click({ timeout: 3000 }).catch(() => {});
  // Slower delay (60ms) — at 20-25ms React's controlled inputs occasionally
  // drop the last char as onChange races with the next keystroke. Confirmed
  // by "Bere" → "Ber" truncation observed Apr 25.
  await loc.pressSequentially(value, { delay: 60 });
  // Verify the value actually landed; if not, retry once via fill().
  const got = await loc.inputValue().catch(() => "");
  if (got !== value) {
    console.log(`  type partial: ${label ?? formFieldAid} = "${got}" (wanted "${value}") — retrying via fill()`);
    await loc.fill(value).catch(() => {});
  }
  console.log(`  type ok: ${label ?? formFieldAid} = "${value.slice(0, 30)}"`);
  return true;
}

async function selectFormFieldDropdown(page: Page, formFieldAid: string, optionText: string, label?: string): Promise<boolean> {
  // Workday renders dropdowns in three flavors:
  //   (a) simple select   — button with text, options in popover
  //   (b) search dropdown — combobox/input you can type into to filter
  //   (c) multi-select    — same as search but supports multiple, dropdown stays open after click
  // Strategy: try clicking the most-likely trigger; if option doesn't appear,
  // type the optionText into any visible input inside the formField (search
  // pattern); always Tab/blur after to dismiss any stuck popover.
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
  if (!opened) {
    console.log(`  dropdown MISS (no trigger): ${label ?? formFieldAid}`);
    return false;
  }
  await page.waitForTimeout(500);

  // First attempt: option already visible after click.
  let opt = page.locator(`[role="option"]`).filter({ hasText: new RegExp(`^${escape(optionText)}`, "i") }).first();
  let visible = await opt.isVisible({ timeout: 1500 }).catch(() => false);

  // Second attempt: type the optionText into the formField's input to filter
  // (handles search-style dropdowns where options aren't pre-loaded).
  if (!visible) {
    const filterInput = page.locator(`[data-automation-id="${formFieldAid}"] input`).first();
    if (await filterInput.isVisible({ timeout: 1500 }).catch(() => false)) {
      await filterInput.click({ timeout: 1500 }).catch(() => {});
      await filterInput.pressSequentially(optionText, { delay: 30 }).catch(() => {});
      await page.waitForTimeout(800);
      opt = page.locator(`[role="option"]`).filter({ hasText: new RegExp(escape(optionText), "i") }).first();
      visible = await opt.isVisible({ timeout: 2000 }).catch(() => false);
    }
  }

  if (!visible) {
    console.log(`  dropdown option MISS: ${optionText} for ${label ?? formFieldAid}`);
    // Dismiss whatever popover we left open before returning.
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }
  await opt.click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(300);
  // Dismiss any stuck-open popover by pressing Tab on the page body.
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(200);
  console.log(`  dropdown ok: ${label ?? formFieldAid} -> ${optionText}`);
  return true;
}

function escape(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/**
 * Workday multiselect dropdown: input with placeholder="Search" inside
 * `[data-uxi-widget-type="multiselect"]`. Click the input to focus, options
 * appear, click one. If no preferred option text given, pick the first
 * non-"Other" option.
 */
async function selectMultiselect(page: Page, formFieldAid: string, preferText: string | undefined, label?: string): Promise<boolean> {
  // Workday multiselect: click the promptIcon SVG (right side) to open
  // the popover. The Search input alone doesn't always trigger it, and
  // clicking elsewhere may grab focus from a stale popover.
  // Dismiss any currently-open popover first so we don't read stale options.
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(200);
  await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(200);

  const icon = page.locator(`[data-automation-id="${formFieldAid}"] [data-automation-id="promptIcon"]`).first();
  if (await icon.isVisible({ timeout: 1500 }).catch(() => false)) {
    await icon.click({ timeout: 2000 }).catch(() => {});
  } else {
    const input = page.locator(`[data-automation-id="${formFieldAid}"] input`).first();
    if (await input.isVisible({ timeout: 1500 }).catch(() => false)) {
      await input.click({ timeout: 2000 }).catch(() => {});
    } else {
      console.log(`  multiselect MISS (no icon/input): ${label ?? formFieldAid}`);
      return false;
    }
  }
  await page.waitForTimeout(900);
  // Debug: snapshot the popover state.
  if (process.env.WORKDAY_DEBUG === "1") {
    await page.screenshot({ path: resolve(__dirname, `recon-multiselect-${formFieldAid}-${Date.now()}.png`), fullPage: true }).catch(() => {});
  }

  // List visible options. Critical exclusion: Workday reuses role="option"
  // for SELECTED PILLS inside `[data-automation-id="selectedItemList"]`.
  // Those are NOT dropdown options — they're already-selected items. We
  // explicitly filter them out via aid="selectedItem".
  const options = await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[role="option"]')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      var aid = el.getAttribute('data-automation-id') || '';
      if (aid === 'selectedItem') return false;
      // Also exclude items inside a selectedItemList container.
      if (el.closest('[data-automation-id="selectedItemList"]')) return false;
      return true;
    }).map(function(el){ return ((el.innerText || el.textContent) || '').trim().split('\\n')[0].slice(0,80); });
  })()`) as string[];
  if (options.length === 0) {
    console.log(`  multiselect MISS (no options): ${label ?? formFieldAid}`);
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }
  // Prefer the requested option, else first non-"Other".
  const pick = preferText && options.find((o) => new RegExp(`^${escape(preferText)}`, "i").test(o))
    || options.find((o) => o && !/^other$/i.test(o))
    || options[0];
  console.log(`  multiselect ${label ?? formFieldAid}: ${options.length} options, picking "${pick}"`);
  const opt = page.locator(`[role="option"]`).filter({ hasText: pick }).first();
  if (!(await opt.isVisible({ timeout: 1500 }).catch(() => false))) {
    console.log(`  multiselect option MISS: ${pick}`);
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }
  await opt.click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(700);

  // Hierarchical multiselect: Workday's "How Did You Hear About Us?" expands
  // submenus on click instead of selecting directly (each top-level option
  // has a `>` chevron). Detect by checking if a different set of options
  // appeared post-click. Drill in by picking the first sub-option.
  const subOptions = await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[role="option"]')).filter(function(el){
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      var aid = el.getAttribute('data-automation-id') || '';
      if (aid === 'selectedItem') return false;
      if (el.closest('[data-automation-id="selectedItemList"]')) return false;
      return true;
    }).map(function(el){ return ((el.innerText || el.textContent) || '').trim().split('\\n')[0].slice(0,80); });
  })()`) as string[];

  if (subOptions.length > 0 && !subOptions.includes(pick)) {
    console.log(`  multiselect drilled into submenu (${subOptions.length}): ${subOptions.slice(0, 4).join(", ")}...`);
    const subPick = subOptions.find((o) => o && !/^other$/i.test(o)) || subOptions[0];
    const subOpt = page.locator(`[role="option"]:not([data-automation-id="selectedItem"])`).filter({ hasText: subPick }).first();
    if (await subOpt.isVisible({ timeout: 1500 }).catch(() => false)) {
      await subOpt.click({ timeout: 2000 }).catch(() => {});
      console.log(`  multiselect sub-pick ok: ${subPick}`);
      await page.waitForTimeout(500);
    }
  }

  // Dismiss popover by clicking the heading.
  await page.locator("h1, h2").first().click({ force: true, timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(300);
  console.log(`  multiselect ok: ${label ?? formFieldAid} -> ${pick}`);
  return true;
}

/**
 * Fill all visible select-style fields on step 3 with a heuristic answer
 * keyed off the question text. Each select gets its own decision; defaults
 * to the first visible non-empty option if none of the patterns match.
 */
async function fillStep3Selects(page: Page): Promise<void> {
  const fieldAids = await page.evaluate(`(function(){
    return Array.from(document.querySelectorAll('[data-automation-id^="formField-"]')).filter(function(el){
      var r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && el.querySelector('button[aria-haspopup], select, [data-automation-id="multiSelectContainer"]');
    }).map(function(el){
      var aid = el.getAttribute('data-automation-id') || '';
      var text = (el.innerText || el.textContent || '').trim().slice(0, 200);
      return { aid: aid, text: text };
    });
  })()`) as Array<{ aid: string; text: string }>;

  console.log(`  step3: ${fieldAids.length} select fields detected`);

  function answerFor(question: string): string {
    const q = question.toLowerCase();
    if (/sponsorship|visa|h-?1b/.test(q)) return "No";
    if (/family member|spouse.*partner|partner.*spouse|relative.*walmart|walmart.*relative/.test(q)) return "No";
    if (/uniformed services|military.*spouse/.test(q)) return "No";
    if (/qualifications|legally able|authorized.*work|provide work auth|able to provide/.test(q)) return "Yes";
    // "Walmart Associate Status": Walmart's literal option for non-associates is
    // "Have never been an employee of Walmart Inc or any of its subsidiaries".
    // Match on "Have never been".
    if (/walmart associate|sam.s club|affiliation/.test(q)) return "Have never been";
    // Age category: Walmart's option is literally "18 years of age and Over".
    // Match on "18 years" (avoids 16-17 / Under 16).
    if (/age category|age range/.test(q)) return "18 years";
    // Mobile text: pick "Opt-Out" / "No" / "I do not wish".
    if (/mobile text|sms|text message/.test(q)) return "Opt-Out";
    if (/certify|certif/.test(q)) return "Yes";
    // Industry eligibility: questions about specific Walmart industry rules.
    // Default to "No" / "I am not eligible" / "I do not".
    if (/eligibility|industry/.test(q)) return "No";
    return "";  // empty → pick first visible option
  }

  for (const ff of fieldAids) {
    const preferText = answerFor(ff.text);
    const isMultiselect = await page.locator(`[data-automation-id="${ff.aid}"] [data-automation-id="multiSelectContainer"]`).count() > 0;
    if (isMultiselect) {
      await selectMultiselect(page, ff.aid, preferText || undefined, `step3:${ff.text.slice(0, 40)}`);
      continue;
    }
    // Plain select with button trigger
    const trigger = page.locator(`[data-automation-id="${ff.aid}"] button[aria-haspopup]`).first();
    if (!(await trigger.isVisible({ timeout: 1500 }).catch(() => false))) {
      console.log(`  step3 trigger MISS for: ${ff.text.slice(0, 40)}`);
      continue;
    }
    await trigger.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
    const opts = await page.evaluate(`(function(){
      return Array.from(document.querySelectorAll('[role="option"]')).filter(function(el){
        var r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return false;
        if (el.getAttribute('data-automation-id') === 'selectedItem') return false;
        if (el.closest('[data-automation-id="selectedItemList"]')) return false;
        return true;
      }).map(function(el){ return ((el.innerText || el.textContent) || '').trim().split('\\n')[0].slice(0,80); });
    })()`) as string[];
    if (opts.length === 0) {
      console.log(`  step3 no options for: ${ff.text.slice(0, 40)}`);
      await page.keyboard.press("Escape").catch(() => {});
      continue;
    }
    // Match anywhere (not just prefix) to handle variations like "I am not
    // currently a Walmart Associate" or "18-25 years old".
    let pick = preferText
      ? opts.find((o) => new RegExp(escape(preferText), "i").test(o))
      : undefined;
    pick = pick || opts.find((o) => o && !/select one/i.test(o)) || opts[0];
    console.log(`  step3 [${ff.text.slice(0, 35).replace(/\n/g, " ")}] options=${JSON.stringify(opts.slice(0, 8))} pick="${pick}"`);
    const opt = page.locator(`[role="option"]:not([data-automation-id="selectedItem"])`).filter({ hasText: pick }).first();
    if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) {
      await opt.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(200);
  }
}

async function clickNext(page: Page): Promise<boolean> {
  const sel = '[data-automation-id="pageFooterNextButton"]';
  const loc = page.locator(sel).first();
  if (!(await loc.isVisible({ timeout: 3000 }).catch(() => false))) {
    console.log("  Next MISS");
    return false;
  }
  try { await loc.click({ timeout: 5000 }); } catch { await loc.click({ force: true }).catch(() => {}); }
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  return true;
}

async function main() {
  const target = await fetchOneInternUrl();
  if (!target) { console.error("no URL"); process.exit(1); }
  console.log(`Target: ${target}`);
  console.log(`Email: ${APP_EMAIL}`);
  console.log(`Password: ${PASSWORD}\n`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  const snaps: PageSnap[] = [];

  try {
    await page.goto(target, { waitUntil: "networkidle", timeout: 30000 });
    snaps.push(await snapshot(page, "01-listing"));

    await tryClick(page.locator('[data-automation-id="adventureButton"]').first(), "Apply");
    await tryClick(page.locator('[data-automation-id="applyManually"]').first(), "Apply Manually");
    await page.waitForTimeout(1500);
    snaps.push(await snapshot(page, "02-create-account-form"));

    // Signup
    const emailEl = page.locator('[data-automation-id="email"]').first();
    await emailEl.click().catch(() => {});
    await emailEl.pressSequentially(APP_EMAIL, { delay: 25 });
    await page.locator('[data-automation-id="password"]').first().click().catch(() => {});
    await page.locator('[data-automation-id="password"]').first().pressSequentially(PASSWORD, { delay: 25 });
    await page.locator('[data-automation-id="verifyPassword"]').first().click().catch(() => {});
    await page.locator('[data-automation-id="verifyPassword"]').first().pressSequentially(PASSWORD, { delay: 25 });
    await page.locator('[data-automation-id="verifyPassword"]').first().press("Tab").catch(() => {});
    await page.waitForTimeout(1500);
    console.log("Signup form filled");
    await tryClick(page.locator('[data-automation-id="createAccountSubmitButton"]').first(), "Create Account submit");
    await page.waitForTimeout(4000);
    snaps.push(await snapshot(page, "03-after-signup"));

    // Capture step 1 fields and try filling them. Required (*) fields per recon:
    //   source, country, legalName--firstName, legalName--lastName, addressLine1,
    //   city, countryRegion, postalCode, phoneType, countryPhoneCode, phoneNumber.
    console.log("\n=== Wizard Step 1 fill attempts ===");
    // 'source' ("How Did You Hear About Us?") is a Workday multiselect search
    // dropdown — input with placeholder="Search" inside [data-uxi-widget-type=
    // "multiselect"]. Pattern: focus the input, options appear, click one.
    await selectMultiselect(page, "formField-source", undefined, "source");
    await selectFormFieldDropdown(page, "formField-country", "United States of America", "country");
    await typeIntoFormField(page, "formField-legalName--firstName", "Nyaradzo", "firstName");
    await typeIntoFormField(page, "formField-legalName--lastName", "Bere", "lastName");
    await typeIntoFormField(page, "formField-addressLine1", "1 Apply Lane", "address");
    await typeIntoFormField(page, "formField-city", "Denver", "city");
    await typeIntoFormField(page, "formField-postalCode", "80202", "postalCode");
    await selectFormFieldDropdown(page, "formField-countryRegion", "Colorado", "state");
    await selectFormFieldDropdown(page, "formField-phoneType", "Mobile", "phoneType");
    // Country phone code: try the actual format Workday displays (e.g. "United States of America (+1)").
    if (!(await selectFormFieldDropdown(page, "formField-countryPhoneCode", "United States of America", "countryPhoneCode"))) {
      // Some renderings use just "+1" or "United States" — try alt.
      await selectFormFieldDropdown(page, "formField-countryPhoneCode", "+1", "countryPhoneCode-alt");
    }
    await typeIntoFormField(page, "formField-phoneNumber", "7205550123", "phone");
    await page.waitForTimeout(1500);
    snaps.push(await snapshot(page, "04-after-step1-fill"));

    await page.screenshot({ path: resolve(__dirname, `recon-wizard-step1-filled-${Date.now()}.png`), fullPage: true }).catch(() => {});

    // Click Next, then dump step 2
    const advanced = await clickNext(page);
    if (!advanced) console.log("Could not advance from step 1");
    snaps.push(await snapshot(page, "05-after-step1-next"));

    await page.screenshot({ path: resolve(__dirname, `recon-wizard-step2-${Date.now()}.png`), fullPage: true }).catch(() => {});

    // Step 2 (My Experience): try advancing first (most fields are optional).
    // If that fails, fill what's needed.
    console.log("\n=== Wizard Step 2 (My Experience) ===");
    // Optional: fill LinkedIn URL — visible at bottom of page.
    const linkedinInput = page.locator(`label:has-text("LinkedIn") + input, [data-automation-id="formField-linkedin"] input, [aria-label*="LinkedIn" i]`).first();
    if (await linkedinInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await linkedinInput.click().catch(() => {});
      await linkedinInput.pressSequentially("https://linkedin.com/in/nyaradzobere", { delay: 30 });
      console.log("  LinkedIn filled");
    }
    await page.waitForTimeout(800);

    const step2Advanced = await clickNext(page);
    if (!step2Advanced) console.log("  Could not advance from step 2");
    snaps.push(await snapshot(page, "06-after-step2-next"));
    await page.screenshot({ path: resolve(__dirname, `recon-wizard-step3-${Date.now()}.png`), fullPage: true }).catch(() => {});

    // Step 3 (Application Questions): tenant-specific Y/N + select fields.
    // Heuristic answer policy:
    //  - Qualifications / authorized / eligible → Yes
    //  - Sponsorship / visa → No (test user is US citizen-shaped)
    //  - Family member / spouse-partner → No
    //  - Walmart associate / affiliation → "Not currently a Walmart associate" or first non-yes option
    //  - Age category → "18-25" or similar
    //  - Mobile text opt-in → No
    //  - Anything else → first visible option
    console.log("\n=== Wizard Step 3 (Application Questions) ===");
    await page.waitForTimeout(1500);
    await fillStep3Selects(page);
    await page.waitForTimeout(800);
    snaps.push(await snapshot(page, "06b-after-step3-fill"));
    await page.screenshot({ path: resolve(__dirname, `recon-wizard-step3-filled-${Date.now()}.png`), fullPage: true }).catch(() => {});

    const step3Advanced = await clickNext(page);
    if (!step3Advanced) console.log("  Could not advance from step 3");
    snaps.push(await snapshot(page, "07-after-step3-next"));
    await page.screenshot({ path: resolve(__dirname, `recon-wizard-step4-${Date.now()}.png`), fullPage: true }).catch(() => {});

    // Step 4 (Voluntary Disclosures): only the T&C checkbox is required.
    console.log("\n=== Wizard Step 4 (Voluntary Disclosures) ===");
    await page.waitForTimeout(1500);
    // Check the T&C checkbox.
    const tcCheckbox = page.locator(`input[type="checkbox"]`).first();
    if (await tcCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tcCheckbox.check({ timeout: 2000 }).catch(() => {});
      console.log("  T&C checkbox checked");
    }
    await page.waitForTimeout(500);
    const step4Advanced = await clickNext(page);
    if (!step4Advanced) console.log("  Could not advance from step 4");
    snaps.push(await snapshot(page, "08-after-step4-next"));
    await page.screenshot({ path: resolve(__dirname, `recon-wizard-step5-${Date.now()}.png`), fullPage: true }).catch(() => {});

    // Step 5 (Review) — actually submit the application. RECON_SUBMIT=1
    // gate prevents accidental submission during development.
    console.log("\n=== Wizard Step 5 (Review) ===");
    await page.waitForTimeout(1500);
    snaps.push(await snapshot(page, "09-review-page"));
    await page.screenshot({ path: resolve(__dirname, `recon-wizard-review-${Date.now()}.png`), fullPage: true }).catch(() => {});

    if (process.env.RECON_SUBMIT === "1") {
      console.log("\n=== Submitting application ===");
      // Workday's submit on Review is the same `pageFooterNextButton`
      // (button text becomes "Submit").
      const submitClicked = await clickNext(page);
      if (!submitClicked) console.log("  submit button not found");
      await page.waitForTimeout(5000);
      snaps.push(await snapshot(page, "10-after-submit"));
      await page.screenshot({ path: resolve(__dirname, `recon-wizard-after-submit-${Date.now()}.png`), fullPage: true }).catch(() => {});
      const finalUrl = page.url();
      const finalTitle = await page.title().catch(() => "");
      console.log(`  post-submit url: ${finalUrl}`);
      console.log(`  post-submit title: "${finalTitle}"`);
      // Look for confirmation text.
      const bodyText = await page.evaluate(`document.body.innerText`).catch(() => "") as string;
      if (/thank you|application received|submitted|application complete/i.test(bodyText)) {
        console.log("  ✓ SUBMISSION CONFIRMED via body text");
      } else {
        console.log("  ⚠ no clear submission-confirmation text found");
        console.log("  body excerpt:", bodyText.slice(0, 400));
      }
    } else {
      console.log("\n  (set RECON_SUBMIT=1 to actually submit)");
    }
  } catch (e) {
    console.error("Recon error:", e instanceof Error ? e.message : e);
  } finally {
    await ctx.close();
    await browser.close();
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = resolve(__dirname, `recon-walmart-wizard-${ts}.json`);
  writeFileSync(outPath, JSON.stringify({ email: APP_EMAIL, password: PASSWORD, snaps }, null, 2));
  console.log(`\nWrote ${outPath}`);

  for (const s of snaps) {
    console.log(`\n[${s.step}] ${s.url}`);
    console.log(`  title: "${s.title}" inputs=${s.inputs.length} formFields=${s.formFields.length}`);
    if (s.progressBarText) console.log(`  progress: ${s.progressBarText.slice(0, 100)}...`);
    if (s.formFields.length > 0) {
      console.log(`  formFields:`);
      for (const ff of s.formFields.slice(0, 25)) {
        console.log(`    ${ff.aid.padEnd(40)} :: "${ff.labelText.slice(0, 40)}"`);
      }
    }
  }
}

main().catch((e) => { console.error("crashed:", e); process.exit(1); });
