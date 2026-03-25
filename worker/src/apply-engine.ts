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
    for (let step = 0; step < MAX_STEPS; step++) {
      const snapshot = await getPageSnapshot(page);
      steps.push(`Step ${step + 1}: analyzing page (${snapshot.length} chars)`);

      const action = await askClaudeNextAction(snapshot, applicant, step);
      steps.push(`Claude: ${action.action} — ${action.reason}`);

      if (action.action === "done") {
        return { success: true, steps };
      }

      if (action.action === "error") {
        return { success: false, error: action.message || action.reason, steps };
      }

      try {
        await executeAction(page, action, tmpPath);
        await page.waitForTimeout(2000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        steps.push(`Action failed: ${msg}`);
        // Continue — Claude can try a different approach on the next step
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
 * Get a compact text snapshot of the page for Claude to analyze.
 */
async function getPageSnapshot(page: Page): Promise<string> {
  const url = page.url();
  const title = await page.title();

  // Get visible text + interactive elements
  const content = await page.evaluate(() => {
    const elements: string[] = [];

    // Collect interactive elements and text content
    const walk = (node: Element, depth: number) => {
      const tag = node.tagName?.toLowerCase();
      if (!tag) return;

      // Skip hidden elements
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return;

      // Interactive elements — show with details
      if (tag === "input" || tag === "textarea" || tag === "select") {
        const type = node.getAttribute("type") || "text";
        const name = node.getAttribute("name") || "";
        const placeholder = node.getAttribute("placeholder") || "";
        const label = node.getAttribute("aria-label") || "";
        const id = node.getAttribute("id") || "";
        const value = (node as HTMLInputElement).value || "";
        const disabled = (node as HTMLInputElement).disabled ? " [disabled]" : "";
        elements.push(`[${"  ".repeat(depth)}${tag}] type=${type} name="${name}" placeholder="${placeholder}" label="${label}" id="${id}" value="${value}"${disabled}`);
        return;
      }

      if (tag === "button" || (tag === "a" && node.getAttribute("href"))) {
        const text = (node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100);
        const href = node.getAttribute("href") || "";
        if (text.length > 1) {
          elements.push(`[${"  ".repeat(depth)}${tag}] "${text}"${href ? ` href="${href}"` : ""}`);
        }
        return;
      }

      // Headings and labels
      if (tag.match(/^h[1-6]$/) || tag === "label") {
        const text = (node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 200);
        if (text) elements.push(`[${"  ".repeat(depth)}${tag}] ${text}`);
        return;
      }

      // Checkboxes inside labels
      if (tag === "label") {
        const text = (node.textContent || "").trim().replace(/\s+/g, " ");
        const checkbox = node.querySelector("input[type='checkbox']");
        if (checkbox) {
          const checked = (checkbox as HTMLInputElement).checked ? " [checked]" : "";
          elements.push(`[${"  ".repeat(depth)}checkbox] "${text}"${checked}`);
          return;
        }
      }

      // Recurse into children
      for (const child of Array.from(node.children)) {
        walk(child, depth + 1);
      }
    };

    walk(document.body, 0);
    return elements.slice(0, 100).join("\n"); // Limit to avoid token explosion
  });

  return `URL: ${url}\nTitle: ${title}\n\nPage elements:\n${content}`;
}

/**
 * Ask Claude what action to take next on the current page.
 */
async function askClaudeNextAction(
  pageSnapshot: string,
  applicant: ApplicantData,
  stepNum: number
): Promise<AgentAction> {
  const prompt = `You are an AI agent applying to a job on behalf of a user. Analyze the page and determine the single next action to take.

APPLICANT INFO:
- First Name: ${applicant.firstName}
- Last Name: ${applicant.lastName}
- Email: ${applicant.email}
- Phone: ${applicant.phone}
- Location: ${applicant.usState || "Colorado"}, United States
- Preferred locations: Remote, US or Denver, CO area
- Work authorized in US: ${applicant.workAuthorized ? "Yes" : "No"}
- Needs sponsorship: ${applicant.needsSponsorship ? "Yes" : "No"}
- Resume: Already downloaded as PDF, will be uploaded via file input

CURRENT PAGE (step ${stepNum + 1}):
${pageSnapshot}

INSTRUCTIONS:
- If you see a job details page with an "Apply" or "Apply now" button, click it.
- If you see a form, fill in fields one at a time. Fill the most important unfilled field.
- For file upload inputs (type=file), use the "upload" action to upload the resume.
- For location checkboxes, prefer "Remote" or the closest US location. Use "check" action with an array of selectors.
- For dropdowns/selects, use the "select" action.
- If the page shows a confirmation or "thank you" message, the application was submitted — use "done".
- If the page requires login or account creation that can't be bypassed, use "error".
- If you've already submitted and the page changed, check if it's a success confirmation.

Respond with ONLY a JSON object (no markdown, no explanation):
{"action": "click|fill|upload|check|select|done|error", "selector": "CSS selector or text", "value": "for fill/select", "selectors": ["for check"], "reason": "brief explanation"}`;

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
