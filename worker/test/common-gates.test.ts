import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { fillCommonGates, ashbyIdentityFill, leverIdentityFill } from "../src/common-gates";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function fixtureUrl(name: string): string {
  return "file://" + resolve(__dirname, "fixtures", name);
}

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
}, 30_000);

afterAll(async () => {
  await browser?.close();
});

async function newPage(url: string): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(url);
  return page;
}

describe("fillCommonGates — radio groups", () => {
  it("clicks Yes on in-office acknowledgement when user's stance is permissive", async () => {
    const page = await newPage(fixtureUrl("ashby-in-office-radio.html"));
    const steps: string[] = [];
    // workAuthorized=true → Yes; needsSponsorship=false → No.
    await fillCommonGates(
      page,
      { workAuthorized: true, needsSponsorship: false },
      steps
    );

    // Verify state
    const inoffice = await page.locator('input[name="inoffice"]:checked').getAttribute("value");
    const workauth = await page.locator('input[name="workauth"]:checked').getAttribute("value");
    const sponsor = await page.locator('input[name="sponsor"]:checked').getAttribute("value");
    const cert = await page.locator('input[name="cert"]').isChecked();

    expect(workauth).toBe("yes");
    expect(sponsor).toBe("no");
    // In-office defaults to "Yes" (answering No typically blocks the app).
    expect(inoffice).toBe("yes");
    // Cert checkbox must be checked.
    expect(cert).toBe(true);

    await page.close();
  }, 30_000);

  it("handles a user who is NOT work-authorized + needs sponsorship", async () => {
    const page = await newPage(fixtureUrl("ashby-in-office-radio.html"));
    const steps: string[] = [];
    await fillCommonGates(
      page,
      { workAuthorized: false, needsSponsorship: true },
      steps
    );

    const workauth = await page.locator('input[name="workauth"]:checked').getAttribute("value");
    const sponsor = await page.locator('input[name="sponsor"]:checked').getAttribute("value");

    expect(workauth).toBe("no");
    expect(sponsor).toBe("yes");

    await page.close();
  }, 30_000);
});

describe("fillCommonGates — demographic dropdowns", () => {
  it("selects a decline option for race/veteran/disability when no data provided", async () => {
    const page = await newPage(fixtureUrl("greenhouse-demographic-dropdown.html"));
    const steps: string[] = [];
    await fillCommonGates(page, {}, steps);

    const race = await page.locator("#race").inputValue();
    const vet = await page.locator("#vet").inputValue();
    const dis = await page.locator("#dis").inputValue();

    // Each should have selected *something* containing "Decline" or "don't wish"
    expect(race).toMatch(/Decline|don.t wish|Prefer/i);
    expect(vet).toMatch(/Decline|I am not|Prefer/i);
    expect(dis).toMatch(/don.t wish|Prefer|No,/i);

    await page.close();
  }, 30_000);
});

describe("ashbyIdentityFill", () => {
  it("fills name, email, phone, linkedin, location on Ashby-style inputs", async () => {
    const page = await newPage(fixtureUrl("ashby-identity-fields.html"));
    const steps: string[] = [];
    await ashbyIdentityFill(
      page,
      {
        firstName: "Morin",
        lastName: "Fagbodun",
        email: "morin@example.com",
        phone: "317-742-7905",
        linkedinUrl: "https://linkedin.com/in/morin",
        city: "Indianapolis",
      },
      steps
    );

    const name = await page.locator('input[name="_systemfield_name"]').inputValue();
    const email = await page.locator('input[name="_systemfield_email"]').inputValue();
    const phone = await page.locator('input[name="_systemfield_phoneNumber"]').inputValue();
    const linkedin = await page.locator('input[name="linkedin"]').inputValue();
    const location = await page.locator('input[name="_systemfield_location"]').inputValue();

    expect(name).toBe("Morin Fagbodun");
    expect(email).toBe("morin@example.com");
    expect(phone).toBe("317-742-7905");
    expect(linkedin).toBe("https://linkedin.com/in/morin");
    expect(location).toBe("Indianapolis");

    await page.close();
  }, 30_000);

  it("is a silent no-op when the selectors don't match (e.g., Greenhouse form)", async () => {
    // Using the demographic-only fixture — has no _systemfield_* selectors.
    const page = await newPage(fixtureUrl("greenhouse-demographic-dropdown.html"));
    const steps: string[] = [];
    await ashbyIdentityFill(
      page,
      {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: "555-1212",
      },
      steps
    );
    // No Ashby identity fields to match, so steps stays empty or only logs
    // "skip" messages — and critically no exception bubbles.
    expect(steps.length).toBeLessThanOrEqual(5);
    await page.close();
  }, 30_000);
});

describe("leverIdentityFill", () => {
  it("handles missing selectors silently on non-Lever pages", async () => {
    const page = await newPage(fixtureUrl("ashby-identity-fields.html"));
    const steps: string[] = [];
    await leverIdentityFill(
      page,
      {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: "555-1212",
      },
      steps
    );
    // Ashby fixture has no Lever-shaped name="name" / name="email" / name="phone"
    // at the top level (Ashby uses _systemfield_* prefixes), so fills are skipped.
    // Just assert no crash.
    expect(Array.isArray(steps)).toBe(true);
    await page.close();
  }, 30_000);
});
