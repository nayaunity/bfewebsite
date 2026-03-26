import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import Anthropic from "@anthropic-ai/sdk";

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
    // Also check if current page URL + /apply would make sense
    if (baseUrl.match(/\/jobs\/listing\//) || baseUrl.match(/\/careers\/positions\//)) {
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
 * Detect the Applicant Tracking System from the URL.
 */
function detectATS(url: string): string {
  if (url.includes("greenhouse.io") || url.includes("boards.greenhouse")) return "Greenhouse";
  if (url.includes("lever.co")) return "Lever";
  if (url.includes("myworkdayjobs.com") || url.includes("workday.com")) return "Workday";
  if (url.includes("ashbyhq.com")) return "Ashby";
  if (url.includes("smartrecruiters.com")) return "SmartRecruiters";
  if (url.includes("icims.com")) return "iCIMS";
  if (url.includes("jobvite.com")) return "Jobvite";
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

interface AgentAction {
  action: "click" | "fill" | "upload" | "check" | "select" | "done" | "error";
  selector?: string;
  selectors?: string[];
  value?: string;
  reason: string;
  message?: string;
}

const MAX_STEPS = 25;

/**
 * Apply to a single job using Claude-driven browser automation.
 * Claude analyzes each page and decides the next action.
 */
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
  } catch (err) {
    return { success: false, error: "Failed to download resume", steps };
  }

  try {
    // Navigate to job page
    await page.goto(applyUrl, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {
      steps.push("networkidle timed out — proceeding");
    });
    await page.waitForTimeout(2000);
    steps.push(`Navigated to: ${page.url()}`);

    // Early login detection — don't waste steps on auth-gated pages
    if (await isLoginPage(page)) {
      return { success: false, error: "Login/authentication required — cannot apply without account", steps };
    }

    // Try to find and follow the actual ATS apply link (Greenhouse, Lever, etc.)
    // Many company career pages have an "Apply" button that links to an external ATS form
    const atsApplyUrl = await findATSApplyLink(page);
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

    // Agent loop — Claude decides each step
    let previousUrl = page.url();
    let previousFormHash = "";
    let stuckCount = 0;
    // Track fields that have been attempted multiple times without success
    const fieldAttempts: Record<string, number> = {};
    const skippedFields: string[] = [];

    for (let step = 0; step < MAX_STEPS; step++) {
      const currentUrl = page.url();
      // Hash all form field values to detect actual state changes
      const currentFormHash = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll("input, textarea, select"));
        return inputs.map((el) => {
          const inp = el as HTMLInputElement;
          return `${inp.name || inp.id || ""}=${inp.value || ""}${inp.checked ? ":checked" : ""}`;
        }).join("|");
      }).catch(() => "");

      if (currentUrl !== previousUrl || currentFormHash !== previousFormHash) {
        if (currentUrl !== previousUrl) {
          steps.push(`Page navigated to: ${currentUrl}`);
        }
        previousUrl = currentUrl;
        previousFormHash = currentFormHash;
        stuckCount = 0;
      } else {
        stuckCount++;
      }

      // Stuck detection — bail only if BOTH URL and form state are unchanged for 6+ actions
      if (stuckCount >= 6) {
        return { success: false, error: "Stuck: no page or form state changes after multiple actions", steps };
      }

      const snapshot = await getPageSnapshot(page);
      steps.push(`Step ${step + 1}: analyzing page (${snapshot.length} chars)`);

      const action = await askClaudeNextAction(snapshot, applicant, step, steps, targetRole, skippedFields);
      steps.push(`Claude: ${action.action} — ${action.reason}`);

      if (action.action === "done") {
        return { success: true, steps };
      }

      if (action.action === "error") {
        const errMsg = action.message || action.reason || "";
        // JSON parse errors are recoverable — just skip this step
        if (errMsg.includes("Could not parse") || errMsg.includes("no valid JSON") || errMsg.includes("Claude API error")) {
          steps.push(`Recoverable error, retrying: ${errMsg}`);
          continue;
        }
        return { success: false, error: errMsg, steps };
      }

      // Track field attempts for fill/select actions
      const fieldKey = action.selector || "";
      if ((action.action === "fill" || action.action === "select") && fieldKey) {
        fieldAttempts[fieldKey] = (fieldAttempts[fieldKey] || 0) + 1;
      }

      try {
        await executeAction(page, action, tmpPath);
        // Wait for potential navigation
        await page.waitForTimeout(3000);

        // Verify fill/select actions actually took effect
        if ((action.action === "fill" || action.action === "select") && action.selector) {
          const actualValue = await page.evaluate((sel) => {
            const el = document.querySelector(sel) as HTMLInputElement;
            return el?.value || "";
          }, action.selector).catch(() => "");
          const valueEmpty = !actualValue || actualValue.length === 0;
          const valueSame = actualValue === action.value;

          if (!valueSame && valueEmpty && fieldAttempts[fieldKey] >= 3) {
            // Field has failed 3+ times — add to skip list so Claude moves on
            if (!skippedFields.includes(fieldKey)) {
              skippedFields.push(fieldKey);
              steps.push(`SKIPPING field "${fieldKey}" after ${fieldAttempts[fieldKey]} failed attempts — moving on`);
            }
          } else if (!valueSame && valueEmpty) {
            steps.push(`WARNING: Fill verification failed for "${action.selector}" — value did not persist (attempt ${fieldAttempts[fieldKey]})`);
          }
        }

        // Check if action led to a login page
        if (await isLoginPage(page)) {
          return { success: false, error: "Login/authentication required — redirected to login page", steps };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        steps.push(`Action failed: ${msg}`);
        // Also count exceptions toward skip threshold
        if (fieldKey && (action.action === "fill" || action.action === "select")) {
          if (fieldAttempts[fieldKey] >= 3 && !skippedFields.includes(fieldKey)) {
            skippedFields.push(fieldKey);
            steps.push(`SKIPPING field "${fieldKey}" after ${fieldAttempts[fieldKey]} failed attempts — moving on`);
          }
        }
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

/**
 * Get a snapshot of the page for Claude to analyze.
 * Uses visible text + a focused list of interactive elements.
 */
async function getPageSnapshot(page: Page): Promise<string> {
  const url = page.url();
  const title = await page.title();

  // Get visible page text (compact)
  const visibleText = await page.innerText("body").catch(() => "");
  const truncatedText = visibleText.replace(/\s+/g, " ").trim().slice(0, 5000);

  // Get all interactive elements with WORKING selectors
  const interactiveElements = await page.evaluate(() => {
    const elements: string[] = [];

    // Helper: generate a working selector for an element
    // NOTE: Must be arrow/const to avoid tsx/esbuild __name injection in browser context
    const getSelector = (el: Element): string => {
      if (el.id) return `#${CSS.escape(el.id)}`;
      const name = el.getAttribute("name");
      if (name) return `${el.tagName.toLowerCase()}[name="${name}"]`;
      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel) return `${el.tagName.toLowerCase()}[aria-label="${ariaLabel}"]`;
      const placeholder = (el as HTMLInputElement).placeholder;
      if (placeholder) return `${el.tagName.toLowerCase()}[placeholder="${placeholder}"]`;
      const type = el.getAttribute("type");
      const tag = el.tagName.toLowerCase();
      // Nth-of-type fallback
      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.querySelectorAll(tag));
        const index = siblings.indexOf(el);
        if (index >= 0) return `${tag}:nth-of-type(${index + 1})`;
      }
      return tag;
    };

    // Buttons
    document.querySelectorAll("button, [role='button']").forEach((el) => {
      const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80);
      if (text.length > 1) {
        const sel = getSelector(el);
        elements.push(`[BUTTON selector="${sel}"] "${text}"`);
      }
    });

    // Apply/Submit links
    document.querySelectorAll("a[href]").forEach((el) => {
      const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80);
      const href = (el as HTMLAnchorElement).href;
      if (text && (text.toLowerCase().includes("apply") || text.toLowerCase().includes("submit") || text.toLowerCase().includes("upload") || href.includes("apply"))) {
        const sel = getSelector(el);
        elements.push(`[LINK selector="${sel}"] "${text}" href="${href}"`);
      }
    });

    // Form inputs
    document.querySelectorAll("input, textarea, select").forEach((el) => {
      const input = el as HTMLInputElement;
      const type = input.type || "text";
      const sel = getSelector(el);
      const placeholder = input.placeholder || "";
      const ariaLabel = input.getAttribute("aria-label") || "";
      const name = input.name || "";
      // Find label text
      const label = el.closest("label")?.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) || "";
      const id = el.id || "";
      const labelFor = id ? document.querySelector(`label[for="${id}"]`)?.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) || "" : "";
      const displayLabel = label || labelFor || ariaLabel || placeholder || name;
      const value = input.value || "";
      const checked = (type === "checkbox" || type === "radio") ? (input.checked ? " [CHECKED]" : " [unchecked]") : "";

      // For custom dropdowns: capture visible display text from parent container
      let displayText = "";
      const container = el.closest("[class*='select'], [class*='dropdown'], [class*='combobox'], [role='combobox']");
      if (container) {
        displayText = (container.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80);
      }

      // Mark fields as ALREADY FILLED if they have a value, so Claude skips them
      let filledMarker = "";
      if (value && type !== "hidden" && type !== "checkbox" && type !== "radio") {
        filledMarker = " [ALREADY FILLED - SKIP]";
      }
      // Special case: phone country codes like "+1" = United States
      let resolvedValue = value;
      if (value === "+1" && displayLabel.toLowerCase().includes("country")) {
        resolvedValue = "United States (+1)";
        filledMarker = " [ALREADY FILLED - SKIP]";
      }

      const displaySuffix = displayText && displayText !== value ? ` displayText="${displayText}"` : "";

      elements.push(`[INPUT selector="${sel}" type="${type}" label="${displayLabel}" value="${resolvedValue}"${checked}${filledMarker}${displaySuffix}]`);
    });

    return elements.join("\n");
  });

  // Scan iframes for additional interactive elements (Greenhouse, Lever, Workday embed in iframes)
  let iframeElements = "";
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    const frameUrl = frame.url();
    if (frameUrl === "about:blank" || frameUrl === "") continue;
    try {
      const frameContent = await frame.evaluate(() => {
        const elements: string[] = [];

        const getSelector = (el: Element): string => {
          if (el.id) return `#${CSS.escape(el.id)}`;
          const name = el.getAttribute("name");
          if (name) return `${el.tagName.toLowerCase()}[name="${name}"]`;
          const ariaLabel = el.getAttribute("aria-label");
          if (ariaLabel) return `${el.tagName.toLowerCase()}[aria-label="${ariaLabel}"]`;
          const placeholder = (el as HTMLInputElement).placeholder;
          if (placeholder) return `${el.tagName.toLowerCase()}[placeholder="${placeholder}"]`;
          const tag = el.tagName.toLowerCase();
          const parent = el.parentElement;
          if (parent) {
            const siblings = Array.from(parent.querySelectorAll(tag));
            const index = siblings.indexOf(el);
            if (index >= 0) return `${tag}:nth-of-type(${index + 1})`;
          }
          return tag;
        };

        document.querySelectorAll("button, [role='button']").forEach((el) => {
          const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80);
          if (text.length > 1) elements.push(`[BUTTON selector="${getSelector(el)}"] "${text}"`);
        });

        document.querySelectorAll("input, textarea, select").forEach((el) => {
          const input = el as HTMLInputElement;
          const type = input.type || "text";
          const sel = getSelector(el);
          const label = el.closest("label")?.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) || "";
          const id = el.id || "";
          const labelFor = id ? document.querySelector(`label[for="${id}"]`)?.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) || "" : "";
          const ariaLabel = input.getAttribute("aria-label") || "";
          const placeholder = input.placeholder || "";
          const name = input.name || "";
          const displayLabel = label || labelFor || ariaLabel || placeholder || name;
          const value = input.value || "";
          const checked = (type === "checkbox" || type === "radio") ? (input.checked ? " [CHECKED]" : " [unchecked]") : "";
          elements.push(`[INPUT selector="${sel}" type="${type}" label="${displayLabel}" value="${value}"${checked}]`);
        });

        return elements.join("\n");
      });
      if (frameContent.trim()) {
        iframeElements += `\n\n[IFRAME: ${frameUrl}]\n${frameContent}`;
      }
    } catch {}
  }

  return `URL: ${url}\nTitle: ${title}\n\nVisible text (truncated):\n${truncatedText}\n\nInteractive elements (use the selector= value for actions):\n${interactiveElements}${iframeElements}`;
}

/**
 * Ask Claude what action to take next on the current page.
 */
async function askClaudeNextAction(
  pageSnapshot: string,
  applicant: ApplicantData,
  stepNum: number,
  previousSteps: string[],
  targetRole?: string,
  skippedFields?: string[]
): Promise<AgentAction> {
  const recentSteps = previousSteps.slice(-8).join("\n");
  const failedActions = previousSteps
    .filter((s) => s.includes("Action failed") || s.includes("WARNING: Fill") || s.includes("SKIPPING"))
    .slice(-5)
    .join("\n");

  // Detect ATS from page snapshot URL
  const urlMatch = pageSnapshot.match(/^URL: (.+)$/m);
  const pageUrl = urlMatch?.[1] || "";
  const ats = detectATS(pageUrl);

  // Build application answers section
  let answersSection = "";
  if (applicationAnswers && Object.keys(applicationAnswers).length > 0) {
    const personal = applicationAnswers.personal as Record<string, string> | undefined;
    const background = applicationAnswers.backgroundQuestions as Record<string, string> | undefined;
    const education = applicationAnswers.education as Record<string, string> | undefined;
    const common = applicationAnswers.commonQuestions as Record<string, Record<string, string>> | undefined;
    const additional = applicationAnswers.additionalQuestions as Record<string, string> | undefined;

    // Find best matching role answers
    const roleKey = targetRole
      ? Object.keys(common || {}).find((k) => k.toLowerCase().includes(targetRole.toLowerCase().split(",")[0].trim().split("/")[0].trim()))
      : undefined;
    const roleAnswers = roleKey && common ? common[roleKey] : undefined;

    answersSection = `
APPLICATION ANSWERS (use these for form questions):
- LinkedIn: ${personal?.linkedin || ""}
- Website/Portfolio: ${personal?.website || ""}
- Pronouns: ${personal?.pronouns || "She/Her"}
- Name Pronunciation: Nyaradzo is pronounced "Nyah-RAD-zo", goes by Naya ("NAH-yah")
- Willing to Relocate: ${personal?.willingToRelocate || "Yes"}
- Remote Preference: ${personal?.remotePreference || "Remote or Hybrid"}
- Personal Preferences / Work Style: Remote or Hybrid
- Open to in-office: Yes
- Earliest Start Date: ${personal?.earliestStartDate || "Immediately"}
- Salary: ${personal?.salaryRules || "Open to discussion"}
- Years of Experience: ${personal?.yearsOfExperience || "5"}

EDUCATION:
- Degree: ${education?.degree || ""}
- School: ${education?.school || ""}
- Graduation Year: ${education?.graduationYear || ""}
- Certifications: ${education?.additionalCertifications || ""}

BACKGROUND/EEO (use for voluntary self-identification):
- Veteran Status: ${background?.veteranStatus || "No"}
- Disability: ${background?.disabilityStatus || "No"}
- Gender: ${background?.genderIdentity || "Female"}
- Race/Ethnicity: ${background?.race || "Black or African American"}
- Hispanic/Latino: ${background?.hispanicOrLatino || "No"}

${roleAnswers ? `ROLE-SPECIFIC ANSWERS (for free-text questions):
- Why this company: ${roleAnswers.whyThisCompany?.slice(0, 300) || ""}
- Why this role: ${roleAnswers.whyThisRole?.slice(0, 300) || ""}
- Tell me about yourself: ${roleAnswers.tellMeAboutYourself?.slice(0, 300) || ""}
- Greatest strength: ${roleAnswers.greatestStrength?.slice(0, 200) || ""}
- Greatest weakness: ${roleAnswers.greatestWeakness?.slice(0, 200) || ""}` : ""}

${additional ? `ADDITIONAL ANSWERS:
- How do you learn: ${additional.howDoYouLearn?.slice(0, 200) || ""}
- What makes you unique: ${additional.whatMakesYouUnique?.slice(0, 200) || ""}` : ""}`;
  }

  const prompt = `You are an AI agent applying to a job on behalf of a user. Analyze the current page and determine the SINGLE next action.
${ats !== "Unknown" ? `\nDETECTED ATS: ${ats} — use interaction patterns appropriate for this platform.` : ""}

APPLICANT INFO:
- First Name: ${applicant.firstName}
- Last Name: ${applicant.lastName}
- Email: ${applicant.email}
- Phone: ${applicant.phone}
- Country: ${applicant.countryOfResidence || "United States"}
- Location: ${applicant.usState || "Colorado"}, United States
- Preferred locations: Remote, US or Denver, CO area
- Work authorized in US: ${applicant.workAuthorized ? "Yes" : "No"}
- Needs sponsorship: ${applicant.needsSponsorship ? "Yes" : "No"}
- Resume: Already downloaded as PDF, ready for file input upload
${answersSection}

PREVIOUS STEPS TAKEN:
${recentSteps || "(first step)"}
${failedActions ? `\nFAILED ACTIONS (do NOT retry these exact selectors/approaches):\n${failedActions}` : ""}
${skippedFields && skippedFields.length > 0 ? `\nSKIPPED FIELDS (these could not be filled after multiple attempts — IGNORE them completely, do NOT try to fill them again):\n${skippedFields.join("\n")}\nFocus on other empty fields or click Submit if most fields are filled.` : ""}

CURRENT PAGE (step ${stepNum + 1}):
${pageSnapshot}

RULES:
1. Use the EXACT selector= value from the interactive elements list. Do NOT guess selectors.
2. If you see a job details page with an "Apply" button/link, click it.
3. Fill ONE field at a time. Use the EXACT values from APPLICANT INFO and APPLICATION ANSWERS above. Do NOT rephrase, elaborate, or add extra text. Use the value VERBATIM.
4. FIELD-TO-VALUE MAPPING (use these EXACT values):
   - "First Name" → ${applicant.firstName}
   - "Last Name" → ${applicant.lastName}
   - "Email" → ${applicant.email}
   - "Phone" → ${applicant.phone}
   - "Country" → "United States" (use select action)
   - "How do you pronounce your name" → "Nyah-RAD-zo, goes by Naya"
   - "Personal Preferences" or "Work Preference" → "Remote or Hybrid"
   - "Are you open to working in-person" or "in-office" → "Yes"
   - "Website" or "Portfolio" → "https://theblackfemaleengineer.com"
   - "LinkedIn" → "https://linkedin.com/in/theblackfemaleengineer"
   - "Pronouns" → "She/Her"
   - For any other field, find the matching value in APPLICATION ANSWERS above. If no match, leave it empty.
5. SKIP fields that already have a non-empty value (check the value= attribute). A Country field showing value="+1" is ALREADY set to United States — skip it.
6. For dropdown/select fields, use "select" action. If it fails, try "fill" instead.
7. For file uploads (type="file"), use the "upload" action.
8. For checkboxes, prefer Remote/US locations.
9. Click Submit when all required fields are filled (or skipped after failed attempts).
10. If you see "thank you"/"application received"/"submitted", return {"action": "done"}.
11. If LOGIN/password/CAPTCHA required, return {"action": "error", "message": "Login required"} or {"action": "error", "message": "CAPTCHA detected"}.
12. Do NOT repeat a failed action with the same selector. Try a different approach or move to the next field.
13. For EEO questions, use BACKGROUND answers. For free-text questions, use ROLE-SPECIFIC ANSWERS — copy them EXACTLY, do not rewrite.

Respond with ONLY a JSON object:
{"action": "click|fill|upload|check|select|done|error", "selector": "CSS selector or button text", "value": "for fill/select only", "selectors": ["for check only"], "reason": "brief why", "message": "for error only"}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    // Try to extract valid JSON — handle cases where Claude adds extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { action: "error", reason: "Claude returned no valid JSON", message: text.slice(0, 200) };
    }

    // Try parsing the match directly, then progressively trim if it fails
    let jsonStr = jsonMatch[0];
    try {
      return JSON.parse(jsonStr) as AgentAction;
    } catch {
      // Try to find the first complete JSON object by counting braces
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
          return JSON.parse(jsonStr.slice(0, endIdx + 1)) as AgentAction;
        } catch {}
      }
      return { action: "error", reason: "Could not parse Claude response as JSON", message: text.slice(0, 200) };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { action: "error", reason: `Claude API error: ${msg}`, message: msg };
  }
}

/**
 * Execute a Claude-decided action on the page with robust fallbacks.
 */
async function executeAction(page: Page, action: AgentAction, resumePath: string): Promise<void> {
  // Build a list of frames to try: main frame first, then iframes
  const framesToTry: Page[] = [page];
  for (const frame of page.frames()) {
    if (frame !== page.mainFrame() && frame.url() !== "about:blank" && frame.url() !== "") {
      framesToTry.push(frame as unknown as Page);
    }
  }
  // Try the action on each frame until one succeeds
  const targetPage = framesToTry[0];

  // Helper: try action on main frame, then iframes as fallback
  async function tryOnFrames(fn: (frame: Page) => Promise<void>): Promise<void> {
    for (const frame of framesToTry) {
      try {
        await fn(frame);
        return;
      } catch (err) {
        if (frame === framesToTry[framesToTry.length - 1]) throw err;
      }
    }
  }

  switch (action.action) {
    case "click":
      if (action.selector) {
        await tryOnFrames((frame) => robustClick(frame, action.selector!));
      }
      break;

    case "fill":
      if (action.selector && action.value !== undefined) {
        await tryOnFrames((frame) => robustFill(frame, action.selector!, action.value!));
      }
      break;

    case "upload":
      await tryOnFrames((frame) => robustUpload(frame, action.selector || 'input[type="file"]', resumePath));
      break;

    case "check":
      if (action.selectors) {
        for (const sel of action.selectors) {
          try {
            await tryOnFrames((frame) => robustClick(frame, sel));
          } catch {}
        }
      } else if (action.selector) {
        await tryOnFrames((frame) => robustClick(frame, action.selector!));
      }
      break;

    case "select":
      if (action.selector && action.value) {
        await tryOnFrames((frame) => robustSelect(frame, action.selector!, action.value!));
      }
      break;
  }
}

/**
 * Robust click — tries multiple strategies to click an element.
 */
async function robustClick(page: Page, selector: string): Promise<void> {
  // Strategy 1: Direct CSS selector
  try {
    await page.click(selector, { timeout: 4000 });
    return;
  } catch {}

  // Strategy 2: By visible text (handles "Apply now", "Submit", etc.)
  try {
    await page.getByText(selector, { exact: false }).first().click({ timeout: 4000 });
    return;
  } catch {}

  // Strategy 3: By role — try button first, then link
  try {
    await page.getByRole("button", { name: selector }).first().click({ timeout: 3000 });
    return;
  } catch {}

  try {
    await page.getByRole("link", { name: selector }).first().click({ timeout: 3000 });
    return;
  } catch {}

  // Strategy 4: Evaluate click in page context (bypasses Playwright actionability checks)
  try {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) el.click();
    }, selector);
    return;
  } catch {}

  throw new Error(`Could not click: ${selector}`);
}

/**
 * Robust fill — tries multiple strategies to fill an input.
 */
async function robustFill(page: Page, selector: string, value: string): Promise<void> {
  // Strategy 0: React-specific native value setter
  // React intercepts the native value setter on HTMLInputElement.prototype.
  // Setting value via the native setter + dispatching 'input' correctly triggers React's onChange.
  try {
    const filled = await page.evaluate(({ sel, val }) => {
      const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement;
      if (!el) return false;
      el.focus();
      const nativeSetter =
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set ||
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
      if (nativeSetter) {
        nativeSetter.call(el, val);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        // Also dispatch React 16+ compatible InputEvent
        el.dispatchEvent(new InputEvent("input", { bubbles: true, data: val }));
        return true;
      }
      return false;
    }, { sel: selector, val: value });
    if (filled) return;
  } catch {}

  // Strategy 1: Standard fill
  try {
    await page.fill(selector, value, { timeout: 4000 });
    return;
  } catch {}

  // Strategy 2: Click to focus, clear, then type character by character
  try {
    await page.click(selector, { timeout: 3000 });
    await page.keyboard.press("Control+a");
    await page.keyboard.type(value, { delay: 30 });
    return;
  } catch {}

  // Strategy 3: Find by locator, click, then type
  try {
    const locator = page.locator(selector).first();
    await locator.click({ timeout: 3000 });
    await page.keyboard.press("Control+a");
    await page.keyboard.type(value, { delay: 30 });
    return;
  } catch {}

  // Strategy 4: Try getByLabel if selector looks like a label
  try {
    const labelLocator = page.getByLabel(selector, { exact: false }).first();
    await labelLocator.click({ timeout: 3000 });
    await page.keyboard.press("Control+a");
    await page.keyboard.type(value, { delay: 30 });
    return;
  } catch {}

  // Strategy 5: JavaScript-based value setting with React native setter fallback
  try {
    await page.evaluate(({ sel, val }) => {
      const el = document.querySelector(sel) as HTMLInputElement;
      if (el) {
        el.focus();
        // Try React native setter first
        const nativeSetter =
          Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set ||
          Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        if (nativeSetter) {
          nativeSetter.call(el, val);
        } else {
          el.value = val;
        }
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new InputEvent("input", { bubbles: true, data: val }));
      }
    }, { sel: selector, val: value });
    return;
  } catch {}

  throw new Error(`Could not fill "${selector}" with value`);
}

/**
 * Robust file upload — tries multiple strategies.
 */
async function robustUpload(page: Page, selector: string, filePath: string): Promise<void> {
  // Strategy 1: Direct setInputFiles
  try {
    await page.setInputFiles(selector, filePath, { timeout: 5000 });
    return;
  } catch {}

  // Strategy 2: Find any file input
  try {
    await page.setInputFiles('input[type="file"]', filePath, { timeout: 5000 });
    return;
  } catch {}

  // Strategy 3: Make file input visible first (some are hidden), then set
  try {
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        input.style.display = "block";
        input.style.visibility = "visible";
        input.style.opacity = "1";
      }
    });
    await page.setInputFiles('input[type="file"]', filePath, { timeout: 5000 });
    return;
  } catch {}

  throw new Error(`Could not upload file to: ${selector}`);
}

/**
 * Robust select — tries native <select>, React custom dropdowns, and combobox patterns.
 */
async function robustSelect(page: Page, selector: string, value: string): Promise<void> {
  // Strategy 1: Native <select> element
  try {
    await page.selectOption(selector, value, { timeout: 4000 });
    return;
  } catch {}

  // Strategy 1b: Native <select> by label text
  try {
    await page.selectOption(selector, { label: value }, { timeout: 3000 });
    return;
  } catch {}

  // Strategy 2: Click to open dropdown, then use Playwright locator to click matching option
  // (Using locator.click() properly dispatches events for React/Ashby dropdowns)
  try {
    await page.click(selector, { timeout: 3000 });
    await page.waitForTimeout(500);
    // Wait for dropdown options to appear
    await page.waitForSelector(
      '[role="listbox"], [role="option"], [class*="dropdown"], [class*="menu"], [class*="option"], li',
      { timeout: 3000 }
    );
    await page.waitForTimeout(300);
    // Use Playwright's getByText to click the matching option (better event dispatching than evaluate)
    const option = page.getByText(value, { exact: false }).first();
    if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
      await option.click({ timeout: 3000 });
      return;
    }
  } catch {}

  // Strategy 2b: Click to open, then use evaluate to find and click with full event dispatch
  try {
    await page.click(selector, { timeout: 3000 });
    await page.waitForTimeout(500);
    await page.waitForSelector(
      '[role="listbox"], [role="option"], [class*="dropdown"], [class*="menu"], [class*="option"]',
      { timeout: 3000 }
    );
    const optionClicked = await page.evaluate((val) => {
      const optionSelectors = [
        '[role="option"]',
        '[class*="option"]',
        'li[data-value]',
        '[class*="menu"] li',
        '[class*="dropdown"] li',
        '[class*="listbox"] div',
      ];
      for (const sel of optionSelectors) {
        const options = Array.from(document.querySelectorAll(sel));
        for (const opt of options) {
          const text = (opt.textContent || "").trim();
          if (text.toLowerCase().includes(val.toLowerCase())) {
            // Full event dispatch for React compatibility
            opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            opt.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
            opt.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            (opt as HTMLElement).click();
            return true;
          }
        }
      }
      return false;
    }, value);
    if (optionClicked) return;
  } catch {}

  // Strategy 3: Type into combobox input and select first match
  try {
    await page.click(selector, { timeout: 3000 });
    await page.keyboard.press("Control+a");
    await page.keyboard.type(value, { delay: 50 });
    await page.waitForTimeout(1000);
    // Try clicking first visible option
    const optionHandle = await page.$('[role="option"], [class*="option"], li[data-value]');
    if (optionHandle) {
      await optionHandle.click();
    } else {
      await page.keyboard.press("Enter");
    }
    return;
  } catch {}

  // Strategy 3b: Focus input, clear with React setter, type value, then select option
  // Handles Ashby-style combobox inputs where typing filters a dropdown
  try {
    // Focus and clear the input
    await page.focus(selector);
    await page.waitForTimeout(200);
    // Triple-click to select all text
    await page.click(selector, { clickCount: 3, timeout: 3000 });
    await page.waitForTimeout(200);
    // Type the value slowly to trigger filtering
    await page.keyboard.type(value, { delay: 80 });
    await page.waitForTimeout(1500);
    // Look for the matching option in the dropdown
    const clicked = await page.evaluate((val) => {
      // Try various option selectors
      const selectors = ['[role="option"]', '[class*="option"]', '[class*="listbox"] > *', '[class*="menu"] > *', 'li'];
      for (const sel of selectors) {
        const options = Array.from(document.querySelectorAll(sel));
        for (const opt of options) {
          const text = (opt.textContent || "").trim();
          if (text.toLowerCase() === val.toLowerCase() || text.toLowerCase().includes(val.toLowerCase())) {
            (opt as HTMLElement).click();
            return true;
          }
        }
      }
      return false;
    }, value);
    if (clicked) return;
    // If no option found, try pressing down arrow and enter
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    return;
  } catch {}

  // Strategy 4: Click trigger, then find option by text content
  try {
    await page.click(selector, { timeout: 3000 });
    await page.waitForTimeout(500);
    await page.getByText(value, { exact: false }).first().click({ timeout: 3000 });
    return;
  } catch {}

  throw new Error(`Could not select "${value}" in: ${selector}`);
}
