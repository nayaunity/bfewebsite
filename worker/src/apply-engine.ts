import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { waitForVerificationCode } from "./verification";

const anthropic = new Anthropic();

// Load application answers for Claude to use when filling forms
let applicationAnswers: Record<string, unknown> = {};
try {
  const answersPath = resolve(__dirname, "../../job-assets/application-answers.json");
  applicationAnswers = JSON.parse(readFileSync(answersPath, "utf-8"));
} catch {
  console.warn("[ApplyEngine] Could not load application-answers.json — Claude will use applicant info only");
}

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

  // Strategy 1: Many sites use {listing-url}/apply pattern (Stripe, etc.)
  // Check if there's an "Apply" link pointing to currentUrl/apply
  const applyUrlSuffix = await page.evaluate((baseUrl) => {
    const links = Array.from(document.querySelectorAll("a[href]"));
    for (const link of links) {
      const href = (link as HTMLAnchorElement).href;
      const text = (link.textContent || "").trim().toLowerCase();
      // Check for /apply suffix link
      if ((text.includes("apply") || text.includes("submit")) && href.includes("/apply")) {
        return href;
      }
    }
    // Also check if current page URL + /apply would make sense (but not if already on /apply)
    if ((baseUrl.match(/\/jobs\/listing\//) || baseUrl.match(/\/careers\/positions\//)) && !baseUrl.endsWith("/apply")) {
      return baseUrl.replace(/\/?$/, "/apply");
    }
    return null;
  }, currentUrl);

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
  usState?: string;
  workAuthorized?: boolean;
  needsSponsorship?: boolean;
  countryOfResidence?: string;
}

export interface ApplyResult {
  success: boolean;
  error?: string;
  steps?: string[];
}

// --- New role-based action interface (replaces CSS-selector-based AgentAction) ---

interface RoleAction {
  action: "click" | "fill" | "type_slowly" | "upload" | "check" | "done" | "error";
  role?: string;
  name?: string;
  exact?: boolean;
  value?: string;
  reason: string;
  message?: string;
}

const MAX_STEPS = 25;

// ============================================================================
// FRAME HELPERS
// ============================================================================

import type { Frame } from "playwright";

async function withFrameFallback(
  page: Page,
  fn: (frame: Frame) => Promise<void>
): Promise<void> {
  // Try main frame first
  try {
    await fn(page.mainFrame());
    return;
  } catch {}
  // Try child frames (Greenhouse forms live in iframes)
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    if (frame.url() === "about:blank" || frame.url() === "") continue;
    try {
      await fn(frame);
      return;
    } catch {}
  }
  throw new Error("Action failed on all frames");
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
      if (!(await attachButton.isVisible({ timeout: 2000 }).catch(() => false))) continue;
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

async function selectStaticDropdown(
  frame: Frame,
  comboboxNamePattern: string | RegExp,
  optionName: string | RegExp
): Promise<void> {
  // Find the combobox, then find the NEXT Toggle flyout button in document order.
  // This avoids the ancestor-based approach which often finds the wrong toggle
  // (e.g., phone country toggle instead of start date toggle).
  const combobox = frame.getByRole("combobox", { name: comboboxNamePattern }).first();
  const toggle = combobox.locator('xpath=following::button[@aria-label="Toggle flyout"][1]');

  await toggle.click({ timeout: 5000 });
  await frame.waitForTimeout(1000);

  const useExact = typeof optionName === "string" && optionName.length <= 3;
  await frame.getByRole("option", { name: optionName, exact: useExact }).first().click({ timeout: 5000 });
  await frame.waitForTimeout(300);
}

async function selectStaticDropdownSafe(
  frame: Frame,
  comboboxNamePattern: string | RegExp,
  optionName: string | RegExp,
  steps: string[]
): Promise<void> {
  try {
    const combobox = frame.getByRole("combobox", { name: comboboxNamePattern }).first();
    if (!(await combobox.isVisible({ timeout: 2000 }).catch(() => false))) {
      steps.push(`Dropdown not found: ${comboboxNamePattern}`);
      return;
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
  const frameCheck = await frame.getByText(/thank you/i).first()
    .isVisible({ timeout: 5000 }).catch(() => false);
  if (frameCheck) return true;
  const mainCheck = await page.getByText(/thank you for applying/i).first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  return mainCheck;
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

    await submitButton.click({ timeout: 5000 });
    steps.push("Clicked Submit after verification code");
    await page.waitForTimeout(5000);

    if (await checkThankYou(frame, page)) {
      steps.push("Application submitted successfully after verification");
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

  // Pre-compute application answers for use throughout the handler
  const personal = applicationAnswers.personal as Record<string, string> | undefined;
  const education = applicationAnswers.education as Record<string, string> | undefined;
  const common = applicationAnswers.commonQuestions as Record<string, Record<string, string>> | undefined;
  const roleKey = targetRole
    ? Object.keys(common || {}).find((k) =>
        k.toLowerCase().includes(targetRole.toLowerCase().split(",")[0].trim().split("/")[0].trim())
      )
    : Object.keys(common || {})[0];
  const roleAnswers = roleKey && common ? common[roleKey] : undefined;

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
      if (await textbox.isVisible({ timeout: 2000 }).catch(() => false)) {
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
    if (await locationCombobox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await locationCombobox.clear();
      await locationCombobox.pressSequentially("Denver", { delay: 80 });
      await frame.waitForTimeout(1500);
      const option = frame.getByRole("option", { name: /Denver, Colorado/i }).first();
      if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
        await option.click({ timeout: 5000 });
        steps.push("Selected location: Denver, Colorado");
      } else {
        steps.push("Location options did not appear");
      }
    }
  } catch (e) {
    steps.push(`Location field failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Phase 3: Resume upload
  try {
    const attachButton = frame.getByRole("button", { name: "Attach" }).first();
    if (await attachButton.isVisible({ timeout: 2000 }).catch(() => false)) {
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
    if (await coverLetterGroup.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Check if it has "Enter manually" button — use that to type a cover letter
      const enterManually = coverLetterGroup.getByRole("button", { name: /Enter manually/i }).first();
      if (await enterManually.isVisible({ timeout: 1000 }).catch(() => false)) {
        await enterManually.click({ timeout: 3000 });
        await frame.waitForTimeout(500);
        // Find the textarea that appears
        const textarea = coverLetterGroup.locator("textarea").first();
        if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
          const coverText = roleAnswers?.whyThisRole
            ? `Dear Hiring Team,\n\n${roleAnswers.whyThisRole}\n\nPortfolio: https://theblackfemaleengineer.com\nGitHub: https://github.com/nyaradzobere\n\nBest regards,\n${applicant.firstName} ${applicant.lastName}`
            : `Dear Hiring Team,\n\nI am excited to apply for this role. As a CTO and AI Engineer, I have shipped production AI systems, built RAG pipelines, and led full-stack development. My portfolio at https://theblackfemaleengineer.com showcases my work.\n\nBest regards,\n${applicant.firstName} ${applicant.lastName}`;
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
    if (await phoneGroup.isVisible({ timeout: 2000 }).catch(() => false)) {
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
    if (await companyNameField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await companyNameField.fill("The Black Female Engineer");
      steps.push("Filled employment: Company name");

      // Title
      const titleField = frame.getByRole("textbox", { name: "Title" }).first();
      if (await titleField.isVisible({ timeout: 1000 }).catch(() => false)) {
        await titleField.fill("CTO / AI Engineer");
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

  // Phase 4b: Education section (Coinbase-style — School/Degree/Discipline as comboboxes)
  try {
    const schoolCombobox = frame.getByRole("combobox", { name: /^School$/i }).first();
    if (await schoolCombobox.isVisible({ timeout: 2000 }).catch(() => false)) {
      // School is an autocomplete combobox — type slowly
      await schoolCombobox.clear();
      await schoolCombobox.pressSequentially("University of Colorado", { delay: 80 });
      await frame.waitForTimeout(1500);
      const schoolOption = frame.getByRole("option", { name: /Colorado/i }).first();
      if (await schoolOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await schoolOption.click({ timeout: 5000 });
        steps.push("Selected school");
      } else {
        steps.push("School options did not appear");
      }

      // Degree dropdown
      await selectStaticDropdownSafe(frame, /^Degree$/i, /Bachelor/i, steps);

      // Discipline dropdown
      await selectStaticDropdownSafe(frame, /Discipline/i, /Business/i, steps);
    }
  } catch (e) {
    steps.push(`Education section failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Phase 4c: LinkedIn URL
  try {
    const linkedinField = frame.getByRole("textbox", { name: /LinkedIn/i }).first();
    if (await linkedinField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await linkedinField.fill("https://linkedin.com/in/theblackfemaleengineer");
      steps.push("Filled LinkedIn URL");
    }
  } catch {}

  // Phase 5: Static dropdowns — try all common patterns across different Greenhouse forms
  // Stripe-style fields
  await selectStaticDropdownSafe(frame, /country.*reside/i, "US", steps);
  await selectStaticDropdownSafe(frame, /remote/i, /Yes.*remote/i, steps);
  await selectStaticDropdownSafe(frame, /WhatsApp/i, "No", steps);

  // Common fields (both Stripe and Coinbase)
  await selectStaticDropdownSafe(frame, /authorized to work/i, "Yes", steps);
  await selectStaticDropdownSafe(frame, /legally authorized/i, "Yes", steps);
  await selectStaticDropdownSafe(frame, /require.*sponsor/i, "No", steps);
  await selectStaticDropdownSafe(frame, /employed by/i, "No", steps);
  await selectStaticDropdownSafe(frame, /previously.*employed/i, "No", steps);

  // Coinbase-specific fields
  await selectStaticDropdownSafe(frame, /at least 18/i, "Yes", steps);
  await selectStaticDropdownSafe(frame, /how did you hear/i, /LinkedIn/i, steps);
  await selectStaticDropdownSafe(frame, /Global Data Privacy/i, /confirm/i, steps);
  await selectStaticDropdownSafe(frame, /understand.*AI tools/i, /agree|acknowledge|confirm|yes/i, steps);
  await selectStaticDropdownSafe(frame, /how you use AI/i, /regularly/i, steps);
  await selectStaticDropdownSafe(frame, /government official/i, /No/i, steps);
  await selectStaticDropdownSafe(frame, /close relative.*government/i, /No/i, steps);
  await selectStaticDropdownSafe(frame, /conflict of interest/i, /No/i, steps);
  await selectStaticDropdownSafe(frame, /referred.*senior leader/i, /No/i, steps);

  // Phase 5b: Checkboxes (US work country — Stripe-style)
  try {
    const usCheckbox = frame.getByRole("checkbox", { name: "US", exact: true }).first();
    if (await usCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await usCheckbox.check();
      steps.push("Checked US work country");
    }
  } catch {}

  // Phase 7: Additional text fields
  const additionalFields: Array<{ name: string | RegExp; value: string; label: string }> = [
    { name: /current or previous employer/i, value: "The Black Female Engineer (Self-employed)", label: "Employer" },
    { name: /current or previous job title/i, value: "CTO / AI Engineer", label: "Job Title" },
    { name: /most recent school/i, value: education?.school || "University of Colorado Boulder", label: "School" },
    { name: /most recent degree/i, value: education?.degree || "B.S. Finance & Accounting", label: "Degree" },
    { name: /city and state/i, value: `Denver, ${applicant.usState || "Colorado"}`, label: "City/State" },
  ];

  // Add "Why are you interested" with a tailored answer
  if (roleAnswers?.whyThisCompany) {
    additionalFields.push({
      name: /why.*interested/i,
      value: roleAnswers.whyThisCompany.slice(0, 500),
      label: "Why interested",
    });
  }

  for (const field of additionalFields) {
    try {
      const textbox = frame.getByRole("textbox", { name: field.name }).first();
      if (await textbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await textbox.fill(field.value);
        steps.push(`Filled ${field.label}`);
      } else {
        steps.push(`Not visible: ${field.label}`);
      }
    } catch {
      steps.push(`Skipped ${field.label}`);
    }
  }

  // Phase 8: EEO fields (sequential — conditional fields may appear)
  await selectStaticDropdownSafe(frame, /gender/i, "Female", steps);
  await selectStaticDropdownSafe(frame, /hispanic/i, "No", steps);
  await frame.waitForTimeout(1000); // Wait for conditional "Race" field
  await selectStaticDropdownSafe(frame, /race/i, /Black or African American/i, steps);
  await selectStaticDropdownSafe(frame, /veteran/i, /not a protected veteran/i, steps);
  await selectStaticDropdownSafe(frame, /disability/i, /No.*do not have/i, steps);

  // Phase 9: Submit and verify
  try {
    const submitButton = frame.getByRole("button", { name: /Submit application/i }).first();

    // Check if submit button is disabled (verification code already shown)
    const isDisabled = await submitButton.isDisabled().catch(() => false);
    if (isDisabled) {
      steps.push("Submit button is disabled — checking for verification code");
      const hasVerification = await frame.getByText(/verification code was sent/i).first()
        .isVisible({ timeout: 2000 }).catch(() => false);
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

  // Use Playwright's built-in accessibility snapshot (YAML format)
  // This automatically includes iframe content and reveals ARIA roles/states
  let snapshot = "";
  try {
    snapshot = await page.locator("body").ariaSnapshot({ timeout: 10000 });
  } catch {
    // Fallback: try each frame individually
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

  // Truncate to fit in Claude prompt
  const truncated = snapshot.slice(0, 15000);
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

  // Build application answers section
  let answersSection = "";
  if (applicationAnswers && Object.keys(applicationAnswers).length > 0) {
    const personal = applicationAnswers.personal as Record<string, string> | undefined;
    const background = applicationAnswers.backgroundQuestions as Record<string, string> | undefined;
    const education = applicationAnswers.education as Record<string, string> | undefined;
    const common = applicationAnswers.commonQuestions as Record<string, Record<string, string>> | undefined;
    const additional = applicationAnswers.additionalQuestions as Record<string, string> | undefined;

    const roleKey = targetRole
      ? Object.keys(common || {}).find((k) => k.toLowerCase().includes(targetRole.toLowerCase().split(",")[0].trim().split("/")[0].trim()))
      : undefined;
    const roleAnswers = roleKey && common ? common[roleKey] : undefined;

    answersSection = `
APPLICATION ANSWERS:
- LinkedIn: ${personal?.linkedin || ""}
- Website: ${personal?.website || ""}
- Pronouns: ${personal?.pronouns || "She/Her"}
- Remote Preference: ${personal?.remotePreference || "Remote or Hybrid"}
- Earliest Start Date: ${personal?.earliestStartDate || "Immediately"}
- Salary: ${personal?.salaryRules || "Open to discussion"}
- Years of Experience: ${personal?.yearsOfExperience || "5"}
- School: ${education?.school || ""}
- Degree: ${education?.degree || ""}

EEO: Gender=${background?.genderIdentity || "Female"}, Race=${background?.race || "Black or African American"}, Hispanic=${background?.hispanicOrLatino || "No"}, Veteran=${background?.veteranStatus || "No"}, Disability=${background?.disabilityStatus || "No"}

${roleAnswers ? `ROLE ANSWERS:\n- Why this company: ${roleAnswers.whyThisCompany?.slice(0, 400) || ""}\n- Tell me about yourself: ${roleAnswers.tellMeAboutYourself?.slice(0, 400) || ""}` : ""}
${additional ? `- What makes you unique: ${additional.whatMakesYouUnique?.slice(0, 200) || ""}` : ""}`;
  }

  const prompt = `You are an AI agent filling a job application form. The page is described as an accessibility tree (YAML format showing roles, names, states, and values).

APPLICANT:
- Name: ${applicant.firstName} ${applicant.lastName}
- Email: ${applicant.email}
- Phone: ${applicant.phone}
- Location: Denver, ${applicant.usState || "Colorado"}, US
- Work authorized: ${applicant.workAuthorized ? "Yes" : "No"}
- Needs sponsorship: ${applicant.needsSponsorship ? "Yes" : "No"}
- Resume: Downloaded as PDF, use "upload" action
${answersSection}

INTERACTION PATTERNS (use these EXACTLY):
1. Plain textbox: {"action": "fill", "role": "textbox", "name": "ACCESSIBLE NAME", "value": "VALUE"}
2. Autocomplete combobox (NO "Toggle flyout" button nearby):
   {"action": "type_slowly", "role": "combobox", "name": "NAME", "value": "SEARCH TEXT"}
   Then on next step click the option: {"action": "click", "role": "option", "name": "OPTION TEXT", "exact": true}
3. Static dropdown (HAS "Toggle flyout" button nearby):
   First: {"action": "click", "role": "button", "name": "Toggle flyout"}
   Then: {"action": "click", "role": "option", "name": "OPTION TEXT", "exact": true}
4. Checkbox: {"action": "check", "role": "checkbox", "name": "NAME"}
5. File upload: First click Attach button, then: {"action": "upload"}
6. Submit: {"action": "click", "role": "button", "name": "Submit application"}
7. When you see "Thank you" or "application received": {"action": "done", "reason": "submitted"}
8. If login/CAPTCHA required: {"action": "error", "message": "Login required"}

RULES:
- Target elements by ARIA role + accessible name from the tree. Use "exact": true when needed.
- Fill ONE field per step.
- Skip fields that already show a value in the tree.
- For "Toggle flyout" buttons: they are ALWAYS adjacent to the combobox they control. Identify which field you're targeting in your "reason".
- Do NOT type into static dropdowns (comboboxes with Toggle flyout). Use the toggle+click pattern.
- For free-text questions, use the ROLE ANSWERS above, adapted to the specific company.

PREVIOUS STEPS:
${recentSteps || "(first step)"}
${failedActions ? `\nFAILED ACTIONS:\n${failedActions}` : ""}
${skippedFields && skippedFields.length > 0 ? `\nSKIPPED (ignore): ${skippedFields.join(", ")}` : ""}

CURRENT PAGE (step ${stepNum + 1}):
${pageSnapshot}

Respond with ONLY a JSON object:
{"action": "click|fill|type_slowly|upload|check|done|error", "role": "textbox|combobox|button|option|checkbox|link|heading", "name": "accessible name", "exact": true, "value": "for fill/type_slowly", "reason": "brief why", "message": "for error only"}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
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
  targetRole?: string
): Promise<ApplyResult> {
  const context = await createStealthContext();
  const page = await context.newPage();
  const steps: string[] = [];

  // Download resume to temp file
  let tmpPath: string | null = null;
  try {
    tmpPath = join(tmpdir(), `resume-${Date.now()}.pdf`);
    const resumeResponse = await fetch(resumeUrl);
    const resumeBuffer = Buffer.from(await resumeResponse.arrayBuffer());
    writeFileSync(tmpPath, resumeBuffer);
    steps.push(`Resume downloaded: ${resumeName}`);
  } catch {
    return { success: false, error: "Failed to download resume", steps };
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

    const ats = detectATS(page.url(), page);
    steps.push(`Detected ATS: ${ats}`);

    // FAST PATH: Greenhouse deterministic handler
    if (ats === "Greenhouse") {
      steps.push("Using Greenhouse deterministic handler");
      const ghResult = await greenhouseDeterministicFill(page, applicant, tmpPath, targetRole);
      steps.push(...(ghResult.steps || []));

      if (ghResult.success) {
        return { success: true, steps };
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
        return { success: true, steps };
      }

      if (action.action === "error") {
        const errMsg = action.message || action.reason || "";
        if (errMsg.includes("Could not parse") || errMsg.includes("no valid JSON") || errMsg.includes("Claude API error")) {
          steps.push(`Recoverable error, retrying: ${errMsg}`);
          continue;
        }
        return { success: false, error: errMsg, steps };
      }

      // Track field attempts
      const fieldKey = `${action.role}:${action.name}`;
      if (action.action === "fill" || action.action === "type_slowly") {
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
    await context.close();
  }
}
