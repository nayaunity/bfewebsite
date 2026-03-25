import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";

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

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
    (window as unknown as Record<string, unknown>).chrome = { runtime: {} };
  });

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

const MAX_STEPS = 12;

/**
 * Apply to a single job using Claude-driven browser automation.
 * Claude analyzes each page and decides the next action.
 */
export async function applyToJob(
  applyUrl: string,
  applicant: ApplicantData,
  resumeUrl: string,
  resumeName: string
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

    // Agent loop — Claude decides each step
    let previousUrl = page.url();
    let samePageCount = 0;

    for (let step = 0; step < MAX_STEPS; step++) {
      const currentUrl = page.url();
      if (currentUrl !== previousUrl) {
        steps.push(`Page navigated to: ${currentUrl}`);
        previousUrl = currentUrl;
        samePageCount = 0;
      } else {
        samePageCount++;
      }

      // Stuck detection — if we've been on the same page for 4+ actions, bail
      if (samePageCount >= 4) {
        return { success: false, error: "Stuck: page not changing after multiple actions", steps };
      }

      const snapshot = await getPageSnapshot(page);
      steps.push(`Step ${step + 1}: analyzing page (${snapshot.length} chars)`);

      const action = await askClaudeNextAction(snapshot, applicant, step, steps);
      steps.push(`Claude: ${action.action} — ${action.reason}`);

      if (action.action === "done") {
        return { success: true, steps };
      }

      if (action.action === "error") {
        return { success: false, error: action.message || action.reason, steps };
      }

      try {
        await executeAction(page, action, tmpPath);
        // Wait for potential navigation
        await page.waitForTimeout(3000);
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

/**
 * Get a snapshot of the page for Claude to analyze.
 * Uses visible text + a focused list of interactive elements.
 */
async function getPageSnapshot(page: Page): Promise<string> {
  const url = page.url();
  const title = await page.title();

  // Get visible page text (compact)
  const visibleText = await page.innerText("body").catch(() => "");
  const truncatedText = visibleText.replace(/\s+/g, " ").trim().slice(0, 2000);

  // Get all interactive elements separately for precision
  const interactiveElements = await page.evaluate(() => {
    const elements: string[] = [];

    // Buttons
    document.querySelectorAll("button, [role='button']").forEach((el) => {
      const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80);
      if (text) elements.push(`[BUTTON] "${text}"`);
    });

    // Links that look like buttons or important actions
    document.querySelectorAll("a[href]").forEach((el) => {
      const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80);
      const href = (el as HTMLAnchorElement).href;
      if (text && (text.toLowerCase().includes("apply") || text.toLowerCase().includes("submit") || href.includes("apply"))) {
        elements.push(`[LINK] "${text}" href="${href}"`);
      }
    });

    // Form inputs
    document.querySelectorAll("input, textarea, select").forEach((el) => {
      const input = el as HTMLInputElement;
      const type = input.type || "text";
      const name = input.name || "";
      const id = input.id || "";
      const placeholder = input.placeholder || "";
      const ariaLabel = input.getAttribute("aria-label") || "";
      const label = el.closest("label")?.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) || "";
      // Find associated label via for attribute
      const labelFor = id ? document.querySelector(`label[for="${id}"]`)?.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) || "" : "";
      const value = input.value || "";
      const checked = input.type === "checkbox" || input.type === "radio" ? (input.checked ? " [CHECKED]" : " [unchecked]") : "";

      elements.push(`[INPUT type="${type}" name="${name}" id="${id}" placeholder="${placeholder}" aria-label="${ariaLabel}" label="${label || labelFor}" value="${value}"${checked}]`);
    });

    return elements.join("\n");
  });

  return `URL: ${url}\nTitle: ${title}\n\nVisible text (truncated):\n${truncatedText}\n\nInteractive elements:\n${interactiveElements}`;
}

/**
 * Ask Claude what action to take next on the current page.
 */
async function askClaudeNextAction(
  pageSnapshot: string,
  applicant: ApplicantData,
  stepNum: number,
  previousSteps: string[]
): Promise<AgentAction> {
  const recentSteps = previousSteps.slice(-4).join("\n");

  const prompt = `You are an AI agent applying to a job on behalf of a user. Analyze the current page and determine the SINGLE next action.

APPLICANT INFO:
- First Name: ${applicant.firstName}
- Last Name: ${applicant.lastName}
- Email: ${applicant.email}
- Phone: ${applicant.phone}
- Location: ${applicant.usState || "Colorado"}, United States
- Preferred locations: Remote, US or Denver, CO area
- Work authorized in US: ${applicant.workAuthorized ? "Yes" : "No"}
- Needs sponsorship: ${applicant.needsSponsorship ? "Yes" : "No"}
- Resume: Already downloaded as PDF, ready for file input upload

PREVIOUS STEPS TAKEN:
${recentSteps || "(first step)"}

CURRENT PAGE (step ${stepNum + 1}):
${pageSnapshot}

RULES:
1. If you see a job details page with an "Apply" or "Apply now" button/link, click it using {"action": "click", "selector": "text=Apply now"} or the link's text.
2. If you see an application form with inputs, fill one field at a time. Use CSS selectors like "input[name='firstName']" or "#email".
3. For file uploads (type="file"), use {"action": "upload", "selector": "input[type='file']"}.
4. For checkboxes (location preferences), prefer Remote/US locations. Use {"action": "check", "selectors": ["input[value='Remote']"]} or click the checkbox labels.
5. For the Submit button, click it: {"action": "click", "selector": "text=Submit"}.
6. If you see a "thank you", "application received", or "submitted" confirmation, return {"action": "done", "reason": "application submitted"}.
7. If the page requires LOGIN, account creation, or asks for a password, return {"action": "error", "message": "Login required to apply"}.
8. If you see a CAPTCHA or verification challenge, return {"action": "error", "message": "CAPTCHA detected"}.
9. Do NOT repeat a failed action. If previous steps show the same action failing, try a different approach or return error.

Respond with ONLY a JSON object:
{"action": "click|fill|upload|check|select|done|error", "selector": "CSS selector or button text", "value": "for fill/select only", "selectors": ["for check only"], "reason": "brief why", "message": "for error only"}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { action: "error", reason: "Claude returned no valid JSON", message: text.slice(0, 200) };
    }

    return JSON.parse(jsonMatch[0]) as AgentAction;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { action: "error", reason: `Claude API error: ${msg}`, message: msg };
  }
}

/**
 * Execute a Claude-decided action on the page.
 */
async function executeAction(page: Page, action: AgentAction, resumePath: string): Promise<void> {
  switch (action.action) {
    case "click":
      if (action.selector) {
        // Try as CSS selector first, then as text selector
        try {
          await page.click(action.selector, { timeout: 5000 });
        } catch {
          // Try finding by text content
          await page.getByText(action.selector, { exact: false }).first().click({ timeout: 5000 });
        }
      }
      break;

    case "fill":
      if (action.selector && action.value) {
        try {
          await page.fill(action.selector, action.value, { timeout: 5000 });
        } catch {
          await page.locator(action.selector).first().fill(action.value, { timeout: 5000 });
        }
      }
      break;

    case "upload":
      if (action.selector) {
        await page.setInputFiles(action.selector, resumePath, { timeout: 5000 });
      } else {
        // Default: find any file input
        await page.setInputFiles('input[type="file"]', resumePath, { timeout: 5000 });
      }
      break;

    case "check":
      if (action.selectors) {
        for (const sel of action.selectors) {
          try {
            await page.check(sel, { timeout: 3000 });
          } catch {
            // Try clicking instead (some checkboxes need click, not check)
            try {
              await page.click(sel, { timeout: 3000 });
            } catch {}
          }
        }
      }
      break;

    case "select":
      if (action.selector && action.value) {
        await page.selectOption(action.selector, action.value, { timeout: 5000 });
      }
      break;
  }
}
