/**
 * Smoke-probe iCIMS-backed careers sites to scope a future iCIMS deterministic
 * handler (analog to worker/src/workday/).
 *
 * For each candidate company:
 *   1. Navigate to the careers URL from the prod catalog
 *   2. Follow the apply link
 *   3. Capture: final URL, login wall presence, Create Account button,
 *      email/password field IDs (if any), and a screenshot
 *
 * No DB writes. No actual apply submission. Output is read-only and used to
 * decide whether iCIMS is uniform enough across tenants to write one handler.
 *
 * Usage:
 *   cd worker
 *   tsx test/integration/icims-smoke.ts
 *
 * Output: worker/test/integration/icims-smoke-{timestamp}.json
 *         worker/test/integration/icims-smoke-{slug}-{timestamp}.png  (per tenant)
 */

import { chromium, type Page } from "playwright";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Candidate {
  company: string;
  slug: string;
  startUrl: string;
}

// Pulled from the prod catalog query of active source="manual" jobs whose
// applyUrl matches /icims\.com/i OR is a careers.* host known to redirect.
// Each entry uses one representative apply URL — the smoke is per-tenant, not
// per-job, since iCIMS form layout is shared across a tenant's job board.
const CANDIDATES: Candidate[] = [
  { company: "Arm",            slug: "arm",            startUrl: "https://careers.arm.com/job/chandler/intern-ai-engineer-cpu/33099/92596916400" },
  { company: "Docusign",       slug: "docusign",       startUrl: "https://careers.docusign.com/jobs/28491?lang=en-us&previousLocale=en-US" },
  { company: "Garmin",         slug: "garmin",         startUrl: "https://careers.garmin.com/jobs/18077?lang=en-us&iis=Job+Board&iisn=LinkedIn" },
  { company: "Carmax",         slug: "carmax",         startUrl: "https://careers.carmax.com/associate-product-manager/job/51C7A1E17CE171DBF2260EAEB78D03E3?source=BY-LinkedIn" },
  { company: "Iridium",        slug: "iridium",        startUrl: "https://careers-iridium.icims.com/jobs/4865/business-systems-analyst-ii/job" },
  { company: "Daktronics",     slug: "daktronics",     startUrl: "https://careers-daktronics.icims.com/jobs/7327/business-process-analyst/job" },
  { company: "Canon USA",      slug: "canon-usa",      startUrl: "https://external-canoncareers.icims.com/jobs/33960/associate-proposal-analyst/job" },
  { company: "GovCIO",         slug: "govcio",         startUrl: "https://careers-govcio.icims.com/jobs/7852/job" },
  { company: "Amivero",        slug: "amivero",        startUrl: "https://careers-amivero.icims.com/jobs/1515/data-analyst/job" },
  { company: "Consilio",       slug: "consilio",       startUrl: "https://careers-consilio.icims.com/jobs/3886/business-analyst/job" },
  { company: "TekSynap",       slug: "teksynap",       startUrl: "https://careers-teksynap.icims.com/jobs/9080/junior-software-developer/job" },
  { company: "Sonalysts",      slug: "sonalysts",      startUrl: "https://careers-sonalysts.icims.com/jobs/2392/junior-software-engineer/job" },
  { company: "CHA",            slug: "cha",            startUrl: "https://jobs-challp.icims.com/jobs/7212/software-quality-assurance-analyst/job" },
];

interface Probe {
  company: string;
  slug: string;
  startUrl: string;
  finalUrl: string;
  applyUrl: string | null;
  reachedIcims: boolean;
  reachedLogin: boolean;
  hasCreateAccountButton: boolean;
  emailFieldSelector: string | null;
  passwordFieldSelector: string | null;
  registrationUrl: string | null;
  notes: string[];
  error: string | null;
}

async function probeOne(page: Page, c: Candidate): Promise<Probe> {
  const notes: string[] = [];
  const result: Probe = {
    company: c.company,
    slug: c.slug,
    startUrl: c.startUrl,
    finalUrl: "",
    applyUrl: null,
    reachedIcims: false,
    reachedLogin: false,
    hasCreateAccountButton: false,
    emailFieldSelector: null,
    passwordFieldSelector: null,
    registrationUrl: null,
    notes,
    error: null,
  };

  try {
    await page.goto(c.startUrl, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {
      notes.push("networkidle timed out — proceeding");
    });
    await page.waitForTimeout(2000);
    notes.push(`navigated to: ${page.url()}`);

    const applyLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
      for (const a of links) {
        const t = (a.textContent || "").trim().toLowerCase();
        const h = a.href || "";
        if ((t.includes("apply") || h.includes("apply")) && (h.includes("icims") || h.includes("careers"))) {
          return h;
        }
      }
      const icimsAny = links.find((a) => a.href.includes("icims.com"));
      return icimsAny?.href ?? null;
    });
    result.applyUrl = applyLink;

    if (applyLink) {
      notes.push(`apply link: ${applyLink}`);
      await page.goto(applyLink, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {
        notes.push("apply link networkidle timed out");
      });
      await page.waitForTimeout(2000);
    }

    result.finalUrl = page.url();
    result.reachedIcims = result.finalUrl.toLowerCase().includes("icims.com");
    const lowerUrl = result.finalUrl.toLowerCase();
    result.reachedLogin = ["login", "signin", "sign-in", "auth/", "/u/login"].some((p) => lowerUrl.includes(p));

    const createAccount = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll<HTMLElement>("a, button"));
      return all.some((el) => {
        const t = (el.textContent || "").trim().toLowerCase();
        return t === "create account" || t === "create an account" || t === "sign up" || t === "register" || t.includes("new user");
      });
    });
    result.hasCreateAccountButton = createAccount;

    const fields = await page.evaluate(() => {
      const out: { email: string | null; password: string | null; registerHref: string | null } = {
        email: null,
        password: null,
        registerHref: null,
      };
      const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input"));
      for (const i of inputs) {
        const id = i.id || i.name || "";
        const type = (i.type || "").toLowerCase();
        if (!out.email && (type === "email" || /email|user/i.test(id))) {
          out.email = `#${i.id || ""}|name=${i.name || ""}|type=${type}`;
        }
        if (!out.password && type === "password") {
          out.password = `#${i.id || ""}|name=${i.name || ""}`;
        }
      }
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
      const reg = links.find((a) => /register|signup|sign[-_]?up|create/i.test((a.textContent || "") + " " + (a.href || "")));
      if (reg) out.registerHref = reg.href;
      return out;
    });
    result.emailFieldSelector = fields.email;
    result.passwordFieldSelector = fields.password;
    result.registrationUrl = fields.registerHref;

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const shotPath = resolve(__dirname, `icims-smoke-${c.slug}-${ts}.png`);
    await page.screenshot({ path: shotPath, fullPage: false }).catch(() => {});
    notes.push(`screenshot: ${shotPath}`);
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 1200 },
  });

  const probes: Probe[] = [];
  for (const c of CANDIDATES) {
    const page = await ctx.newPage();
    console.log(`Probing ${c.company}...`);
    const probe = await probeOne(page, c);
    probes.push(probe);
    console.log(`  finalUrl=${probe.finalUrl}`);
    console.log(`  reachedIcims=${probe.reachedIcims} reachedLogin=${probe.reachedLogin} createAcct=${probe.hasCreateAccountButton}`);
    await page.close();
  }

  await browser.close();

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const out = resolve(__dirname, `icims-smoke-${ts}.json`);
  writeFileSync(out, JSON.stringify(probes, null, 2));
  console.log(`\nResults written to: ${out}`);

  const summary = {
    total: probes.length,
    reachedIcims: probes.filter((p) => p.reachedIcims).length,
    reachedLogin: probes.filter((p) => p.reachedLogin).length,
    hasCreateAccount: probes.filter((p) => p.hasCreateAccountButton).length,
    withEmailField: probes.filter((p) => p.emailFieldSelector).length,
    errors: probes.filter((p) => p.error).length,
  };
  console.log("\nSummary:", summary);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
