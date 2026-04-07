import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { waitForVerificationCode } from "./verification";
import { tailorResume, fetchJobDescription, canTailorResume, incrementTailorQuota } from "./tailor-resume";

const anthropic = new Anthropic();

let browser: Browser | null = null;

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
];

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Find the actual apply form URL from a job listing page.
 * Strategies:
 * 1. Check if current URL + "/apply" exists (Stripe pattern: /jobs/listing/.../apply)
 * 2. Look for external ATS links (Greenhouse, Lever, etc.)
 * 3. Look for same-site "Apply" links
 */
async function findATSApplyLink(page: Page): Promise<string | null> {
  const currentUrl = page.url();

  // Strategy 0: Known URL patterns — directly construct apply URL without parsing page
  // This is more reliable than page parsing for SPAs that haven't fully loaded
  if (/\/jobs\/listing\//.test(currentUrl) && !currentUrl.endsWith("/apply")) {
    return currentUrl.replace(/\/?$/, "/apply");
  }
  if (/\/careers\/positions\//.test(currentUrl) && !currentUrl.endsWith("/apply")) {
    return currentUrl.replace(/\/?$/, "/apply");
  }
  // Stripe-style: stripe.com/jobs/search?gh_jid=XXX → direct Greenhouse URL
  const ghJidMatch = currentUrl.match(/[?&]gh_jid=(\d+)/);
  if (ghJidMatch) {
    // Try to find the company's Greenhouse board from the page or construct a direct URL
    const ghJobId = ghJidMatch[1];
    // Look for a Greenhouse iframe or link on the page first
    for (const frame of page.frames()) {
      const frameUrl = frame.url();
      if (frameUrl.includes("greenhouse.io") && frameUrl.includes(ghJobId)) {
        return frameUrl.includes("/apply") ? frameUrl : frameUrl.replace(/\/?$/, "");
      }
    }
    // Fallback: construct board URL from page links
    const ghBoardUrl = await page.evaluate((jobId) => {
      const links = Array.from(document.querySelectorAll("a[href], iframe[src]"));
      for (const el of links) {
        const url = (el as HTMLAnchorElement).href || (el as HTMLIFrameElement).src || "";
        if (url.includes("greenhouse.io") && url.includes(jobId)) return url;
      }
      return null;
    }, ghJobId);
    if (ghBoardUrl) return ghBoardUrl;
  }

  // Strategy 1: Look for "Apply" links on the page
  const applyUrlSuffix = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a[href]"));
    for (const link of links) {
      const href = (link as HTMLAnchorElement).href;
      const text = (link.textContent || "").trim().toLowerCase();
      if ((text.includes("apply") || text.includes("submit")) && href.includes("/apply")) {
        return href;
      }
    }
    return null;
  });

  if (applyUrlSuffix) return applyUrlSuffix;

  // Strategy 2: Look for external ATS links
  const atsPatterns = [
    "greenhouse.io", "boards.greenhouse",
    "lever.co", "jobs.lever",
    "myworkdayjobs.com", "workday.com",
    "ashbyhq.com",
    "smartrecruiters.com",
    "icims.com",
    "jobvite.com",
  ];

  const atsLink = await page.evaluate((patterns) => {
    const links = Array.from(document.querySelectorAll("a[href]"));
    for (const link of links) {
      const href = (link as HTMLAnchorElement).href;
      const text = (link.textContent || "").trim().toLowerCase();
      const isATS = patterns.some((p: string) => href.includes(p));
      const isApply = text.includes("apply") || href.includes("apply") || href.includes("/application");
      if (isATS && isApply) return href;
    }
    for (const link of links) {
      const href = (link as HTMLAnchorElement).href;
      if (patterns.some((p: string) => href.includes(p)) && !href.includes("privacy") && !href.includes("terms")) {
        return href;
      }
    }
    return null;
  }, atsPatterns);

  return atsLink;
}

/**
 * Detect if the current page is a login/auth page.
 */
async function isLoginPage(page: Page): Promise<boolean> {
  const url = page.url().toLowerCase();
  const loginUrlPatterns = ["login", "signin", "sign-in", "sign_in", "auth/", "sso/", "oauth", "/session"];
  if (loginUrlPatterns.some((p) => url.includes(p))) return true;

  const pageText = await page.innerText("body").catch(() => "");
  const lower = pageText.toLowerCase().slice(0, 3000);
  const loginIndicators = ["sign in", "log in", "create an account", "enter your password", "forgot password", "don't have an account", "create account"];
  const matchCount = loginIndicators.filter((t) => lower.includes(t)).length;
  return matchCount >= 2;
}

/**
 * Detect the Applicant Tracking System from URL and page frames.
 */
function detectATS(url: string, page?: Page): string {
  if (url.includes("greenhouse.io") || url.includes("boards.greenhouse")) return "Greenhouse";
  if (url.includes("lever.co")) return "Lever";
  if (url.includes("myworkdayjobs.com") || url.includes("workday.com")) return "Workday";
  if (url.includes("ashbyhq.com")) return "Ashby";
  if (url.includes("smartrecruiters.com")) return "SmartRecruiters";
  if (url.includes("icims.com")) return "iCIMS";
  if (url.includes("jobvite.com")) return "Jobvite";
  // Check iframes — Greenhouse forms are often embedded in company pages
  if (page) {
    for (const frame of page.frames()) {
      const frameUrl = frame.url();
      if (frameUrl.includes("greenhouse.io") || frameUrl.includes("boards.greenhouse")) return "Greenhouse";
      if (frameUrl.includes("lever.co")) return "Lever";
      if (frameUrl.includes("ashbyhq.com")) return "Ashby";
    }
  }
  return "Unknown";
}

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    const headless = process.env.HEADLESS !== "false";
    browser = await chromium.launch({
      headless,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  }
  return browser;
}

export async function createStealthContext(): Promise<BrowserContext> {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent: randomUserAgent(),
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    timezoneId: "America/Denver",
  });

  // Use string-based init script to avoid esbuild __name injection
  await context.addInitScript(`
    Object.defineProperty(navigator, "webdriver", { get: function() { return undefined; } });
    Object.defineProperty(navigator, "plugins", { get: function() { return [1, 2, 3, 4, 5]; } });
    Object.defineProperty(navigator, "languages", { get: function() { return ["en-US", "en"]; } });
    window.chrome = { runtime: {} };
    // Polyfill __name for esbuild keepNames — tsx injects __name(fn, "name") wrappers
    // into page.evaluate callbacks, but __name only exists in Node.js, not the browser
    if (typeof globalThis.__name === "undefined") {
      globalThis.__name = function(fn) { return fn; };
    }
  `);

  return context;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

interface ApplicantData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredName?: string;
  pronouns?: string;
  usState?: string;
  workAuthorized?: boolean;
  needsSponsorship?: boolean;
  countryOfResidence?: string;
  willingToRelocate?: boolean;
  remotePreference?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  currentEmployer?: string;
  currentTitle?: string;
  school?: string;
  degree?: string;
  graduationYear?: string;
  additionalCerts?: string;
  city?: string;
  yearsOfExperience?: string;
  salaryExpectation?: string;
  earliestStartDate?: string;
  gender?: string;
  race?: string;
  hispanicOrLatino?: string;
  veteranStatus?: string;
  disabilityStatus?: string;
  applicationAnswers?: string;
  targetCompany?: string;
}

// --- Template generators for free-text answers ---

function generateWhyAnswer(applicant: ApplicantData): string {
  const title = applicant.currentTitle || "software engineer";
  const years = applicant.yearsOfExperience || "several";
  const employer = applicant.currentEmployer ? ` at ${applicant.currentEmployer}` : "";
  return `I'm a ${title} with ${years} years of experience${employer}. I'm excited about this opportunity to contribute my skills in building production systems at scale. I bring a strong track record of shipping high-quality software and collaborating cross-functionally.`;
}

function generateCoverLetter(applicant: ApplicantData): string {
  const whyText = generateWhyAnswer(applicant);
  const links = [
    applicant.websiteUrl ? `Portfolio: ${applicant.websiteUrl}` : null,
    applicant.githubUrl ? `GitHub: ${applicant.githubUrl}` : null,
    applicant.linkedinUrl ? `LinkedIn: ${applicant.linkedinUrl}` : null,
  ].filter(Boolean).join("\n");
  return `Dear Hiring Team,\n\n${whyText}\n\n${links}\n\nBest regards,\n${applicant.firstName} ${applicant.lastName}`;
}

export interface ApplyResult {
  success: boolean;
  error?: string;
  steps?: string[];
  tailored?: boolean;
  tailoredResumeUrl?: string;
}

// --- New role-based action interface (replaces CSS-selector-based AgentAction) ---

interface RoleAction {
  action: "click" | "fill" | "type_slowly" | "upload" | "check" | "select_dropdown" | "done" | "error";
  role?: string;
  name?: string;       // For select_dropdown: the combobox accessible name
  exact?: boolean;
  value?: string;       // For select_dropdown: the option to select
  reason: string;
  message?: string;
}

const MAX_STEPS = 25;
const APPLICATION_TIMEOUT_MS = 8 * 60 * 1000; // 8 minutes max per application

// ============================================================================
// FRAME HELPERS
// ============================================================================

import type { Frame, Locator } from "playwright";

async function withFrameFallback(
  page: Page,
  fn: (frame: Frame) => Promise<void>
): Promise<void> {
  let lastError = "";
  // Try main frame first
  try {
    await fn(page.mainFrame());
    return;
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
  }
  // Try child frames (Greenhouse forms live in iframes)
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    if (frame.url() === "about:blank" || frame.url() === "") continue;
    try {
      await fn(frame);
      return;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`Action failed on all frames: ${lastError}`);
}

function getGreenhouseFrame(page: Page): Frame | null {
  // If we're directly on greenhouse.io, the form is on the main frame
  const mainUrl = page.url();
  if (mainUrl.includes("greenhouse.io") || mainUrl.includes("boards.greenhouse")) {
    return page.mainFrame();
  }
  // Otherwise, look for Greenhouse in iframes
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    const url = frame.url();
    if (url.includes("greenhouse.io") || url.includes("boards.greenhouse")) return frame;
  }
  // Fallback: look for any non-blank iframe
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    if (frame.url() !== "about:blank" && frame.url() !== "") return frame;
  }
  return null;
}

/**
 * Wait for the Greenhouse iframe to load and have a non-empty accessibility tree.
 * Retries up to 5 times with 3s waits (15s total) before giving up.
 */
async function waitForGreenhouseFrame(page: Page): Promise<Frame | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const frame = getGreenhouseFrame(page);
    if (frame) {
      try {
        const snapshot = await frame.locator("body").ariaSnapshot({ timeout: 5000 });
        // Check that the snapshot has meaningful content (not just a loading spinner)
        if (snapshot && snapshot.length > 200) return frame;
      } catch {}
    }
    await page.waitForTimeout(3000);
  }
  // Return whatever we have, even if snapshot is short
  return getGreenhouseFrame(page);
}

// ============================================================================
// ROLE-BASED INTERACTION HELPERS
// ============================================================================

async function clickByRole(page: Page, role: string, name: string, exact?: boolean): Promise<void> {
  await withFrameFallback(page, async (frame) => {
    await frame.getByRole(role as any, { name, exact: exact ?? false }).first().click({ timeout: 5000 });
  });
}

async function fillByRole(page: Page, role: string, name: string, value: string, exact?: boolean): Promise<void> {
  await withFrameFallback(page, async (frame) => {
    await frame.getByRole(role as any, { name, exact: exact ?? false }).first().fill(value, { timeout: 5000 });
  });
}

async function typeSlowlyByRole(page: Page, role: string, name: string, value: string, exact?: boolean): Promise<void> {
  await withFrameFallback(page, async (frame) => {
    const locator = frame.getByRole(role as any, { name, exact: exact ?? false }).first();
    await locator.clear({ timeout: 5000 });
    await locator.pressSequentially(value, { delay: 80 });
  });
}

async function checkByRole(page: Page, name: string, exact?: boolean): Promise<void> {
  await withFrameFallback(page, async (frame) => {
    await frame.getByRole("checkbox", { name, exact: exact ?? false }).first().check({ timeout: 5000 });
  });
}

async function handleFileUpload(page: Page, resumePath: string): Promise<void> {
  // Try clicking "Attach" and catching the file chooser in each frame
  for (const frame of page.frames()) {
    if (frame.url() === "about:blank" || frame.url() === "") continue;
    try {
      const attachButton = frame.getByRole("button", { name: "Attach" }).first();
      if (!(await attachButton.isVisible({ timeout: 500 }).catch(() => false))) continue;
      const [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser", { timeout: 5000 }),
        attachButton.click({ timeout: 5000 }),
      ]);
      await fileChooser.setFiles(resumePath);
      return;
    } catch {}
  }
  // Fallback: find hidden file input and set directly
  for (const frame of page.frames()) {
    if (frame.url() === "about:blank" || frame.url() === "") continue;
    try {
      await frame.locator('input[type="file"]').first().setInputFiles(resumePath, { timeout: 5000 });
      return;
    } catch {}
  }
  throw new Error("Could not upload file");
}

// ============================================================================
// GREENHOUSE STATIC DROPDOWN HELPER
// ============================================================================

/**
 * Check if a Greenhouse dropdown still shows "Select..." (unset).
 * The DOM structure is: parent > generic("Select...") + combobox + toggle button
 */
async function isDropdownStillUnset(frame: Frame, combobox: Locator): Promise<boolean> {
  try {
    const parent = combobox.locator("xpath=ancestor::*[1]");
    const text = await parent.textContent({ timeout: 2000 });
    return !text || /Select\.\.\./i.test(text);
  } catch {
    return true;
  }
}

/**
 * Open the Greenhouse flyout dropdown for a given combobox.
 * Tries 3 strategies in order.
 */
async function openFlyout(frame: Frame, combobox: Locator): Promise<void> {
  // Strategy 1: Find the NEXT Toggle flyout button in document order and click it
  try {
    const toggle = combobox.locator('xpath=following::button[@aria-label="Toggle flyout"][1]');
    await toggle.click({ timeout: 3000 });
    return;
  } catch {}
  // Strategy 2: Click the combobox itself (works on many Greenhouse forms)
  try {
    await combobox.click({ timeout: 3000 });
    return;
  } catch {}
  // Strategy 3: Try finding toggle as a sibling in a shared parent container
  try {
    const parentToggle = combobox.locator('xpath=ancestor::*[position() <= 3]//button[@aria-label="Toggle flyout"]').first();
    await parentToggle.click({ timeout: 3000 });
    return;
  } catch {}
  throw new Error(`Could not open dropdown`);
}

/**
 * Keyboard fallback: type to filter the dropdown list, then ArrowDown + Enter.
 */
async function selectViaKeyboard(
  frame: Frame,
  combobox: Locator,
  optionName: string | RegExp
): Promise<void> {
  // Extract a short search string from the option pattern
  let searchStr: string;
  if (typeof optionName === "string") {
    searchStr = optionName;
  } else {
    // Strip regex metacharacters to get plain text
    searchStr = optionName.source
      .replace(/\\/g, "")
      .replace(/[\\^$.*+?()[\]{}|]/g, "")
      .split("|")[0]; // Take first alternative from patterns like "Yes|No"
  }
  searchStr = searchStr.slice(0, 8); // Keep it short for filtering

  // Open the flyout
  await openFlyout(frame, combobox);
  await frame.waitForTimeout(300);

  // Type to filter the options list
  await combobox.pressSequentially(searchStr, { delay: 50 });
  await frame.waitForTimeout(500);

  // Select first matching option via keyboard
  await frame.page().keyboard.press("ArrowDown");
  await frame.waitForTimeout(200);
  await frame.page().keyboard.press("Enter");
  await frame.waitForTimeout(300);

  // Blur to trigger validation
  await frame.locator("body").click({ position: { x: 1, y: 1 }, force: true }).catch(() => {});
  await frame.waitForTimeout(300);
}

async function selectStaticDropdown(
  frame: Frame,
  comboboxNamePattern: string | RegExp,
  optionName: string | RegExp
): Promise<void> {
  // Close any previously open flyouts first (prevents intercept issues)
  await frame.page().keyboard.press("Escape").catch(() => {});
  await frame.waitForTimeout(300);

  const combobox = frame.getByRole("combobox", { name: comboboxNamePattern }).first();

  // --- Attempt 1: Click-based selection (existing approach) ---
  await openFlyout(frame, combobox);
  await frame.waitForTimeout(1000);

  const useExact = typeof optionName === "string" && optionName.length <= 3;
  let clickSucceeded = false;
  try {
    await frame.getByRole("option", { name: optionName, exact: useExact }).first().click({ timeout: 5000 });
    clickSucceeded = true;
  } catch {
    // Close the flyout if option wasn't found
    await frame.page().keyboard.press("Escape").catch(() => {});
    await frame.waitForTimeout(300);
  }

  if (clickSucceeded) {
    // Blur to trigger validation
    await frame.locator("body").click({ position: { x: 1, y: 1 }, force: true }).catch(() => {});
    await frame.waitForTimeout(500);

    // Verify the selection registered in React state
    if (!(await isDropdownStillUnset(frame, combobox))) {
      return; // Success — value registered
    }
    // Click appeared to work but value didn't register in React state — fall through to keyboard
  }

  // --- Attempt 2: Keyboard-based selection (fallback) ---
  // Close any residual state
  await frame.page().keyboard.press("Escape").catch(() => {});
  await frame.waitForTimeout(300);

  // Clear any text that might be in the combobox from failed attempt
  await combobox.fill("").catch(() => {});
  await frame.waitForTimeout(200);

  await selectViaKeyboard(frame, combobox, optionName);

  // Verify again
  if (await isDropdownStillUnset(frame, combobox)) {
    throw new Error(`Option "${String(optionName)}" not found in dropdown "${String(comboboxNamePattern)}" (click + keyboard both failed)`);
  }
}

async function selectStaticDropdownSafe(
  frame: Frame,
  comboboxNamePattern: string | RegExp,
  optionName: string | RegExp,
  steps: string[]
): Promise<void> {
  try {
    const combobox = frame.getByRole("combobox", { name: comboboxNamePattern }).first();
    if (!(await combobox.isVisible({ timeout: 500 }).catch(() => false))) {
      return; // Field not present on this form — skip silently
    }
    await selectStaticDropdown(frame, comboboxNamePattern, optionName);
    steps.push(`Selected dropdown ${String(comboboxNamePattern)}: ${String(optionName)}`);
  } catch (e) {
    steps.push(`Dropdown failed ${String(comboboxNamePattern)}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ============================================================================
// VERIFICATION CODE HELPERS
// ============================================================================

async function checkThankYou(frame: Frame, page: Page): Promise<boolean> {
  // Check for various confirmation text patterns across frame and main page
  const patterns = [/thank you/i, /thanks for applying/i, /application.*received/i, /application.*submitted/i, /successfully.*submitted/i, /application complete/i, /we received your/i, /apply.*again/i, /your information has been/i];
  for (const pattern of patterns) {
    const frameCheck = await frame.getByText(pattern).first()
      .isVisible({ timeout: 500 }).catch(() => false);
    if (frameCheck) return true;
  }
  for (const pattern of patterns) {
    const mainCheck = await page.getByText(pattern).first()
      .isVisible({ timeout: 1000 }).catch(() => false);
    if (mainCheck) return true;
  }
  return false;
}

async function handleVerificationCode(
  frame: Frame,
  page: Page,
  applicant: ApplicantData,
  steps: string[]
): Promise<ApplyResult | null> {
  steps.push("Verification code required — waiting for email...");

  const code = await waitForVerificationCode(applicant.email);
  if (!code) {
    return { success: false, error: "Verification code not received within timeout", steps };
  }

  steps.push(`Got verification code: ${code.slice(0, 2)}******`);

  // Fill the 8 individual code textboxes
  try {
    // Greenhouse renders 8 textboxes inside a group with "verification code" in its name
    // Structure: group → textbox "Security code" + 7 unnamed textboxes
    const verificationGroup = frame.getByRole("group").filter({
      hasText: /verification code/i,
    }).first();

    const codeChars = code.split("");

    // Try filling via the group's input elements
    const inputs = verificationGroup.locator("input");
    const inputCount = await inputs.count().catch(() => 0);

    if (inputCount >= 8) {
      for (let i = 0; i < Math.min(codeChars.length, inputCount); i++) {
        await inputs.nth(i).fill(codeChars[i], { timeout: 3000 });
      }
      steps.push("Filled verification code textboxes");
    } else {
      // Fallback: find all textboxes in the verification area
      const allTextboxes = verificationGroup.getByRole("textbox");
      const tbCount = await allTextboxes.count().catch(() => 0);
      if (tbCount >= 8) {
        for (let i = 0; i < Math.min(codeChars.length, tbCount); i++) {
          await allTextboxes.nth(i).fill(codeChars[i], { timeout: 3000 });
        }
        steps.push("Filled verification code textboxes (via role)");
      } else {
        // Last fallback: type the full code into the first "Security code" textbox
        const securityInput = frame.getByRole("textbox", { name: /security code/i }).first();
        await securityInput.fill(code, { timeout: 3000 });
        steps.push("Filled single security code input");
      }
    }

    await frame.waitForTimeout(2000);

    // Click Submit (should now be enabled)
    const submitButton = frame.getByRole("button", { name: /Submit application/i }).first();
    const isEnabled = await submitButton.isEnabled({ timeout: 5000 }).catch(() => false);
    if (!isEnabled) {
      steps.push("Submit still disabled after entering code");
      return { success: false, error: "Submit button still disabled after verification code entry", steps };
    }

    const urlBefore = page.url();
    await submitButton.click({ timeout: 5000 });
    steps.push("Clicked Submit after verification code");
    await page.waitForTimeout(5000);

    if (await checkThankYou(frame, page)) {
      steps.push("Application submitted successfully after verification");
      return { success: true, steps };
    }

    // Also check: if the URL changed or the submit button disappeared, submission likely succeeded
    const urlAfter = page.url();
    const submitStillVisible = await frame.getByRole("button", { name: /Submit application/i }).first()
      .isVisible({ timeout: 500 }).catch(() => false);
    if (urlAfter !== urlBefore || !submitStillVisible) {
      steps.push("Application likely submitted (URL changed or submit button gone)");
      return { success: true, steps };
    }

    // One more check: look for confirmation text on the MAIN page (not frame)
    const mainText = await page.locator("body").innerText().catch(() => "");
    if (/thank|submitted|received|applied|application complete/i.test(mainText.slice(0, 2000))) {
      steps.push("Application submitted (confirmation text on main page)");
      return { success: true, steps };
    }

    steps.push("Thank you page not found after verification submit");
    return { success: false, error: "Submission failed after entering verification code", steps };
  } catch (e) {
    steps.push(`Verification code entry failed: ${e instanceof Error ? e.message : String(e)}`);
    return { success: false, error: "Failed to enter verification code", steps };
  }
}

// ============================================================================
// GREENHOUSE DETERMINISTIC HANDLER
// ============================================================================

async function greenhouseDeterministicFill(
  page: Page,
  applicant: ApplicantData,
  resumePath: string,
  targetRole?: string
): Promise<ApplyResult> {
  const steps: string[] = [];
  const frame = getGreenhouseFrame(page);

  if (!frame) {
    return { success: false, error: "Greenhouse iframe not found", steps };
  }

  // Wait for the form to load
  try {
    await frame.getByRole("heading", { name: /Apply for this job/i }).waitFor({ timeout: 10000 });
    steps.push("Greenhouse form loaded");
  } catch {
    steps.push("Form heading not found — trying anyway");
  }

  // Phase 1: Plain text fields
  const textFields = [
    { name: "First Name", value: applicant.firstName },
    { name: "Last Name", value: applicant.lastName },
    { name: "Email", value: applicant.email },
    { name: /^Phone$/i, value: applicant.phone },
  ];

  for (const field of textFields) {
    try {
      const textbox = frame.getByRole("textbox", { name: field.name }).first();
      if (await textbox.isVisible({ timeout: 500 }).catch(() => false)) {
        await textbox.fill(field.value);
        steps.push(`Filled ${String(field.name)}: ${field.value.slice(0, 20)}`);
      }
    } catch {
      steps.push(`Skipped text field: ${String(field.name)}`);
    }
  }

  // Phase 2: Location autocomplete
  try {
    const locationCombobox = frame.getByRole("combobox", { name: /Location/i }).first();
    if (await locationCombobox.isVisible({ timeout: 500 }).catch(() => false)) {
      await locationCombobox.clear();
      const citySearch = applicant.city || "Denver";
      await locationCombobox.pressSequentially(citySearch, { delay: 80 });
      await frame.waitForTimeout(1500);
      const option = frame.getByRole("option", { name: new RegExp(citySearch, "i") }).first();
      if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
        await option.click({ timeout: 5000 });
        steps.push(`Selected location: ${citySearch}`);
      } else {
        steps.push("Location options did not appear");
      }
    }
  } catch (e) {
    steps.push(`Location field failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Phase 2b: "Current Location" autocomplete (Intercom, Abnormal Security)
  try {
    const currentLocCombobox = frame.getByRole("combobox", { name: /Current Location/i }).first();
    if (await currentLocCombobox.isVisible({ timeout: 500 }).catch(() => false)) {
      await currentLocCombobox.clear();
      const citySearch = applicant.city || "Denver";
      await currentLocCombobox.pressSequentially(citySearch, { delay: 80 });
      await frame.waitForTimeout(1500);
      const option = frame.getByRole("option", { name: new RegExp(citySearch, "i") }).first();
      if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
        await option.click({ timeout: 5000 });
        steps.push(`Selected current location: ${citySearch}`);
      }
    }
  } catch {}

  // Phase 3: Resume upload
  try {
    const attachButton = frame.getByRole("button", { name: "Attach" }).first();
    if (await attachButton.isVisible({ timeout: 500 }).catch(() => false)) {
      const [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser", { timeout: 5000 }),
        attachButton.click(),
      ]);
      await fileChooser.setFiles(resumePath);
      await frame.waitForTimeout(1000);
      steps.push("Uploaded resume");
    }
  } catch (e) {
    steps.push(`Resume upload failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Phase 3b: Cover letter (if required — some forms have this)
  try {
    const coverLetterGroup = frame.getByRole("group").filter({
      hasText: /cover letter/i,
    }).first();
    if (await coverLetterGroup.isVisible({ timeout: 500 }).catch(() => false)) {
      // Check if it has "Enter manually" button — use that to type a cover letter
      const enterManually = coverLetterGroup.getByRole("button", { name: /Enter manually/i }).first();
      if (await enterManually.isVisible({ timeout: 1000 }).catch(() => false)) {
        await enterManually.click({ timeout: 3000 });
        await frame.waitForTimeout(500);
        // Find the textarea that appears
        const textarea = coverLetterGroup.locator("textarea").first();
        if (await textarea.isVisible({ timeout: 500 }).catch(() => false)) {
          const coverText = generateCoverLetter(applicant);
          await textarea.fill(coverText);
          steps.push("Filled cover letter (text)");
        }
      } else {
        // Fallback: upload resume as cover letter
        const attachBtn = coverLetterGroup.getByRole("button", { name: "Attach" }).first();
        if (await attachBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          const [fc] = await Promise.all([
            page.waitForEvent("filechooser", { timeout: 5000 }),
            attachBtn.click(),
          ]);
          await fc.setFiles(resumePath);
          steps.push("Uploaded resume as cover letter");
        }
      }
    }
  } catch (e) {
    steps.push(`Cover letter handling failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Phase 3c: Phone country code (do this BEFORE employment to avoid Toggle flyout conflicts)
  try {
    const phoneGroup = frame.getByRole("group", { name: /Phone/i }).first();
    if (await phoneGroup.isVisible({ timeout: 500 }).catch(() => false)) {
      // Only set if not already set (check if "+1" is already showing)
      const alreadySet = await phoneGroup.getByText("+1").isVisible({ timeout: 1000 }).catch(() => false);
      if (!alreadySet) {
        const toggle = phoneGroup.getByRole("button", { name: "Toggle flyout" }).first();
        await toggle.click({ timeout: 5000 });
        await frame.waitForTimeout(500);
        await frame.getByRole("option", { name: /United States \+1/i }).first().click({ timeout: 5000 });
        steps.push("Set phone country code: US +1");
      } else {
        steps.push("Phone country already set to US +1");
      }
    }
  } catch {
    steps.push("Phone country code failed");
  }

  // Phase 4: Employment history (Coinbase-style — some forms have this section)
  try {
    const companyNameField = frame.getByRole("textbox", { name: /Company name/i }).first();
    if (await companyNameField.isVisible({ timeout: 500 }).catch(() => false)) {
      await companyNameField.fill(applicant.currentEmployer || "");
      steps.push("Filled employment: Company name");

      // Title
      const titleField = frame.getByRole("textbox", { name: "Title" }).first();
      if (await titleField.isVisible({ timeout: 1000 }).catch(() => false)) {
        await titleField.fill(applicant.currentTitle || "");
        steps.push("Filled employment: Title");
      }

      // Start date month dropdown
      await selectStaticDropdownSafe(frame, /Start date month/i, "January", steps);

      // Start date year
      const startYear = frame.getByRole("textbox", { name: /Start date year/i }).first();
      if (await startYear.isVisible({ timeout: 1000 }).catch(() => false)) {
        await startYear.fill("2023");
        steps.push("Filled employment: Start year");
      }

      // Check "Current role" checkbox if available
      try {
        const currentRole = frame.getByRole("checkbox", { name: /Current role/i }).first();
        if (await currentRole.isVisible({ timeout: 1000 }).catch(() => false)) {
          await currentRole.check();
          steps.push("Checked Current role");
        }
      } catch {}
    }
  } catch (e) {
    steps.push(`Employment section failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Phase 4b: Education section (School/Degree/Discipline as comboboxes)
  try {
    const schoolCombobox = frame.getByRole("combobox", { name: /^School$/i }).first();
    if (await schoolCombobox.isVisible({ timeout: 500 }).catch(() => false)) {
      // School is a combobox — try autocomplete first (type slowly to filter)
      await schoolCombobox.clear();
      const schoolSearch = applicant.school || "University";
      await schoolCombobox.pressSequentially(schoolSearch, { delay: 80 });
      await frame.waitForTimeout(1500);
      const schoolOption = frame.getByRole("option", { name: new RegExp(schoolSearch.split(" ")[0], "i") }).first();
      if (await schoolOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await schoolOption.click({ timeout: 5000 });
        steps.push("Selected school (autocomplete)");
      } else {
        // Fallback: try as static dropdown (DoorDash pattern)
        try {
          await selectStaticDropdown(frame, /^School$/i, /Colorado/i);
          steps.push("Selected school (static dropdown)");
        } catch {
          steps.push("School options did not appear");
        }
      }

      // Degree dropdown
      await selectStaticDropdownSafe(frame, /^Degree$/i, /Bachelor/i, steps);

      // Discipline dropdown
      await selectStaticDropdownSafe(frame, /Discipline/i, /Business/i, steps);

      // End date year (some forms have this)
      try {
        const endYear = frame.getByRole("textbox", { name: /End date year/i }).first();
        if (await endYear.isVisible({ timeout: 1000 }).catch(() => false)) {
          await endYear.fill("2017");
          steps.push("Filled education: End year");
        }
      } catch {}
    }
  } catch (e) {
    steps.push(`Education section failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Phase 4c: LinkedIn URL and Website/Portfolio
  try {
    const linkedinField = frame.getByRole("textbox", { name: /LinkedIn/i }).first();
    if (await linkedinField.isVisible({ timeout: 500 }).catch(() => false)) {
      await linkedinField.fill(applicant.linkedinUrl || "");
      steps.push("Filled LinkedIn URL");
    }
  } catch {}
  try {
    const websiteField = frame.getByRole("textbox", { name: /website|portfolio|github/i }).first();
    if (await websiteField.isVisible({ timeout: 500 }).catch(() => false)) {
      await websiteField.fill(applicant.websiteUrl || "");
      steps.push("Filled website/portfolio");
    }
  } catch {}

  // Phase 5: Static dropdowns — try all common patterns across different Greenhouse forms
  // Stripe-style fields
  await selectStaticDropdownSafe(frame, /country.*reside/i, /^US$|United States/i, steps);
  await selectStaticDropdownSafe(frame, /remote/i, /Yes.*remote/i, steps);
  await selectStaticDropdownSafe(frame, /WhatsApp/i, /^No/i, steps);

  // Pronouns (Figma, Sigma Computing, etc.)
  const pronounPattern = applicant.pronouns
    ? new RegExp(applicant.pronouns.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").split("/")[0], "i")
    : /She/i;
  await selectStaticDropdownSafe(frame, /pronoun/i, pronounPattern, steps);

  // Common fields (Stripe, Coinbase, Figma, etc.)
  // Use applicant's actual work authorization and sponsorship answers
  // Work auth options vary: "Yes"/"No", or long-form like "I am authorised to work..."
  const workAuthYes = /^Yes|I am authori[sz]ed|currently.*legally.*authori[sz]ed|citizen.*permanent/i;
  const workAuthNo = /^No|not.*authori[sz]ed|require.*sponsor|unknown/i;
  const workAuthPattern = applicant.workAuthorized === false ? workAuthNo : workAuthYes;
  const sponsorYes = /^Yes|require.*sponsor|need.*sponsor|will require/i;
  const sponsorNo = /^No|not.*require|do not need|don.*need/i;
  const sponsorPattern = applicant.needsSponsorship === true ? sponsorYes : sponsorNo;
  await selectStaticDropdownSafe(frame, /authori[sz]ed to work/i, workAuthPattern, steps);
  await selectStaticDropdownSafe(frame, /legally authori[sz]ed/i, workAuthPattern, steps);
  await selectStaticDropdownSafe(frame, /require.*sponsor/i, sponsorPattern, steps);
  await selectStaticDropdownSafe(frame, /now or in the future require/i, sponsorPattern, steps);
  await selectStaticDropdownSafe(frame, /visa.*sponsor/i, sponsorPattern, steps);
  await selectStaticDropdownSafe(frame, /need sponsorship.*visa/i, sponsorPattern, steps);
  await selectStaticDropdownSafe(frame, /require.*immigration.*sponsor/i, sponsorPattern, steps);
  await selectStaticDropdownSafe(frame, /future require.*immigration/i, sponsorPattern, steps);
  await selectStaticDropdownSafe(frame, /currently or have you previously worked/i, /^No/i, steps);
  await selectStaticDropdownSafe(frame, /employed by|worked for|worked at/i, /^No/i, steps);
  await selectStaticDropdownSafe(frame, /previously.*employed/i, /No|have not|never/i, steps);
  await selectStaticDropdownSafe(frame, /ever worked for/i, /^No/i, steps);
  await selectStaticDropdownSafe(frame, /have you worked at/i, /^No/i, steps);
  await selectStaticDropdownSafe(frame, /previously been employed/i, /have not|No|never/i, steps);

  // Sanctions / export control (Twilio, Databricks, etc.)
  await selectStaticDropdownSafe(frame, /Cuba.*Iran|Iran.*Cuba|citizen.*resident.*countries|sanctioned|denied.*parties/i, /^No/i, steps);

  // Privacy / consent acknowledgements as dropdowns (DoorDash, etc.)
  await selectStaticDropdownSafe(frame, /applicant.*privacy.*acknowledg|privacy.*acknowledg/i, /confirm|acknowledge|read.*understood|I have read/i, steps);
  await selectStaticDropdownSafe(frame, /Global Data Privacy/i, /confirm/i, steps);

  // SMS/WhatsApp contact preference (DoorDash)
  await selectStaticDropdownSafe(frame, /contact.*via.*SMS|SMS.*WhatsApp.*updates|WhatsApp.*provide updates/i, /^Yes/i, steps);

  // In-person / office / hybrid commitment (Anthropic, Glean, etc.)
  await selectStaticDropdownSafe(frame, /open to working in.person|commit.*hybrid|willing.*commit.*hybrid/i, /^Yes/i, steps);

  // AI Policy acknowledgement (Anthropic, etc.)
  await selectStaticDropdownSafe(frame, /AI Policy/i, /^Yes/i, steps);

  // Open to relocation (Anthropic, etc.)
  await selectStaticDropdownSafe(frame, /open to relocation/i, /^Yes/i, steps);

  // Interviewed / applied before (Anthropic, etc.)
  await selectStaticDropdownSafe(frame, /interviewed.*before|previously.*interview|applied.*before/i, /^No/i, steps);

  // Engineering blog influence (DoorDash)
  await selectStaticDropdownSafe(frame, /engineering blog.*influence|blog.*decision/i, /Not at all|Did not|No influence|None/i, steps);

  // Coinbase-specific fields
  await selectStaticDropdownSafe(frame, /at least 18/i, /^Yes/i, steps);
  await selectStaticDropdownSafe(frame, /how did you hear/i, /LinkedIn/i, steps);
  await selectStaticDropdownSafe(frame, /hear about this opportunity/i, /LinkedIn/i, steps);
  await selectStaticDropdownSafe(frame, /understand.*AI tools/i, /agree|acknowledge|confirm|yes/i, steps);
  await selectStaticDropdownSafe(frame, /how you use AI/i, /regularly/i, steps);
  await selectStaticDropdownSafe(frame, /government official/i, /No/i, steps);
  await selectStaticDropdownSafe(frame, /close relative.*government/i, /No/i, steps);
  await selectStaticDropdownSafe(frame, /conflict of interest/i, /No/i, steps);
  await selectStaticDropdownSafe(frame, /referred.*senior leader/i, /No/i, steps);

  // Figma-specific dropdowns
  const yoePattern = new RegExp(applicant.yearsOfExperience || "5", "i");
  await selectStaticDropdownSafe(frame, /years of professional experience/i, yoePattern, steps);
  await selectStaticDropdownSafe(frame, /full-time software engineer.*professional/i, /Yes/i, steps);
  await selectStaticDropdownSafe(frame, /user-facing web applications/i, /Yes/i, steps);
  await selectStaticDropdownSafe(frame, /primary technical expertise/i, /Full/i, steps);
  await selectStaticDropdownSafe(frame, /programming languages.*regularly/i, /Python/i, steps);

  // Catch-all: Any remaining "Do you require" / "Will you require" sponsorship pattern
  await selectStaticDropdownSafe(frame, /do you require.*sponsor/i, sponsorPattern, steps);
  await selectStaticDropdownSafe(frame, /will you.*require.*sponsor/i, sponsorPattern, steps);

  // Hybrid / in-person / office (Intercom uses "3 days per week", others use different wording)
  await selectStaticDropdownSafe(frame, /hybrid.*model.*willing|willing.*work.*office.*days|work.*office.*3 days/i, /^Yes/i, steps);
  // "Are you willing to relocate?" (Intercom, Abnormal)
  await selectStaticDropdownSafe(frame, /willing to relocate/i, /^Yes/i, steps);
  // Previously worked for this company (Intercom: "Have you previously worked for Intercom?")
  await selectStaticDropdownSafe(frame, /previously worked for/i, /^No/i, steps);
  // Email about future openings
  await selectStaticDropdownSafe(frame, /email.*about future|future.*openings/i, /^Yes/i, steps);
  // Office / in-person / relocation / onsite (Cloudflare, Discord, Alchemy, Materialize, etc.)
  await selectStaticDropdownSafe(frame, /able to work at.*office|work.*in.*office.*days/i, /^Yes/i, steps);
  await selectStaticDropdownSafe(frame, /currently located in the US|currently located in the United States/i, /^Yes/i, steps);
  await selectStaticDropdownSafe(frame, /based in or willing to relocate/i, /^Yes/i, steps);
  await selectStaticDropdownSafe(frame, /work onsite|willing.*onsite|able.*onsite/i, /^Yes/i, steps);
  await selectStaticDropdownSafe(frame, /work.*from.*office|onsite.*office/i, /^Yes/i, steps);

  // Country of residence (broad — GitLab uses "current country of residence")
  await selectStaticDropdownSafe(frame, /country of residence/i, /^US$|United States/i, steps);

  // AI consent (ClickHouse, etc.)
  await selectStaticDropdownSafe(frame, /consent.*use of AI|consenting.*AI.*evaluat|AI.*candidacy/i, /^Yes/i, steps);
  // Generic "By selecting" consent dropdowns (Reddit, etc.)
  await selectStaticDropdownSafe(frame, /By selecting/i, /Yes|agree|acknowledge|confirm/i, steps);
  // Privacy policy / candidate privacy (Starburst, Iterable, Vercel, etc.)
  await selectStaticDropdownSafe(frame, /privacy.*policy|privacy.*notice|candidate.*privacy/i, /^Yes|I have read|I acknowledge|I agree|confirm/i, steps);
  // "Note from" / general notices (Iterable)
  await selectStaticDropdownSafe(frame, /Note from/i, /^Yes|I have read|I acknowledge|I agree|confirm/i, steps);
  // Interview recording consent (Earnin, etc.)
  await selectStaticDropdownSafe(frame, /interview.*recorded|recording/i, /^Yes|I agree|I acknowledge|I consent/i, steps);
  // "Previously applied" / "Previously interviewed" (Earnin, Rocket Lab, etc.)
  await selectStaticDropdownSafe(frame, /previously.*applied|previously.*interviewed|have you.*applied/i, /^No/i, steps);
  // Technical experience yes/no (Alchemy: "written code deployed to production")
  await selectStaticDropdownSafe(frame, /written code.*production|deployed.*production|code.*deployed/i, /^Yes/i, steps);
  // "Double check" / "verify information" consent (Vercel)
  await selectStaticDropdownSafe(frame, /double.check|verify.*information|ensure.*accuracy/i, /^Yes|I confirm|I acknowledge/i, steps);
  // "Used our product before" (Tailscale, etc.)
  await selectStaticDropdownSafe(frame, /used.*before|familiar.*product/i, /^Yes|No|Some/i, steps);
  // Background check consent (Rocket Lab, etc.)
  await selectStaticDropdownSafe(frame, /background check|criminal.*background|contingent.*background/i, /^Yes|I agree|I acknowledge/i, steps);
  // Meet required qualifications (Rocket Lab)
  await selectStaticDropdownSafe(frame, /meet.*required.*qualifications|meet.*qualifications/i, /^Yes/i, steps);
  // Government employment (Rocket Lab)
  await selectStaticDropdownSafe(frame, /employed.*government|government.*capacity/i, /^No/i, steps);
  // Location/work intent (Starburst)
  await selectStaticDropdownSafe(frame, /location.*intend.*work|intend.*work.*out of/i, /Remote|US|United States/i, steps);

  // Employment agreements / restrictions (GitLab)
  await selectStaticDropdownSafe(frame, /subject to.*employment agreements|post-employment restrictions/i, /^No/i, steps);

  // Located in specific locations (GitLab — "Are you located in one of the following...")
  await selectStaticDropdownSafe(frame, /located in.*following|located in one of/i, /^Yes/i, steps);

  // BrightHire consent (Stripe)
  await selectStaticDropdownSafe(frame, /BrightHire/i, /Yes|I consent|I agree|confirm/i, steps);
  // Certification acknowledgment (Datadog)
  await selectStaticDropdownSafe(frame, /certification|certified/i, /^Yes|I confirm|I certify/i, steps);
  // Location eligibility (Airtable — "Are you eligible to work in this location?")
  await selectStaticDropdownSafe(frame, /eligible.*work.*location|location.*eligib/i, /^Yes/i, steps);
  // Highest degree / education level (Twilio variant label)
  await selectStaticDropdownSafe(frame, /highest.*degree|level.*education|education.*level/i, /Bachelor/i, steps);
  // Start date month (broader pattern for Stripe/Coinbase employment sections)
  await selectStaticDropdownSafe(frame, /start.*month|month.*start/i, /January|February|March|April|May|June|July|August|September|October|November|December/i, steps);
  // Self-identification acknowledgment (Stripe)
  await selectStaticDropdownSafe(frame, /self.identification|voluntary.*self/i, /acknowledge|I acknowledge|Yes/i, steps);
  // "Are you currently based in" / location-based eligibility (Airtable, Stripe)
  await selectStaticDropdownSafe(frame, /currently based in|based in.*or willing/i, /^Yes/i, steps);

  // Technical experience yes/no questions (ZipRecruiter, etc.)
  await selectStaticDropdownSafe(frame, /experience with.*big data|experience with.*Hadoop|experience with.*Spark/i, /^Yes/i, steps);
  await selectStaticDropdownSafe(frame, /experience with.*containerization|experience with.*Docker|experience with.*Kubernetes/i, /^Yes/i, steps);

  // Years of experience in specific tech (ZipRecruiter)
  const yoe = applicant.yearsOfExperience || "5";
  const yoeNum = parseInt(yoe);
  // Build a pattern that matches the YOE or common ranges containing it
  const yoeRangePattern = new RegExp(
    `${yoe}|` +
    (yoeNum <= 1 ? "0.*1|0.*2" :
     yoeNum <= 3 ? "1.*3|2.*4|1\\.5.*3" :
     yoeNum <= 5 ? "3.*5|4.*6" :
     yoeNum <= 7 ? "5.*7|6.*8|5.*9" :
     yoeNum <= 10 ? "7.*10|8.*10|6.*9" :
     "10\\+|10.*"), "i"
  );
  await selectStaticDropdownSafe(frame, /years of professional experience.*software/i, yoeRangePattern, steps);
  // Years of industry experience (Sigma Computing, etc.)
  await selectStaticDropdownSafe(frame, /years of industry experience|years of experience/i, yoeRangePattern, steps);

  // State/Province (Affirm, Faire, etc.)
  const statePattern = applicant.usState
    ? new RegExp(applicant.usState.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    : /Colorado/i;
  await selectStaticDropdownSafe(frame, /State.*reside|Province.*reside|which.*State|state of residence|current state/i, statePattern, steps);
  // Hybrid/in-office commitment (Faire, etc.)
  await selectStaticDropdownSafe(frame, /commit.*in.office|in.office.*days.*week/i, /^Yes/i, steps);
  // Company familiarity (Faire, etc.)
  await selectStaticDropdownSafe(frame, /familiar.*with.*as a company|how familiar/i, /Somewhat|A little|Not very/i, steps);
  // How did you first learn / hear about (Affirm)
  await selectStaticDropdownSafe(frame, /first learn.*employer|learn about.*employer/i, /LinkedIn/i, steps);
  // Ethnicity multi-select (Reddit-style)
  const earlyRacePattern = applicant.race
    ? new RegExp(applicant.race.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    : /Black|decline|prefer not/i;
  await selectStaticDropdownSafe(frame, /ethnicities.*identify/i, earlyRacePattern, steps);
  // LGBTQ+ community (Discord)
  await selectStaticDropdownSafe(frame, /LGBTQ|member of the.*community/i, /decline|don.*wish|prefer not|No/i, steps);
  // Age range (Webflow)
  await selectStaticDropdownSafe(frame, /age range|what age/i, /25-34|26-35|don.*wish|prefer not/i, steps);
  // Region (Webflow)
  await selectStaticDropdownSafe(frame, /region.*reside|what region/i, /North America|NORAM|West|Mountain|don.*wish/i, steps);
  // First-generation professional (Gusto)
  await selectStaticDropdownSafe(frame, /first.generation/i, /don.*wish|prefer not|No/i, steps);
  // Consent / retain personal info (Webflow)
  await selectStaticDropdownSafe(frame, /consent.*personal.*information|retain.*personal/i, /Yes|I consent|agree/i, steps);
  // Racial/ethnic background (Webflow)
  await selectStaticDropdownSafe(frame, /racial.*ethnic.*background/i, earlyRacePattern, steps);

  // Phase 5b: Checkboxes
  try {
    const usCheckbox = frame.getByRole("checkbox", { name: "US", exact: true }).first();
    if (await usCheckbox.isVisible({ timeout: 500 }).catch(() => false)) {
      await usCheckbox.check();
      steps.push("Checked US work country");
    }
  } catch {}
  // Databricks sanctions/export control checkbox
  try {
    const noneAbove = frame.getByRole("checkbox", { name: /None of the above/i }).first();
    if (await noneAbove.isVisible({ timeout: 500 }).catch(() => false)) {
      await noneAbove.check();
      steps.push("Checked 'None of the above' (sanctions)");
    }
  } catch {}
  // Databricks conditional follow-up checkbox
  try {
    const notApplicable = frame.getByRole("checkbox", { name: /Not applicable/i }).first();
    if (await notApplicable.isVisible({ timeout: 500 }).catch(() => false)) {
      await notApplicable.check();
      steps.push("Checked 'Not applicable' (sanctions follow-up)");
    }
  } catch {}
  // "Acknowledge" checkboxes — privacy policy, AI policy, etc. (Twilio, etc.)
  try {
    const acknowledgeCheckboxes = frame.getByRole("checkbox", { name: /Acknowledge/i });
    const ackCount = await acknowledgeCheckboxes.count().catch(() => 0);
    for (let i = 0; i < ackCount; i++) {
      try {
        const cb = acknowledgeCheckboxes.nth(i);
        if (await cb.isVisible({ timeout: 1000 }).catch(() => false)) {
          await cb.check();
        }
      } catch {}
    }
    if (ackCount > 0) steps.push(`Checked ${ackCount} Acknowledge checkbox(es)`);
  } catch {}
  // "I agree" / "I confirm" / "I consent" checkboxes
  try {
    for (const pattern of [/I agree/i, /I confirm/i, /I consent/i, /I certify/i]) {
      const cb = frame.getByRole("checkbox", { name: pattern }).first();
      if (await cb.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cb.check();
        steps.push(`Checked '${pattern.source}' checkbox`);
      }
    }
  } catch {}
  // "LinkedIn" checkbox in "How did you hear" groups (Twilio, etc.)
  try {
    const linkedinCb = frame.getByRole("checkbox", { name: "LinkedIn" }).first();
    if (await linkedinCb.isVisible({ timeout: 500 }).catch(() => false)) {
      await linkedinCb.check();
      steps.push("Checked LinkedIn (how did you hear)");
    }
  } catch {}

  // Phase 7: Additional text fields — all values from applicant profile
  const whyAnswer = generateWhyAnswer(applicant);
  const cityState = `${applicant.city || ""}${applicant.city && applicant.usState ? ", " : ""}${applicant.usState || ""}`.trim();
  const prefName = applicant.preferredName || applicant.firstName;

  const additionalFields: Array<{ name: string | RegExp; value: string; label: string }> = [
    { name: /current or previous employer/i, value: applicant.currentEmployer || "", label: "Employer" },
    { name: /current or previous job title/i, value: applicant.currentTitle || "", label: "Job Title" },
    { name: /most recent school/i, value: applicant.school || "", label: "School" },
    { name: /most recent degree/i, value: applicant.degree || "", label: "Degree" },
    // City/state — multiple label patterns across companies
    { name: /city and state/i, value: cityState, label: "City/State" },
    { name: /what city/i, value: cityState, label: "City" },
    { name: /where are you located/i, value: cityState, label: "Location text" },
    { name: /from where.*intend to work/i, value: cityState, label: "Intend to work from" },
    { name: /address.*plan.*working|address.*which.*work/i, value: cityState, label: "Work address" },
    // Mailing address / primary address (Earnin, etc.)
    { name: /mailing address|primary.*address/i, value: cityState, label: "Mailing address" },
    // Compensation / salary alignment (Materialize, etc.)
    { name: /compensation.*align|salary.*align|does this align/i, value: "Yes, this aligns with my expectations.", label: "Compensation alignment" },
    // "Why interested in joining" (Tailscale, etc.)
    { name: /why.*interested.*joining|interested.*joining/i, value: whyAnswer, label: "Why joining" },
    // Why this company — multiple label patterns
    { name: /why.*interested/i, value: whyAnswer, label: "Why interested" },
    { name: /why.*want to join/i, value: whyAnswer, label: "Why join" },
    { name: /why.*apply/i, value: whyAnswer, label: "Why apply" },
    { name: /what excites you/i, value: whyAnswer, label: "What excites you" },
    { name: /^Why /i, value: whyAnswer, label: "Why company" },
    // Preferred name
    { name: /preferred.*name/i, value: prefName, label: "Preferred name" },
    { name: /additional information/i, value: whyAnswer, label: "Additional info" },
    { name: /how did you hear/i, value: "LinkedIn", label: "How did you hear" },
    { name: /earliest.*start|when.*start.*working/i, value: applicant.earliestStartDate || "Immediately / As soon as possible", label: "Earliest start" },
    { name: /deadlines.*timeline|timeline.*considerations|deadlines.*aware/i, value: "No specific deadlines.", label: "Timeline" },
    { name: /personal preferences/i, value: applicant.pronouns || "She/Her", label: "Personal preferences" },
    { name: /know anyone|know someone|do you know/i, value: "No", label: "Know anyone" },
    { name: /total years.*experience|years.*relevant.*experience/i, value: applicant.yearsOfExperience || "5", label: "Years experience" },
    { name: /salary.*expectation|compensation.*expectation|desired.*salary/i, value: applicant.salaryExpectation || "Open to discussion based on total compensation package", label: "Salary" },
    { name: /current company|current employer/i, value: applicant.currentEmployer || "", label: "Current company" },
    { name: /current title|current role/i, value: applicant.currentTitle || "", label: "Current title" },
    { name: /referred by|referral/i, value: "N/A", label: "Referral" },
    { name: /^Country$/i, value: applicant.countryOfResidence || "United States", label: "Country text" },
    { name: /zip code|postal code/i, value: "", label: "Zip code" },
    { name: /name pronunciation/i, value: "", label: "Name pronunciation" },
    { name: /^GitHub$/i, value: applicant.githubUrl || "", label: "GitHub" },
    { name: /^Twitter$/i, value: "", label: "Twitter" },
    { name: /^Portfolio$/i, value: applicant.websiteUrl || "", label: "Portfolio" },
    { name: /^Other Links$/i, value: "", label: "Other links" },
    { name: /^Current Company$/i, value: applicant.currentEmployer || "", label: "Current Company text" },
    { name: /years.*experience.*managing|managing.*engineering.*team/i, value: applicant.yearsOfExperience ? `${applicant.yearsOfExperience} years of experience${applicant.currentEmployer ? ` including leadership at ${applicant.currentEmployer}` : ""}, building and shipping production software.` : "", label: "Management experience" },
    { name: /developer.*tooling|what tools.*using/i, value: "I regularly use modern development tools including Git/GitHub, Docker, CI/CD pipelines, and cloud platforms for building and deploying production software.", label: "Tooling experience" },
    { name: /accessible.*inclusive|adjustments.*hiring/i, value: "No adjustments needed, thank you.", label: "Accessibility" },
    { name: /prefer.*use.*interview|name.*prefer/i, value: prefName, label: "Preferred name interview" },
    { name: /include.*LinkedIn.*profile|LinkedIn.*personal.*website/i, value: applicant.linkedinUrl || "", label: "LinkedIn/Website combined" },
    { name: /GitHub.*Website|GitHub.*or.*Website/i, value: applicant.githubUrl || applicant.websiteUrl || "", label: "GitHub/Website" },
    { name: /what do you use.*for/i, value: "I use the product for professional collaboration and staying connected with tech communities.", label: "Product usage" },
    { name: /experience creating.*agents|agents.*enterprise/i, value: whyAnswer, label: "Agent experience" },
    { name: /MCP integration/i, value: whyAnswer, label: "MCP experience" },
    { name: /harness configuration.*IDE/i, value: whyAnswer, label: "Harness experience" },
  ];

  for (const field of additionalFields) {
    try {
      const textbox = frame.getByRole("textbox", { name: field.name }).first();
      if (await textbox.isVisible({ timeout: 500 }).catch(() => false)) {
        await textbox.fill(field.value);
        steps.push(`Filled ${field.label}`);
      } else {
        steps.push(`Not visible: ${field.label}`);
      }
    } catch {
      steps.push(`Skipped ${field.label}`);
    }
  }

  // Phase 8: EEO fields — use applicant profile data
  const genderPattern = applicant.gender
    ? new RegExp(applicant.gender.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    : /Female|Woman|decline|prefer not/i;
  const racePattern = applicant.race
    ? new RegExp(applicant.race.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    : /Black|decline|prefer not/i;
  const hispanicPattern = applicant.hispanicOrLatino === "Yes" ? /^Yes/i
    : applicant.hispanicOrLatino === "No" ? /^No/i
    : /^No|decline|prefer not/i;
  const veteranPattern = applicant.veteranStatus
    ? new RegExp(applicant.veteranStatus.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 30), "i")
    : /not a protected veteran|No.*Not.*Veteran|don.*wish|prefer not/i;
  const disabilityPattern = applicant.disabilityStatus
    ? new RegExp(applicant.disabilityStatus.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 30), "i")
    : /^No$|No.*do not have|don.*wish|prefer not/i;

  await selectStaticDropdownSafe(frame, /gender/i, genderPattern, steps);
  await selectStaticDropdownSafe(frame, /hispanic/i, hispanicPattern, steps);
  await frame.waitForTimeout(1000); // Wait for conditional "Race" field
  await selectStaticDropdownSafe(frame, /race|ethnicity/i, racePattern, steps);
  await selectStaticDropdownSafe(frame, /veteran/i, veteranPattern, steps);
  await selectStaticDropdownSafe(frame, /disability/i, disabilityPattern, steps);
  // Sexual orientation (Twilio, Reddit, Amplitude, etc.)
  await selectStaticDropdownSafe(frame, /sexual orientation/i, /don.*wish|decline|prefer not|Heterosexual/i, steps);
  // Transgender experience (Reddit)
  await selectStaticDropdownSafe(frame, /transgender/i, /No|don.*wish|decline/i, steps);

  // Second pass: if company has BOTH custom EEO + standard Greenhouse EEO,
  // the first pass may have matched custom fields with wrong option text.
  // Try standard EEO field names specifically (these are at the very bottom).
  await selectStaticDropdownSafe(frame, /^Gender\*?$/i, genderPattern, steps);
  await selectStaticDropdownSafe(frame, /^Are you Hispanic/i, hispanicPattern, steps);
  await frame.waitForTimeout(1000); // Wait for conditional Race field
  await selectStaticDropdownSafe(frame, /^Race$/i, racePattern, steps);
  await selectStaticDropdownSafe(frame, /^Veteran Status/i, veteranPattern, steps);
  await selectStaticDropdownSafe(frame, /^Disability Status/i, disabilityPattern, steps);

  // Phase 8b: GDPR demographic consent checkbox (no ARIA label — find by ID or parent text)
  try {
    // Try by ID first (Greenhouse standard)
    const gdprConsent = frame.locator('#gdpr_demographic_data_consent_given_1');
    if (await gdprConsent.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gdprConsent.check();
      steps.push("Checked GDPR demographic consent");
    } else {
      // Fallback: find checkbox inside a label that mentions "consent" and "demographic"
      const consentCheckbox = frame.locator('div').filter({ hasText: /consent.*demographic/i }).locator('input[type="checkbox"]').first();
      if (await consentCheckbox.isVisible({ timeout: 1000 }).catch(() => false)) {
        await consentCheckbox.check();
        steps.push("Checked GDPR demographic consent (via text)");
      }
    }
  } catch {}
  // Also check any "I consent" standalone checkboxes
  try {
    const consentCbs = frame.locator('div').filter({ hasText: /By checking this box.*consent/i }).locator('input[type="checkbox"]');
    const count = await consentCbs.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      try { await consentCbs.nth(i).check(); } catch {}
    }
    if (count > 0) steps.push(`Checked ${count} consent checkbox(es)`);
  } catch {}

  // Phase 9: Submit and verify
  try {
    const submitButton = frame.getByRole("button", { name: /Submit application/i }).first();

    // Check if submit button is disabled (verification code already shown)
    const isDisabled = await submitButton.isDisabled().catch(() => false);
    if (isDisabled) {
      steps.push("Submit button is disabled — checking for verification code");
      const hasVerification = await frame.getByText(/verification code was sent/i).first()
        .isVisible({ timeout: 500 }).catch(() => false);
      if (hasVerification) {
        const result = await handleVerificationCode(frame, page, applicant, steps);
        if (result) return result;
      } else {
        return { success: false, error: "Submit button disabled — unknown reason", steps };
      }
    } else {
      await submitButton.click({ timeout: 5000 });
      steps.push("Clicked Submit");
      await page.waitForTimeout(5000);

      // Check for success
      if (await checkThankYou(frame, page)) {
        steps.push("Application submitted successfully");
        return { success: true, steps };
      }

      // Check if verification code appeared after submit
      const postSubmitVerification = await frame.getByText(/verification code was sent/i).first()
        .isVisible({ timeout: 3000 }).catch(() => false);
      if (postSubmitVerification) {
        const result = await handleVerificationCode(frame, page, applicant, steps);
        if (result) return result;
      }

      steps.push("Submit did not result in confirmation or verification — may have validation errors");
    }
  } catch (e) {
    steps.push(`Submit failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { success: false, error: "Greenhouse deterministic fill did not complete — falling back to Claude", steps };
}

// ============================================================================
// ACCESSIBILITY SNAPSHOT
// ============================================================================

async function getAccessibilitySnapshot(page: Page): Promise<string> {
  const url = page.url();
  const title = await page.title();

  // Check if there's a Greenhouse iframe — if so, prioritize its content
  // This prevents the snapshot from being dominated by the company's main page
  // (nav, job description, footer) while the actual form is buried/truncated
  const ghFrame = getGreenhouseFrame(page);
  if (ghFrame && ghFrame !== page.mainFrame()) {
    // Greenhouse is in an iframe — snapshot ONLY the iframe content
    // Retry up to 3 times if snapshot is empty (iframe still loading)
    for (let retry = 0; retry < 3; retry++) {
      try {
        const frameSnapshot = await ghFrame.locator("body").ariaSnapshot({ timeout: 10000 });
        if (frameSnapshot && frameSnapshot.length > 200) {
          return `URL: ${url}\nTitle: ${title}\nForm iframe: ${ghFrame.url()}\n\nAccessibility Tree (Greenhouse form only):\n${frameSnapshot.slice(0, 40000)}`;
        }
      } catch {}
      if (retry < 2) await page.waitForTimeout(3000);
    }
  }

  // Default: snapshot the whole page (for direct Greenhouse URLs or non-Greenhouse forms)
  let snapshot = "";
  try {
    snapshot = await page.locator("body").ariaSnapshot({ timeout: 10000 });
  } catch {
    try {
      snapshot = await page.mainFrame().locator("body").ariaSnapshot({ timeout: 5000 });
    } catch {
      snapshot = "(could not capture accessibility snapshot)";
    }
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue;
      if (frame.url() === "about:blank" || frame.url() === "") continue;
      try {
        const frameSnapshot = await frame.locator("body").ariaSnapshot({ timeout: 5000 });
        snapshot += `\n\n[IFRAME: ${frame.url()}]\n${frameSnapshot}`;
      } catch {}
    }
  }

  const truncated = snapshot.slice(0, 40000);
  return `URL: ${url}\nTitle: ${title}\n\nAccessibility Tree:\n${truncated}`;
}

// ============================================================================
// CLAUDE AGENT LOOP (upgraded: Sonnet + role-based actions)
// ============================================================================

async function askClaudeNextAction(
  pageSnapshot: string,
  applicant: ApplicantData,
  stepNum: number,
  previousSteps: string[],
  targetRole?: string,
  skippedFields?: string[]
): Promise<RoleAction> {
  const recentSteps = previousSteps.slice(-8).join("\n");
  const failedActions = previousSteps
    .filter((s) => s.includes("Action failed") || s.includes("WARNING") || s.includes("SKIPPING"))
    .slice(-5)
    .join("\n");

  // Parse user's custom application answers if available
  let customAnswers: Record<string, string> = {};
  if (applicant.applicationAnswers) {
    try { customAnswers = JSON.parse(applicant.applicationAnswers); } catch { /* ignore */ }
  }

  // Build application answers section from applicant profile data
  const answersSection = `
APPLICATION ANSWERS:
- LinkedIn: ${applicant.linkedinUrl || ""}
- Website: ${applicant.websiteUrl || ""}
- GitHub: ${applicant.githubUrl || ""}
- Current Employer: ${applicant.currentEmployer || ""}
- Current Title: ${applicant.currentTitle || ""}
- Years of Experience: ${applicant.yearsOfExperience || "5"}
- School: ${applicant.school || ""}
- Degree: ${applicant.degree || ""}
- Graduation Year: ${applicant.graduationYear || ""}
- Additional Certifications: ${applicant.additionalCerts || ""}
- Preferred Name: ${applicant.preferredName || applicant.firstName}
- Pronouns: ${applicant.pronouns || ""}
- Remote Preference: ${applicant.remotePreference || "Open to remote or on-site"}
- Willing to Relocate: ${applicant.willingToRelocate ? "Yes" : applicant.willingToRelocate === false ? "No" : "Open to discussion"}
- Earliest Start Date: ${applicant.earliestStartDate || "Flexible"}
- Salary Expectation: ${applicant.salaryExpectation || "Open to discussion based on total compensation"}
- Gender: ${applicant.gender || "Prefer not to say"}
- Race/Ethnicity: ${applicant.race || "Prefer not to say"}
- Hispanic or Latino: ${applicant.hispanicOrLatino || "Prefer not to say"}
- Veteran Status: ${applicant.veteranStatus || "Prefer not to say"}
- Disability Status: ${applicant.disabilityStatus || "Prefer not to say"}
${customAnswers.tellMeAboutYourself ? `- Tell Me About Yourself: ${customAnswers.tellMeAboutYourself}` : ""}
${customAnswers.whyThisRole ? `- Why This Role: ${customAnswers.whyThisRole}` : ""}
${customAnswers.greatestStrength ? `- Greatest Strength: ${customAnswers.greatestStrength}` : ""}
${customAnswers.greatestWeakness ? `- Greatest Weakness: ${customAnswers.greatestWeakness}` : ""}
${customAnswers.whyLeaving ? `- Why Leaving Current Role: ${customAnswers.whyLeaving}` : ""}
${customAnswers.technicalChallenge ? `- Technical Challenge: ${customAnswers.technicalChallenge}` : ""}
${customAnswers.whatMakesYouUnique ? `- What Makes You Unique: ${customAnswers.whatMakesYouUnique}` : ""}
${customAnswers.whereDoYouSeeYourself ? `- Where Do You See Yourself: ${customAnswers.whereDoYouSeeYourself}` : ""}
${customAnswers.managementStyle ? `- Management Style: ${customAnswers.managementStyle}` : ""}
${customAnswers.conflictResolution ? `- Conflict Resolution: ${customAnswers.conflictResolution}` : ""}
${customAnswers.diversityAndInclusion ? `- Diversity & Inclusion: ${customAnswers.diversityAndInclusion}` : ""}
${customAnswers.howDoYouHandleFailure ? `- How You Handle Failure: ${customAnswers.howDoYouHandleFailure}` : ""}
${customAnswers.howDoYouStayCurrent ? `- How You Stay Current: ${customAnswers.howDoYouStayCurrent}` : ""}

ROLE ANSWER (adapt to the specific company):
${generateWhyAnswer(applicant)}`;

  const prompt = `You are an AI agent filling a job application form. The page is described as an accessibility tree (YAML format showing roles, names, states, and values).

APPLICANT:
- Name: ${applicant.firstName} ${applicant.lastName}
- Email: ${applicant.email}
- Phone: ${applicant.phone}
- Location: ${applicant.city || ""}${applicant.city && applicant.usState ? ", " : ""}${applicant.usState || ""}, US
- Work authorized: ${applicant.workAuthorized === true ? "Yes" : applicant.workAuthorized === false ? "No" : "Not specified — skip if optional, select 'Yes' if required"}
- Needs sponsorship: ${applicant.needsSponsorship === true ? "Yes" : applicant.needsSponsorship === false ? "No" : "Not specified — skip if optional, select 'No' if required"}
- Resume: Downloaded as PDF, use "upload" action
${!applicant.linkedinUrl ? "\nNOTE: Applicant has no LinkedIn profile. If a LinkedIn field is optional, leave it empty. If required, enter 'N/A'." : ""}
${answersSection}

INTERACTION PATTERNS (use these EXACTLY):
1. Plain textbox: {"action": "fill", "role": "textbox", "name": "ACCESSIBLE NAME", "value": "VALUE"}
2. Autocomplete combobox (NO "Toggle flyout" button nearby):
   {"action": "type_slowly", "role": "combobox", "name": "NAME", "value": "SEARCH TEXT"}
   Then on next step click the option: {"action": "click", "role": "option", "name": "OPTION TEXT", "exact": true}
3. Static dropdown (HAS "Toggle flyout" button nearby — DO NOT click Toggle flyout directly):
   {"action": "select_dropdown", "name": "COMBOBOX ACCESSIBLE NAME", "value": "OPTION TEXT"}
   This handles opening the dropdown AND selecting the option in one step.
4. Checkbox: {"action": "check", "role": "checkbox", "name": "NAME"}
5. File upload: {"action": "click", "role": "button", "name": "Attach"} then {"action": "upload"}
6. Submit: {"action": "click", "role": "button", "name": "Submit application"}
7. When you see "Thank you" or "application received": {"action": "done", "reason": "submitted"}
8. If login/CAPTCHA required: {"action": "error", "message": "Login required"}

CRITICAL RULES:
- NEVER click a "Toggle flyout" button directly. ALWAYS use select_dropdown instead.
- For select_dropdown "name": Copy the EXACT combobox accessible name from the tree. Example: if the tree shows 'combobox "Have you ever worked for Robinhood?"', set name to "Have you ever worked for Robinhood?"
- For select_dropdown "value": Use a SHORT keyword that matches the option text (e.g., "No", "Yes", "confirm", "acknowledge"). Do NOT guess the full option text.
- Fill ONE field per step.
- Skip fields that already show a value (not "Select...").
- If a field value is empty/blank in APPLICATION ANSWERS and the field is optional, SKIP it.
- If you've tried filling a field 2+ times and it keeps failing, SKIP it and move to the next field.
- For free-text questions, use the ROLE ANSWERS above, adapted to the specific company.

PREVIOUS STEPS:
${recentSteps || "(first step)"}
${failedActions ? `\nFAILED ACTIONS:\n${failedActions}` : ""}
${skippedFields && skippedFields.length > 0 ? `\nSKIPPED (ignore): ${skippedFields.join(", ")}` : ""}

CURRENT PAGE (step ${stepNum + 1}):
${pageSnapshot}

Respond with ONLY a JSON object:
{"action": "click|fill|type_slowly|upload|check|select_dropdown|done|error", "role": "textbox|combobox|button|option|checkbox", "name": "accessible name", "exact": true, "value": "for fill/type_slowly/select_dropdown", "reason": "brief why", "message": "for error only"}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { action: "error", reason: "Claude returned no valid JSON", message: text.slice(0, 200) };
    }

    let jsonStr = jsonMatch[0];
    try {
      return JSON.parse(jsonStr) as RoleAction;
    } catch {
      let depth = 0;
      let endIdx = -1;
      for (let i = 0; i < jsonStr.length; i++) {
        if (jsonStr[i] === "{") depth++;
        else if (jsonStr[i] === "}") {
          depth--;
          if (depth === 0) { endIdx = i; break; }
        }
      }
      if (endIdx > 0) {
        try {
          return JSON.parse(jsonStr.slice(0, endIdx + 1)) as RoleAction;
        } catch {}
      }
      return { action: "error", reason: "Could not parse Claude response", message: text.slice(0, 200) };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { action: "error", reason: `Claude API error: ${msg}`, message: msg };
  }
}

// ============================================================================
// ACTION EXECUTION (role-based)
// ============================================================================

async function executeRoleAction(page: Page, action: RoleAction, resumePath: string): Promise<void> {
  switch (action.action) {
    case "click":
      if (action.role && action.name) {
        await clickByRole(page, action.role, action.name, action.exact);
      }
      break;
    case "fill":
      if (action.role && action.name && action.value !== undefined) {
        await fillByRole(page, action.role, action.name, action.value, action.exact);
      }
      break;
    case "type_slowly":
      if (action.role && action.name && action.value !== undefined) {
        await typeSlowlyByRole(page, action.role, action.name, action.value, action.exact);
      }
      break;
    case "check":
      if (action.name) {
        await checkByRole(page, action.name, action.exact);
      }
      break;
    case "select_dropdown":
      if (action.name && action.value) {
        // Use selectStaticDropdown which correctly finds the Toggle flyout
        // button adjacent to the target combobox.
        // Build forgiving regex: split name into keywords, match any combobox
        // whose accessible name contains all keywords (case-insensitive).
        const keywords = action.name!.split(/\s+/).filter(w => w.length > 2);
        const namePattern = new RegExp(keywords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*"), "i");
        const valuePattern = new RegExp(action.value!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        await withFrameFallback(page, async (frame) => {
          await selectStaticDropdown(frame, namePattern, valuePattern);
        });
      }
      break;
    case "upload":
      await handleFileUpload(page, resumePath);
      break;
  }
}

// ============================================================================
// MAIN: applyToJob
// ============================================================================

export async function applyToJob(
  applyUrl: string,
  applicant: ApplicantData,
  resumeUrl: string,
  resumeName: string,
  targetRole?: string,
  subscriptionTier?: string,
  jobTitle?: string,
  userId?: string
): Promise<ApplyResult> {
  // Wrap entire application in a timeout to prevent hanging
  const timeoutPromise = new Promise<ApplyResult>((_, reject) =>
    setTimeout(() => reject(new Error("Application timed out after 8 minutes")), APPLICATION_TIMEOUT_MS)
  );

  const applyPromise = _applyToJobInner(applyUrl, applicant, resumeUrl, resumeName, targetRole, subscriptionTier, jobTitle, userId);

  try {
    return await Promise.race([applyPromise, timeoutPromise]);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Application timed out",
      steps: ["Timed out after 5 minutes"],
    };
  }
}

async function _applyToJobInner(
  applyUrl: string,
  applicant: ApplicantData,
  resumeUrl: string,
  resumeName: string,
  targetRole?: string,
  subscriptionTier?: string,
  jobTitle?: string,
  userId?: string
): Promise<ApplyResult> {
  const context = await createStealthContext();
  const page = await context.newPage();
  const steps: string[] = [];

  // Download resume to temp file
  let tmpPath: string | null = null;
  let tailoredPath: string | null = null;
  let tailored = false;
  let tailoredResumeUrl: string | undefined;
  let resumeBuffer: Buffer;
  try {
    tmpPath = join(tmpdir(), `resume-${Date.now()}.pdf`);
    const resumeResponse = await fetch(resumeUrl);
    resumeBuffer = Buffer.from(await resumeResponse.arrayBuffer());
    writeFileSync(tmpPath, resumeBuffer);
    steps.push(`Resume downloaded: ${resumeName}`);
  } catch {
    return { success: false, error: "Failed to download resume", steps };
  }

  // Resume tailoring — swap tmpPath if successful
  if (subscriptionTier && userId) {
    try {
      const canTailor = await canTailorResume(userId, subscriptionTier);
      if (canTailor) {
        const jd = await fetchJobDescription(applyUrl);
        if (jd) {
          const result = await tailorResume({
            resumeBuffer,
            jobTitle: jobTitle || targetRole || "Unknown Role",
            jobDescription: jd,
            applicant: { firstName: applicant.firstName, lastName: applicant.lastName, currentTitle: applicant.currentTitle },
          });
          if (result.success) {
            tailoredPath = result.tailoredPath;
            tmpPath = tailoredPath;
            tailored = true;
            tailoredResumeUrl = result.blobUrl;
            steps.push(`Resume tailored for this job description${result.blobUrl ? " (saved)" : " (no blob)"}`);
          } else {
            steps.push(`Resume tailoring failed: ${result.error}`);
          }
        } else {
          steps.push("Resume tailoring skipped: no job description found");
        }
      } else {
        steps.push("Resume tailoring skipped: monthly limit reached");
      }
    } catch (err) {
      steps.push(`Resume tailoring failed: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  try {
    // Navigate to job page
    await page.goto(applyUrl, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {
      steps.push("networkidle timed out — proceeding");
    });
    await page.waitForTimeout(2000);
    steps.push(`Navigated to: ${page.url()}`);

    // Early login detection
    if (await isLoginPage(page)) {
      return { success: false, error: "Login/authentication required", steps };
    }

    // Find and follow ATS apply link (skip if already on an ATS page)
    const currentUrl = page.url();
    const alreadyOnATS = ["greenhouse.io", "lever.co", "ashbyhq.com", "myworkdayjobs.com", "smartrecruiters.com"]
      .some(ats => currentUrl.includes(ats));
    const atsApplyUrl = alreadyOnATS ? null : await findATSApplyLink(page);
    if (atsApplyUrl) {
      steps.push(`Found ATS apply link: ${atsApplyUrl}`);
      await page.goto(atsApplyUrl, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {
        steps.push("ATS page networkidle timed out — proceeding");
      });
      await page.waitForTimeout(2000);
      steps.push(`Navigated to ATS: ${page.url()}`);

      if (await isLoginPage(page)) {
        return { success: false, error: "Login/authentication required on ATS", steps };
      }
    }

    // Wait for ATS iframes to load (Greenhouse forms in embedded pages can be slow)
    let ats = detectATS(page.url(), page);
    if (ats === "Unknown") {
      // Give iframes up to 8 seconds to appear
      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(2000);
        ats = detectATS(page.url(), page);
        if (ats !== "Unknown") break;
      }
    }
    steps.push(`Detected ATS: ${ats}`);

    // Ensure iframe is actually loaded with content before proceeding
    if (ats === "Greenhouse") {
      const readyFrame = await waitForGreenhouseFrame(page);
      if (!readyFrame) {
        return { success: false, error: "Greenhouse form iframe is not loading or accessible tree is empty — cannot proceed with form filling", steps };
      }
    }

    // FAST PATH: Greenhouse deterministic handler
    if (ats === "Greenhouse") {
      steps.push("Using Greenhouse deterministic handler");
      const ghResult = await greenhouseDeterministicFill(page, applicant, tmpPath, targetRole);
      steps.push(...(ghResult.steps || []));

      if (ghResult.success) {
        return { success: true, steps, tailored, tailoredResumeUrl };
      }
      steps.push("Deterministic handler did not complete — falling back to Claude agent loop");
    }

    // GENERIC PATH: Claude agent loop with accessibility snapshots
    let previousSnapshot = "";
    let stuckCount = 0;
    const fieldAttempts: Record<string, number> = {};
    const skippedFields: string[] = [];

    for (let step = 0; step < MAX_STEPS; step++) {
      const snapshot = await getAccessibilitySnapshot(page);

      // Stuck detection
      if (snapshot === previousSnapshot) {
        stuckCount++;
        if (stuckCount >= 4) {
          return { success: false, error: "Stuck: page state unchanged after multiple actions", steps };
        }
      } else {
        stuckCount = 0;
        previousSnapshot = snapshot;
      }

      steps.push(`Step ${step + 1}: analyzing page (${snapshot.length} chars)`);

      const action = await askClaudeNextAction(snapshot, applicant, step, steps, targetRole, skippedFields);
      steps.push(`Claude: ${action.action} — ${action.reason}`);

      if (action.action === "done") {
        return { success: true, steps, tailored, tailoredResumeUrl };
      }

      if (action.action === "error") {
        const errMsg = action.message || action.reason || "";
        if (errMsg.includes("Could not parse") || errMsg.includes("no valid JSON") || errMsg.includes("Claude API error")) {
          steps.push(`Recoverable error, retrying: ${errMsg}`);
          continue;
        }
        // Check if the error is about a verification code — try to handle it
        if (/security code|verification code|8.character code/i.test(errMsg)) {
          steps.push("Claude hit verification code — attempting automated retrieval");
          const ghFrame = getGreenhouseFrame(page);
          if (ghFrame) {
            const verResult = await handleVerificationCode(ghFrame, page, applicant, steps);
            if (verResult) return verResult;
          }
        }
        return { success: false, error: errMsg, steps };
      }

      // Track field attempts (including select_dropdown to prevent infinite loops on stuck dropdowns)
      const fieldKey = action.action === "select_dropdown"
        ? `combobox:${action.name}`
        : `${action.role}:${action.name}`;
      if (action.action === "fill" || action.action === "type_slowly" || action.action === "select_dropdown") {
        fieldAttempts[fieldKey] = (fieldAttempts[fieldKey] || 0) + 1;
        if (fieldAttempts[fieldKey] >= 3 && !skippedFields.includes(fieldKey)) {
          skippedFields.push(fieldKey);
          steps.push(`SKIPPING field "${fieldKey}" after ${fieldAttempts[fieldKey]} failed attempts`);
          continue;
        }
      }

      try {
        await executeRoleAction(page, action, tmpPath);
        await page.waitForTimeout(2000);

        if (await isLoginPage(page)) {
          return { success: false, error: "Redirected to login page", steps };
        }

        // After clicking Submit in Claude loop, check for verification code
        if (action.action === "click" && action.name && /submit/i.test(action.name)) {
          await page.waitForTimeout(3000);
          const ghFrame = getGreenhouseFrame(page);
          if (ghFrame) {
            // Check for success first
            if (await checkThankYou(ghFrame, page)) {
              return { success: true, steps: [...steps, "Application submitted successfully"], tailored, tailoredResumeUrl };
            }
            // Check for verification code
            const hasVerification = await ghFrame.getByText(/verification code was sent/i).first()
              .isVisible({ timeout: 500 }).catch(() => false);
            if (hasVerification) {
              const verResult = await handleVerificationCode(ghFrame, page, applicant, steps);
              if (verResult) return verResult;
            }
            // Check for validation errors — scan for common error patterns
            try {
              const errorTexts = await ghFrame.locator('[class*="error"], [class*="invalid"], [role="alert"]')
                .allTextContents().catch(() => [] as string[]);
              const visibleErrors = errorTexts.filter(t => t.trim().length > 0).slice(0, 5);
              if (visibleErrors.length > 0) {
                steps.push(`Validation errors after submit: ${visibleErrors.join("; ")}`);
              }
            } catch {}
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        steps.push(`Action failed: ${msg}`);
      }
    }

    return { success: false, error: `Reached max steps (${MAX_STEPS}) without completing`, steps };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      steps,
    };
  } finally {
    if (tmpPath) try { unlinkSync(tmpPath); } catch {}
    if (tailoredPath && tailoredPath !== tmpPath) try { unlinkSync(tailoredPath); } catch {}
    await context.close();
  }
}
