/**
 * Walmart Workday recon: navigates to a current intern URL, walks through the
 * apply flow up to the auth gate, and dumps every `data-automation-id`
 * attribute + every button label + every form field at each step.
 *
 * Output: worker/test/integration/recon-walmart-{timestamp}.json — a list
 * of "page snapshots" we can mine for selectors when writing auth.ts and
 * wizard.ts.
 *
 * No form submissions, no signup attempts. This is read-only reconnaissance.
 *
 * Usage:
 *   cd worker
 *   npx tsx test/integration/recon-walmart.ts
 */

import { chromium, type Page } from "playwright";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ElementSnap {
  tag: string;
  automationId: string | null;
  role: string | null;
  ariaLabel: string | null;
  name: string | null;
  type: string | null;
  text: string;
  visible: boolean;
}

interface PageSnap {
  step: string;
  url: string;
  title: string;
  htmlBytes: number;
  buttonsAndLinks: ElementSnap[];
  inputs: ElementSnap[];
  automationIds: string[];
}

async function snapshotPage(page: Page, step: string): Promise<PageSnap> {
  await page.waitForTimeout(2000);

  // Use a single inline expression so tsx helper injection (__name etc.)
  // doesn't get pulled into the browser context where it's undefined.
  const data = await page.evaluate(`(function(){
    function visible(el) {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }
    function snap(el) {
      return {
        tag: el.tagName.toLowerCase(),
        automationId: el.getAttribute('data-automation-id'),
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        name: el.getAttribute('name'),
        type: el.getAttribute('type'),
        text: ((el.innerText || el.textContent) || '').trim().slice(0, 100),
        visible: visible(el),
      };
    }
    const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'))
      .map(snap).filter(function(s){ return s.visible; });
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
      .map(snap).filter(function(s){ return s.visible; });
    const allAutomationIds = Array.from(document.querySelectorAll('[data-automation-id]'))
      .map(function(el){ return el.getAttribute('data-automation-id'); })
      .filter(function(v){ return !!v; });
    return {
      url: location.href,
      title: document.title,
      htmlBytes: document.documentElement.outerHTML.length,
      buttonsAndLinks: buttons,
      inputs: inputs,
      automationIds: Array.from(new Set(allAutomationIds)),
    };
  })()`) as Omit<PageSnap, "step">;

  return { step, ...data };
}

async function fetchOneInternUrl(): Promise<{ url: string; title: string } | null> {
  const r = await fetch(
    "https://walmart.wd5.myworkdayjobs.com/wday/cxs/walmart/WalmartExternal/jobs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        appliedFacets: {},
        limit: 20,
        offset: 0,
        searchText: "intern",
      }),
    },
  );
  if (!r.ok) {
    console.error(`Workday API ${r.status} for Walmart`);
    return null;
  }
  const data = (await r.json()) as {
    jobPostings?: Array<{ title: string; externalPath: string }>;
  };
  const intern = (data.jobPostings ?? []).find((j) => /intern/i.test(j.title));
  if (!intern) {
    console.warn("No current Walmart intern listings; falling back to first job");
    const first = data.jobPostings?.[0];
    if (!first) return null;
    return {
      url: `https://walmart.wd5.myworkdayjobs.com/en-US/WalmartExternal${first.externalPath}`,
      title: first.title,
    };
  }
  return {
    url: `https://walmart.wd5.myworkdayjobs.com/en-US/WalmartExternal${intern.externalPath}`,
    title: intern.title,
  };
}

async function tryClick(page: Page, selectors: string[], step: string): Promise<boolean> {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`  [${step}] Clicking selector: ${sel}`);
        await loc.click({ timeout: 5000 });
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(2000);
        return true;
      }
    } catch (e) {
      // try next
    }
  }
  return false;
}

async function main() {
  const target = await fetchOneInternUrl();
  if (!target) {
    console.error("Couldn't find any Walmart job URL.");
    process.exit(1);
  }
  console.log(`Target: ${target.title}\n${target.url}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  const snaps: PageSnap[] = [];

  try {
    // Step 1: land on the listing
    await page.goto(target.url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);
    snaps.push(await snapshotPage(page, "01-listing"));
    console.log(`[01-listing] url=${page.url()} title=${await page.title()}`);

    // Step 2: click "Apply" — try common labels and automation ids
    const applyClicked = await tryClick(
      page,
      [
        'button[data-automation-id="adventureButton"]',
        '[data-automation-id="apply"]',
        'a[data-automation-id="adventureButton"]',
        'button:has-text("Apply")',
        'a:has-text("Apply")',
        'a[href*="apply"]',
      ],
      "02-apply-click",
    );
    if (applyClicked) {
      snaps.push(await snapshotPage(page, "02-after-apply-click"));
      console.log(`[02-after-apply-click] url=${page.url()}`);
    } else {
      console.log("[02] Could not find an Apply button");
    }

    // Step 3: if we hit a "How would you like to apply?" gate, click "Apply Manually" or similar
    const manualClicked = await tryClick(
      page,
      [
        'button[data-automation-id="applyManually"]',
        'a[data-automation-id="applyManually"]',
        '[data-automation-id="useMyLastApplication"]',
        'button:has-text("Apply Manually")',
        'button:has-text("Autofill")',
        'a:has-text("Apply Manually")',
      ],
      "03-manual-click",
    );
    if (manualClicked) {
      snaps.push(await snapshotPage(page, "03-after-manual-click"));
      console.log(`[03-after-manual-click] url=${page.url()}`);
    } else {
      console.log("[03] No Apply-Manually gate (or auto-passed)");
    }

    // Step 4: signin / signup screen
    const createClicked = await tryClick(
      page,
      [
        'button[data-automation-id="createAccountLink"]',
        'a[data-automation-id="createAccountLink"]',
        'button:has-text("Create Account")',
        'a:has-text("Create Account")',
        'button:has-text("New User")',
      ],
      "04-create-account",
    );
    if (createClicked) {
      snaps.push(await snapshotPage(page, "04-create-account-form"));
      console.log(`[04-create-account-form] url=${page.url()}`);
    } else {
      console.log("[04] No Create Account button reached");
    }

    // Take a screenshot of the final state for human review
    const screenshotPath = resolve(__dirname, "recon-walmart-final.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\nFinal screenshot: ${screenshotPath}`);
  } catch (e) {
    console.error("Recon error:", e instanceof Error ? e.message : e);
  } finally {
    await context.close();
    await browser.close();
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = resolve(__dirname, `recon-walmart-${ts}.json`);
  writeFileSync(outPath, JSON.stringify({ target, generatedAt: new Date().toISOString(), snaps }, null, 2));
  console.log(`\nWrote ${outPath}`);

  // Print compact summary for quick eyeball
  console.log("\n=== Recon Summary ===");
  for (const s of snaps) {
    console.log(`\n[${s.step}] ${s.url}`);
    console.log(`  title: "${s.title}"`);
    console.log(`  ${s.buttonsAndLinks.length} buttons/links, ${s.inputs.length} inputs, ${s.automationIds.length} unique automation IDs`);
    const interesting = s.automationIds.filter((id) =>
      /apply|sign|create|account|email|password|next|submit|continue/i.test(id),
    );
    if (interesting.length > 0) {
      console.log(`  interesting automation IDs: ${interesting.join(", ")}`);
    }
  }
}

main().catch((e) => {
  console.error("recon-walmart crashed:", e);
  process.exit(1);
});
