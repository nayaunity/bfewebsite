import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

let browser: Browser | null = null;

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
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
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });
  }
  return browser;
}

/**
 * Create a stealth browser context with anti-detection measures.
 */
export async function createStealthContext(): Promise<BrowserContext> {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent: randomUserAgent(),
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    timezoneId: "America/Denver",
    permissions: ["geolocation"],
    geolocation: { latitude: 39.7392, longitude: -104.9903 }, // Denver
  });

  // Patch navigator.webdriver to be undefined
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
    // Override navigator.plugins to look real
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
    // Override navigator.languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
    // Chrome runtime
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
}

/**
 * Apply to a single job using browser automation.
 */
export async function applyToJob(
  applyUrl: string,
  applicant: ApplicantData,
  resumeUrl: string,
  resumeName: string
): Promise<ApplyResult> {
  const context = await createStealthContext();
  const page = await context.newPage();

  try {
    // Download resume to temp file
    const tmpPath = join(tmpdir(), `resume-${Date.now()}.pdf`);
    const resumeResponse = await page.request.get(resumeUrl);
    const resumeBuffer = await resumeResponse.body();
    writeFileSync(tmpPath, resumeBuffer);

    // Navigate to the job application page
    await page.goto(applyUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for an Apply button and click it
    const applyButton = await findApplyButton(page);
    if (applyButton) {
      await applyButton.click();
      await page.waitForTimeout(2000);
    }

    // Fill in the form
    await fillForm(page, applicant, tmpPath);

    // Look for submit button and click
    const submitButton = await findSubmitButton(page);
    if (submitButton) {
      await submitButton.click();
      await page.waitForTimeout(3000);
    } else {
      // Clean up temp file
      try { unlinkSync(tmpPath); } catch {}
      return { success: false, error: "Could not find submit button" };
    }

    // Clean up temp file
    try { unlinkSync(tmpPath); } catch {}

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    await context.close();
  }
}

async function findApplyButton(page: Page) {
  const selectors = [
    'a:has-text("Apply")',
    'button:has-text("Apply")',
    '[data-testid*="apply"]',
    'a[href*="apply"]',
  ];

  for (const selector of selectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible().catch(() => false)) {
      return el;
    }
  }
  return null;
}

async function findSubmitButton(page: Page) {
  const selectors = [
    'button[type="submit"]',
    'button:has-text("Submit")',
    'button:has-text("Apply")',
    'input[type="submit"]',
  ];

  for (const selector of selectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible().catch(() => false)) {
      return el;
    }
  }
  return null;
}

async function fillForm(
  page: Page,
  applicant: ApplicantData,
  resumePath: string
): Promise<void> {
  // Fill text fields by common patterns
  const fieldMap: Array<{ patterns: string[]; value: string }> = [
    {
      patterns: ['[name*="first_name"]', '[name*="firstName"]', '[id*="first"]', 'input[placeholder*="First"]'],
      value: applicant.firstName,
    },
    {
      patterns: ['[name*="last_name"]', '[name*="lastName"]', '[id*="last"]', 'input[placeholder*="Last"]'],
      value: applicant.lastName,
    },
    {
      patterns: ['[name*="email"]', '[type="email"]', '[id*="email"]'],
      value: applicant.email,
    },
    {
      patterns: ['[name*="phone"]', '[type="tel"]', '[id*="phone"]'],
      value: applicant.phone,
    },
  ];

  for (const { patterns, value } of fieldMap) {
    for (const pattern of patterns) {
      const el = page.locator(pattern).first();
      if (await el.isVisible().catch(() => false)) {
        await el.fill(value);
        break;
      }
    }
  }

  // Upload resume
  const fileInputs = page.locator('input[type="file"]');
  const fileCount = await fileInputs.count();
  if (fileCount > 0) {
    await fileInputs.first().setInputFiles(resumePath);
  }

  // Handle work authorization dropdowns/radios
  if (applicant.workAuthorized !== undefined) {
    const authLabel = applicant.workAuthorized ? "Yes" : "No";
    const authSelectors = [
      `label:has-text("authorized") >> .. >> input`,
      `select:near(:text("authorized"))`,
    ];
    for (const sel of authSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible().catch(() => false)) {
          const tag = await el.evaluate((e) => e.tagName.toLowerCase());
          if (tag === "select") {
            await el.selectOption({ label: authLabel });
          }
          break;
        }
      } catch {}
    }
  }
}
