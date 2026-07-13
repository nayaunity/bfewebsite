/**
 * E2E test for the referral feature using Playwright.
 * Requires: dev server running on localhost:3000, seed-e2e-user.ts already run.
 *
 * Usage: npx playwright test scripts/e2e-referrals.ts
 *   or:  npx tsx scripts/e2e-referrals.ts  (uses Playwright API directly)
 */

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const TEST_EMAIL = "e2e@test.local";

async function login(page: import("playwright").Page) {
  const res = await page.request.post(`${BASE}/api/dev/login`, {
    data: { email: TEST_EMAIL },
  });
  const body = await res.json();
  if (!body.ok) throw new Error(`Dev login failed: ${JSON.stringify(body)}`);
  console.log(`  Logged in as ${body.userId}`);
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results: { name: string; pass: boolean; error?: string }[] = [];

  async function run(name: string, fn: () => Promise<void>) {
    process.stdout.write(`\n[TEST] ${name}... `);
    try {
      await fn();
      results.push({ name, pass: true });
      console.log("PASS");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ name, pass: false, error: msg });
      console.log(`FAIL: ${msg}`);
    }
  }

  // ── Auth ──────────────────────────────────────────────────
  await run("Dev login sets session cookie", async () => {
    await login(page);
    const cookies = await context.cookies(BASE);
    const session = cookies.find((c) => c.name === "authjs.session-token");
    assert(!!session, "Session cookie not found");
    assert(session!.value.length > 50, "Session cookie looks too short");
  });

  // ── Applications dashboard ────────────────────────────────
  await run("Applications page loads with correct user data", async () => {
    await page.goto(`${BASE}/profile/applications`, { waitUntil: "networkidle" });
    const url = page.url();
    assert(!url.includes("/auth/signin"), "Redirected to sign-in (session not recognized)");
    assert(!url.includes("/get-started"), "Redirected to onboarding");
    const body = await page.textContent("body");
    assert(!!body, "Page body is empty");
    assert(body!.includes("Test") || body!.includes("Welcome"), "User name not found on page");
  });

  await run("Applications page shows browse discoveries", async () => {
    await page.goto(`${BASE}/profile/applications`, { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    assert(!!body, "Page body is empty");
    // The seeded user has 5 applications
    const hasCompany = ["Figma", "Stripe", "Anthropic", "Google", "Vercel"].some((c) =>
      body!.includes(c)
    );
    assert(hasCompany, "No seeded company names found on applications page");
  });

  // ── Referrals page ────────────────────────────────────────
  await run("Referrals page loads (not redirected)", async () => {
    await page.goto(`${BASE}/profile/referrals`, { waitUntil: "networkidle" });
    const url = page.url();
    assert(!url.includes("/auth/signin"), "Redirected to sign-in");
    assert(!url.includes("/applications"), "Redirected to applications (beta flag blocking?)");
    assert(url.includes("/referrals"), "Not on the referrals page");
  });

  await run("Referrals page shows LinkedIn connections", async () => {
    await page.goto(`${BASE}/profile/referrals`, { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    assert(!!body, "Page body is empty");
    const hasConnection = ["Amara Okonkwo", "Jordan Williams", "Priya Sharma", "Marcus Chen"].some(
      (name) => body!.includes(name)
    );
    assert(hasConnection, "No seeded connection names found on referrals page");
  });

  await run("Referrals page shows connection count", async () => {
    await page.goto(`${BASE}/profile/referrals`, { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    assert(!!body, "Page body is empty");
    assert(body!.includes("4") || body!.includes("connections"), "Connection count not visible");
  });

  // ── Referral dashboard heading ────────────────────────────
  await run("Referrals page shows personalized heading", async () => {
    await page.goto(`${BASE}/profile/referrals`, { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    assert(!!body, "Page body is empty");
    // The page heading uses firstName: "Test, use your network..."
    assert(
      body!.includes("Test,") || body!.includes("Use your network"),
      "Personalized heading not found"
    );
  });

  // ── Job board ─────────────────────────────────────────────
  await run("Job board loads", async () => {
    await page.goto(`${BASE}/jobs`, { waitUntil: "networkidle" });
    const url = page.url();
    assert(url.includes("/jobs"), "Not on jobs page");
    const body = await page.textContent("body");
    assert(!!body && body.length > 200, "Job board page looks empty");
  });

  // ── API: connection counts ────────────────────────────────
  await run("Connection counts API returns data", async () => {
    const res = await page.request.get(`${BASE}/api/referrals/connection-counts`);
    assert(res.status() === 200, `Status ${res.status()} instead of 200`);
    const data = await res.json();
    assert(typeof data === "object", "Response is not an object");
    // Should have counts for companies where the test user has connections
    const hasAnyCounts = Object.values(data).some((v) => (v as number) > 0);
    assert(hasAnyCounts, `No connection counts returned: ${JSON.stringify(data)}`);
  });

  // ── API: warm matches ─────────────────────────────────────
  await run("Warm matches API returns data", async () => {
    const res = await page.request.get(`${BASE}/api/referrals/warm-matches`);
    assert(res.status() === 200, `Status ${res.status()} instead of 200`);
    const data = await res.json();
    assert(Array.isArray(data), "Response is not an array");
  });

  // ── Summary ───────────────────────────────────────────────
  console.log("\n\n═══════════════════════════════════════");
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length} tests`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    for (const r of results.filter((r) => !r.pass)) {
      console.log(`  ✗ ${r.name}: ${r.error}`);
    }
  }

  console.log("═══════════════════════════════════════\n");

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
