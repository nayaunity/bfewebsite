/**
 * One-shot: dump the inner HTML structure of formField-source after a fresh
 * signup so we can write a correct selector.
 */
import { chromium } from "playwright";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_EMAIL = `probe-${Date.now().toString(36)}@apply.theblackfemaleengineer.com`;
const PASSWORD = `Pr${Date.now().toString(36)}!Ab8c#X2Q`;

async function main() {
  const r = await fetch(
    "https://walmart.wd5.myworkdayjobs.com/wday/cxs/walmart/WalmartExternal/jobs",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appliedFacets: {}, limit: 5, offset: 0, searchText: "intern" }) },
  );
  const data = (await r.json()) as { jobPostings?: Array<{ externalPath: string }> };
  const url = `https://walmart.wd5.myworkdayjobs.com/en-US/WalmartExternal${data.jobPostings![0].externalPath}`;

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 1200 },
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(`[data-automation-id="adventureButton"]`).first().click().catch(() => {});
  await page.waitForTimeout(1500);
  await page.locator(`[data-automation-id="applyManually"]`).first().click().catch(() => {});
  await page.waitForTimeout(1500);

  // Signup
  const e = page.locator(`[data-automation-id="email"]`).first();
  await e.click(); await e.pressSequentially(APP_EMAIL, { delay: 50 });
  const p = page.locator(`[data-automation-id="password"]`).first();
  await p.click(); await p.pressSequentially(PASSWORD, { delay: 50 });
  const v = page.locator(`[data-automation-id="verifyPassword"]`).first();
  await v.click(); await v.pressSequentially(PASSWORD, { delay: 50 });
  await v.press("Tab");
  await page.waitForTimeout(1500);

  const submit = page.locator(`[data-automation-id="createAccountSubmitButton"]`).first();
  try { await submit.click({ timeout: 4000 }); } catch { await submit.click({ force: true }); }
  await page.waitForTimeout(5000);

  // Click promptIcon to open
  await page.locator(`[data-automation-id="formField-source"] [data-automation-id="promptIcon"]`).click();
  await page.waitForTimeout(1500);

  // Dump first role="option" element's ancestor chain
  const info = await page.evaluate(`(function(){
    var first = document.querySelectorAll('[role="option"]')[0];
    if (!first) return 'no options';
    var chain = [];
    var el = first;
    while (el && el !== document.body) {
      var aid = el.getAttribute('data-automation-id') || '';
      var role = el.getAttribute('role') || '';
      var cls = (el.className || '').toString().slice(0, 40);
      chain.push(el.tagName.toLowerCase() + (aid ? '[aid='+aid+']' : '') + (role ? '[role='+role+']' : '') + (cls ? '[cls='+cls+']' : ''));
      el = el.parentElement;
    }
    return { firstText: ((first.innerText||first.textContent)||'').trim().slice(0,40), chain: chain.slice(0, 10) };
  })()`);
  console.log("First role=option's parent chain:");
  console.log(JSON.stringify(info, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
