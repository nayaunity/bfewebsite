/**
 * Smoke-test company apply paths before adding them to the
 * auto-apply-companies.json scrape list.
 *
 * For each candidate company:
 *   1. Fetch one CURRENT internship URL via the company's ATS API
 *   2. Run `applyToJob` with DRY_RUN=true (fills form, stops at submit)
 *   3. Record pass/fail per company
 *
 * Companies that fail get noted; only passing companies are safe to add to
 * the scrape list. Avoids the BLOCKED_COMPANIES bloat we hit when adding
 * the Ashby cluster (OpenAI, Ramp, Notion etc.) without testing first.
 *
 * Env:
 *   DATABASE_URL, DATABASE_AUTH_TOKEN     — Turso prod (read test user)
 *   ANTHROPIC_API_KEY                       — Claude calls during apply
 *   INTEGRATION_TEST_USER_ID=1d16e543-db6e-497b-b78b-28fbf0a30626
 *
 * Usage:
 *   cd worker
 *   DATABASE_URL=... DATABASE_AUTH_TOKEN=... ANTHROPIC_API_KEY=... \
 *   INTEGRATION_TEST_USER_ID=1d16e543-db6e-497b-b78b-28fbf0a30626 \
 *   tsx test/integration/smoke-companies.ts
 *
 * Output: writes per-company results to stdout AND to
 *   worker/test/integration/smoke-results-{timestamp}.json
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import { createClient } from "@libsql/client";
import { applyToJob } from "../../src/apply-engine";

process.env.DRY_RUN = process.env.DRY_RUN ?? "true";
process.env.HEADLESS = process.env.HEADLESS ?? "true";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type Ats = "greenhouse" | "lever" | "ashby" | "workday" | "custom";

interface WorkdayConfig {
  baseUrl: string;
  company: string;
  siteName: string;
}

interface Candidate {
  company: string;
  companySlug: string;
  ats: Ats;
  /** Greenhouse boardToken / Lever companySlug / Ashby boardSlug. */
  boardSlug?: string;
  /** Workday tenant config. */
  workday?: WorkdayConfig;
  /** Mark control rows so we can sanity-check the harness against known-passing companies. */
  control?: boolean;
}

// Workday tenants whose API validates (the 4 with correct host+siteName).
// Snowflake (Phenom), ServiceNow (SmartRecruiters), Intuit (Lever) — not on Workday.
const WORKDAY_ONLY_CANDIDATES: Candidate[] = [
  { company: "Cloudflare",   companySlug: "cloudflare",  ats: "greenhouse", boardSlug: "cloudflare",  control: true },
  // Validated tenants (5)
  { company: "Salesforce",   companySlug: "salesforce",  ats: "workday",    workday: { baseUrl: "https://salesforce.wd12.myworkdayjobs.com", company: "salesforce", siteName: "External_Career_Site" } },
  { company: "Adobe",        companySlug: "adobe",       ats: "workday",    workday: { baseUrl: "https://adobe.wd5.myworkdayjobs.com",       company: "adobe",      siteName: "external_experienced" } },
  { company: "Cisco",        companySlug: "cisco",       ats: "workday",    workday: { baseUrl: "https://cisco.wd5.myworkdayjobs.com",       company: "cisco",      siteName: "Cisco_Careers" } },
  { company: "Capital One",  companySlug: "capitalone",  ats: "workday",    workday: { baseUrl: "https://capitalone.wd12.myworkdayjobs.com", company: "capitalone", siteName: "Capital_One" } },
  { company: "Walmart",      companySlug: "walmart",     ats: "workday",    workday: { baseUrl: "https://walmart.wd5.myworkdayjobs.com",     company: "walmart",    siteName: "WalmartExternal" } },
  // New tenants (20, pending smoke validation)
  { company: "Netflix",           companySlug: "netflix",          ats: "workday", workday: { baseUrl: "https://netflix.wd108.myworkdayjobs.com",    company: "netflix",     siteName: "Netflix" } },
  { company: "Intel",             companySlug: "intel",            ats: "workday", workday: { baseUrl: "https://intel.wd1.myworkdayjobs.com",        company: "intel",       siteName: "External" } },
  { company: "NVIDIA",            companySlug: "nvidia",           ats: "workday", workday: { baseUrl: "https://nvidia.wd5.myworkdayjobs.com",       company: "nvidia",      siteName: "NVIDIAExternalCareerSite" } },
  { company: "HP Inc",            companySlug: "hp",               ats: "workday", workday: { baseUrl: "https://hp.wd5.myworkdayjobs.com",           company: "hp",          siteName: "ExternalCareerSite" } },
  { company: "HPE",               companySlug: "hpe",              ats: "workday", workday: { baseUrl: "https://hpe.wd5.myworkdayjobs.com",          company: "hpe",         siteName: "Jobsathpe" } },
  { company: "Broadcom",          companySlug: "broadcom",         ats: "workday", workday: { baseUrl: "https://broadcom.wd1.myworkdayjobs.com",     company: "broadcom",    siteName: "External_Career" } },
  { company: "Visa",              companySlug: "visa",             ats: "workday", workday: { baseUrl: "https://visa.wd5.myworkdayjobs.com",         company: "visa",        siteName: "Visa" } },
  { company: "Mastercard",        companySlug: "mastercard",       ats: "workday", workday: { baseUrl: "https://mastercard.wd1.myworkdayjobs.com",   company: "mastercard",  siteName: "CorporateCareers" } },
  { company: "Morgan Stanley",    companySlug: "morganstanley",    ats: "workday", workday: { baseUrl: "https://ms.wd5.myworkdayjobs.com",           company: "ms",          siteName: "External" } },
  { company: "Bank of America",   companySlug: "bankofamerica",    ats: "workday", workday: { baseUrl: "https://ghr.wd1.myworkdayjobs.com",          company: "ghr",         siteName: "Lateral-US" } },
  { company: "PwC",               companySlug: "pwc",              ats: "workday", workday: { baseUrl: "https://pwc.wd3.myworkdayjobs.com",          company: "pwc",         siteName: "Global_Experienced_Careers" } },
  { company: "Target",            companySlug: "target",           ats: "workday", workday: { baseUrl: "https://target.wd5.myworkdayjobs.com",       company: "target",      siteName: "targetcareers" } },
  { company: "Johnson & Johnson", companySlug: "jnj",              ats: "workday", workday: { baseUrl: "https://jj.wd5.myworkdayjobs.com",           company: "jj",          siteName: "JJ" } },
  { company: "Procter & Gamble",  companySlug: "pg",               ats: "workday", workday: { baseUrl: "https://pg.wd5.myworkdayjobs.com",           company: "pg",          siteName: "1000" } },
  { company: "GE Aerospace",      companySlug: "geaerospace",      ats: "workday", workday: { baseUrl: "https://geaerospace.wd5.myworkdayjobs.com",  company: "geaerospace", siteName: "GE_ExternalSite" } },
  { company: "GE Vernova",        companySlug: "gevernova",        ats: "workday", workday: { baseUrl: "https://gevernova.wd5.myworkdayjobs.com",    company: "gevernova",   siteName: "Vernova_ExternalSite" } },
  { company: "GE HealthCare",     companySlug: "gehealthcare",     ats: "workday", workday: { baseUrl: "https://gehc.wd5.myworkdayjobs.com",         company: "gehc",        siteName: "GEHC_ExternalSite" } },
  { company: "Boeing",            companySlug: "boeing",           ats: "workday", workday: { baseUrl: "https://boeing.wd1.myworkdayjobs.com",       company: "boeing",      siteName: "EXTERNAL_CAREERS" } },
  { company: "Northrop Grumman",  companySlug: "northropgrumman",  ats: "workday", workday: { baseUrl: "https://ngc.wd1.myworkdayjobs.com",          company: "ngc",         siteName: "Northrop_Grumman_External_Site" } },
  { company: "RTX",               companySlug: "rtx",              ats: "workday", workday: { baseUrl: "https://globalhr.wd5.myworkdayjobs.com",     company: "globalhr",    siteName: "REC_RTX_Ext_Gateway" } },
];

// Sprint-1 iteration loop: just Walmart. Skips control + irrelevant tenants
// so iteration cycles are 1-2 min instead of 12 min.
const WALMART_ONLY_CANDIDATES: Candidate[] = [
  { company: "Walmart",      companySlug: "walmart",     ats: "workday",    workday: { baseUrl: "https://walmart.wd5.myworkdayjobs.com",     company: "walmart",    siteName: "WalmartExternal" } },
];

const CISCO_ONLY_CANDIDATES: Candidate[] = [
  { company: "Cisco",        companySlug: "cisco",       ats: "workday",    workday: { baseUrl: "https://cisco.wd5.myworkdayjobs.com",       company: "cisco",      siteName: "Cisco_Careers" } },
];

const SINGLE_COMPANY_CANDIDATES: Candidate[] = process.env.SMOKE_SINGLE
  ? [{ company: process.env.SMOKE_SINGLE, companySlug: process.env.SMOKE_SINGLE.toLowerCase().replace(/\s+/g, ""), ats: "workday" as Ats,
       workday: (() => {
         const match = WORKDAY_ONLY_CANDIDATES.find((c) => c.company.toLowerCase() === process.env.SMOKE_SINGLE!.toLowerCase());
         return match?.workday;
       })() }].filter((c) => c.workday) as Candidate[]
  : [];

const CANDIDATES: Candidate[] = process.env.SMOKE_SINGLE
  ? SINGLE_COMPANY_CANDIDATES
  : process.env.SMOKE_CISCO_ONLY === "1"
  ? CISCO_ONLY_CANDIDATES
  : process.env.SMOKE_WALMART_ONLY === "1"
  ? WALMART_ONLY_CANDIDATES
  : process.env.SMOKE_WORKDAY_ONLY === "1" ? WORKDAY_ONLY_CANDIDATES : [
  // 3 control companies — already in auto-apply-companies.json and known to apply.
  { company: "Cloudflare",   companySlug: "cloudflare",  ats: "greenhouse", boardSlug: "cloudflare",  control: true },
  { company: "Twilio",       companySlug: "twilio",      ats: "greenhouse", boardSlug: "twilio",      control: true },
  { company: "Brex",         companySlug: "brex",        ats: "greenhouse", boardSlug: "brex",        control: true },

  // === Workday boards (validated) ===
  { company: "Salesforce",   companySlug: "salesforce",  ats: "workday",    workday: { baseUrl: "https://salesforce.wd12.myworkdayjobs.com", company: "salesforce",   siteName: "External_Career_Site" } },
  { company: "Adobe",        companySlug: "adobe",       ats: "workday",    workday: { baseUrl: "https://adobe.wd5.myworkdayjobs.com",       company: "adobe",        siteName: "external_experienced" } },
  { company: "Cisco",        companySlug: "cisco",       ats: "workday",    workday: { baseUrl: "https://cisco.wd5.myworkdayjobs.com",       company: "cisco",        siteName: "Cisco_Careers" } },
  { company: "Capital One",  companySlug: "capitalone",  ats: "workday",    workday: { baseUrl: "https://capitalone.wd12.myworkdayjobs.com", company: "capitalone",   siteName: "Capital_One" } },
  { company: "Walmart",      companySlug: "walmart",     ats: "workday",    workday: { baseUrl: "https://walmart.wd5.myworkdayjobs.com",     company: "walmart",      siteName: "WalmartExternal" } },

  // === Greenhouse — intern + FT pipelines, mostly NEW ===
  { company: "Pinterest",    companySlug: "pinterest",   ats: "greenhouse", boardSlug: "pinterest" },
  { company: "Dropbox",      companySlug: "dropbox",     ats: "greenhouse", boardSlug: "dropbox" },
  { company: "Block",        companySlug: "block",       ats: "greenhouse", boardSlug: "block" },
  { company: "PayPal",       companySlug: "paypal",      ats: "greenhouse", boardSlug: "paypal" },
  { company: "Lattice",      companySlug: "lattice",     ats: "greenhouse", boardSlug: "lattice" },
  { company: "Rippling",     companySlug: "rippling",    ats: "greenhouse", boardSlug: "rippling" },
  { company: "Toast",        companySlug: "toasttab",    ats: "greenhouse", boardSlug: "toasttab" },
  { company: "Instacart",    companySlug: "instacart",   ats: "greenhouse", boardSlug: "instacart" },
  // Re-tests with FT fallback for the Phase B skipped-no-intern cohort
  { company: "Mercury",      companySlug: "mercury",     ats: "greenhouse", boardSlug: "mercury" },
  { company: "Coinbase",     companySlug: "coinbase",    ats: "greenhouse", boardSlug: "coinbase" },
  { company: "Robinhood",    companySlug: "robinhood",   ats: "greenhouse", boardSlug: "robinhood" },
  { company: "Discord",      companySlug: "discord",     ats: "greenhouse", boardSlug: "discord" },
  { company: "MongoDB",      companySlug: "mongodb",     ats: "greenhouse", boardSlug: "mongodb" },
  { company: "Coursera",     companySlug: "coursera",    ats: "greenhouse", boardSlug: "coursera" },
  { company: "Box",          companySlug: "box",         ats: "greenhouse", boardSlug: "boxinc" },
  // 404'd before — last alternate slug attempts
  { company: "HashiCorp",    companySlug: "hashicorp",   ats: "greenhouse", boardSlug: "hashicorpinc" },
  { company: "DraftKings",   companySlug: "draftkings",  ats: "greenhouse", boardSlug: "draftkings" },

  // === Lever — niche but known ===
  { company: "Lemonade",     companySlug: "lemonade",    ats: "lever",      boardSlug: "lemonade" },
  { company: "KOHO",         companySlug: "koho",        ats: "lever",      boardSlug: "koho" },
  { company: "Pleo",         companySlug: "pleo",        ats: "lever",      boardSlug: "pleo" },

  // === Ashby — re-tests + new ===
  { company: "Vercel",       companySlug: "vercel",      ats: "ashby",      boardSlug: "vercel" },
  { company: "Modal",        companySlug: "modal",       ats: "ashby",      boardSlug: "modal" },
  { company: "Supabase",     companySlug: "supabase",    ats: "ashby",      boardSlug: "supabase" },
  { company: "Pinecone",     companySlug: "pinecone",    ats: "ashby",      boardSlug: "pinecone" },
  { company: "Wealthfront",  companySlug: "wealthfront", ats: "ashby",      boardSlug: "wealthfront" },
  { company: "Checkr",       companySlug: "checkr",      ats: "ashby",      boardSlug: "checkr" },
];

const INTERN_TITLE_RX = /\b(intern|internship|co-?op|summer\s+(analyst|associate|engineer|intern))\b/i;
const INTERN_NEGATIVE_RX = /\bintern\s+program\s+manager\b|\bintern\s+coordinator\b|\bmanages?\s+interns?\b/i;
const INTERN_SOFT_NEGATIVE_RX = /\binternal\b|\binternational\b/i;
const INTERN_STANDALONE_RX = /\b(intern|internship|co-?op)\b/i;

function looksLikeIntern(title: string): boolean {
  if (!INTERN_TITLE_RX.test(title)) return false;
  if (INTERN_NEGATIVE_RX.test(title)) return false;
  if (INTERN_SOFT_NEGATIVE_RX.test(title)) {
    const stripped = title.replace(/\binternal\b|\binternational\b/gi, " ");
    return INTERN_STANDALONE_RX.test(stripped);
  }
  return true;
}

interface FetchResult {
  url: string | null;
  title: string | null;
  kind?: "intern" | "ft";
  reason?: string;
}

interface UrlCandidate {
  url: string;
  title: string;
}

async function fetchAllJobs(c: Candidate): Promise<{ jobs: UrlCandidate[]; reason?: string }> {
  if (c.ats === "custom") return { jobs: [], reason: "no_api" };

  if (c.ats === "greenhouse") {
    if (!c.boardSlug) return { jobs: [], reason: "no_slug" };
    const url = `https://boards-api.greenhouse.io/v1/boards/${c.boardSlug}/jobs?content=false`;
    const r = await fetch(url);
    if (!r.ok) return { jobs: [], reason: `greenhouse_${r.status}` };
    const data = await r.json() as { jobs?: Array<{ id: number; title: string; absolute_url: string }> };
    return { jobs: (data.jobs ?? []).map((j) => ({ url: j.absolute_url, title: j.title })) };
  }

  if (c.ats === "lever") {
    if (!c.boardSlug) return { jobs: [], reason: "no_slug" };
    const url = `https://api.lever.co/v0/postings/${c.boardSlug}?limit=200`;
    const r = await fetch(url);
    if (!r.ok) return { jobs: [], reason: `lever_${r.status}` };
    const data = await r.json() as Array<{ id: string; text: string; hostedUrl: string }>;
    return { jobs: (data ?? []).map((j) => ({ url: j.hostedUrl, title: j.text })) };
  }

  if (c.ats === "ashby") {
    if (!c.boardSlug) return { jobs: [], reason: "no_slug" };
    const url = `https://api.ashbyhq.com/posting-api/job-board/${c.boardSlug}`;
    const r = await fetch(url);
    if (!r.ok) return { jobs: [], reason: `ashby_${r.status}` };
    const data = await r.json() as { jobs?: Array<{ id: string; title: string; applyUrl: string }> };
    return { jobs: (data.jobs ?? []).map((j) => ({ url: j.applyUrl, title: j.title })) };
  }

  if (c.ats === "workday") {
    if (!c.workday) return { jobs: [], reason: "no_workday_config" };
    const { baseUrl, company, siteName } = c.workday;
    const apiUrl = `${baseUrl}/wday/cxs/${company}/${siteName}/jobs`;
    // Workday rejects `limit > 20` with HTTP 400. Match the production scraper.
    const r = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: "" }),
    });
    if (!r.ok) return { jobs: [], reason: `workday_${r.status}` };
    const data = await r.json() as { jobPostings?: Array<{ title: string; externalPath: string }> };
    return {
      jobs: (data.jobPostings ?? []).map((j) => ({
        url: `${baseUrl}/en-US/${siteName}${j.externalPath}`,
        title: j.title,
      })),
    };
  }

  return { jobs: [], reason: "unsupported_ats" };
}

/**
 * Returns the first intern URL on the board. If none exists, falls back to
 * the first FT URL — proves the worker can apply to *some* job on this
 * company's careers site, which is what we need to gate auto-apply-list
 * inclusion.
 */
async function fetchOneTestUrl(c: Candidate): Promise<FetchResult> {
  const { jobs, reason } = await fetchAllJobs(c);
  if (jobs.length === 0) return { url: null, title: null, reason: reason ?? "empty_board" };

  const intern = jobs.find((j) => looksLikeIntern(j.title));
  if (intern) return { url: intern.url, title: intern.title, kind: "intern" };

  // FT fallback. Prefer a senior-ish IC role over a manager/leadership one
  // for the test profile (yoe=0). Use a tech-sounding title heuristic.
  const ftPreferred =
    jobs.find((j) => /\b(software|engineer|developer|product|design|data|analyst)\b/i.test(j.title)) ??
    jobs[0];
  return { url: ftPreferred.url, title: ftPreferred.title, kind: "ft" };
}

interface SmokeResult {
  company: string;
  companySlug: string;
  ats: Ats;
  control: boolean;
  url: string | null;
  jobTitle: string | null;
  urlKind?: "intern" | "ft";
  outcome: "passed" | "failed" | "skipped_no_url";
  errorMessage?: string;
  durationMs: number;
  steps?: string[];
}

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const testUserId = process.env.INTEGRATION_TEST_USER_ID;
  if (!testUserId) {
    console.error("INTEGRATION_TEST_USER_ID env var required");
    process.exit(1);
  }

  // Load test user
  const userRow = await db.execute(
    `SELECT id, firstName, lastName, email, applicationEmail, phone, city, usState, countryOfResidence, linkedinUrl, yearsOfExperience, targetRole, workAuthorized, needsSponsorship, remotePreference, race, pronouns, resumeUrl, resumeName, subscriptionTier FROM User WHERE id = '${testUserId}' AND role = 'test' LIMIT 1`
  );
  if (userRow.rows.length === 0) {
    console.error(`Test user not found: ${testUserId}`);
    process.exit(1);
  }
  const u = userRow.rows[0] as unknown as {
    firstName: string; lastName: string; email: string; applicationEmail: string | null; phone: string;
    city: string | null; usState: string | null; countryOfResidence: string | null;
    linkedinUrl: string | null; yearsOfExperience: string | null;
    targetRole: string | null; workAuthorized: number | null;
    needsSponsorship: number | null; remotePreference: string | null;
    race: string | null; pronouns: string | null;
    resumeUrl: string | null; resumeName: string | null; subscriptionTier: string | null;
  };
  if (!u.resumeUrl) {
    console.error("Test user has no resumeUrl");
    process.exit(1);
  }

  // SMOKE_FRESH_EMAIL=1 mints a single-use recon-{rand}@apply.* address for
  // this run so Workday signup goes down the create-account path even when
  // the test user already has an account on the tenant. Revert this block
  // (and its env-var consumer below) once the consolidated path is verified.
  const freshSmokeEmail = process.env.SMOKE_FRESH_EMAIL === "1"
    ? `recon-${randomBytes(4).toString("hex")}@apply.theblackfemaleengineer.com`
    : null;
  if (freshSmokeEmail) {
    console.log(`[smoke] SMOKE_FRESH_EMAIL=1 -> using ${freshSmokeEmail}`);
  }

  const applicant = {
    firstName: u.firstName || "",
    lastName: u.lastName || "",
    // Match production browse-loop.ts:407 — prefer applicationEmail so ATS
    // verification + Workday signup land at the apply.* address SendGrid
    // routes to our InboundEmail webhook.
    email: freshSmokeEmail || u.applicationEmail || u.email || "",
    phone: u.phone || "",
    city: u.city || undefined,
    usState: u.usState || undefined,
    countryOfResidence: u.countryOfResidence || "United States",
    linkedinUrl: u.linkedinUrl || undefined,
    // Force student-shape values for the smoke run so intern forms get
    // filled with sensible answers (no awkward "5 years experience" on an
    // internship form).
    yearsOfExperience: "0",
    workAuthorized: u.workAuthorized === 1 ? true : u.workAuthorized === 0 ? false : true,
    needsSponsorship: u.needsSponsorship === 1 ? true : u.needsSponsorship === 0 ? false : false,
    remotePreference: u.remotePreference || "Remote or Hybrid",
    race: u.race || undefined,
    pronouns: u.pronouns || undefined,
  };
  const resumeUrl = u.resumeUrl;
  const resumeName = u.resumeName || "resume.pdf";

  console.log(`\n=== smoke-companies (DRY_RUN=${process.env.DRY_RUN}, ${CANDIDATES.length} companies) ===\n`);

  const results: SmokeResult[] = [];

  for (const c of CANDIDATES) {
    const tag = c.control ? "CTRL" : "CAND";
    process.stdout.write(`[${tag}] ${c.company.padEnd(15)} ${c.ats.padEnd(11)}`);

    const fetched = await fetchOneTestUrl(c);
    if (!fetched.url) {
      console.log(`   skipped (${fetched.reason})`);
      results.push({
        company: c.company,
        companySlug: c.companySlug,
        ats: c.ats,
        control: c.control === true,
        url: null,
        jobTitle: null,
        outcome: "skipped_no_url",
        errorMessage: fetched.reason,
        durationMs: 0,
      });
      continue;
    }

    const kindLabel = fetched.kind === "ft" ? "FT" : "intern";
    process.stdout.write(`   ${kindLabel} url found, applying...`);
    const start = Date.now();
    try {
      const res = await applyToJob(
        fetched.url,
        applicant as Parameters<typeof applyToJob>[1],
        resumeUrl,
        resumeName,
        fetched.kind === "ft" ? "Software Engineer" : "Software Engineer Intern",
        u.subscriptionTier || "free",
        fetched.title || (fetched.kind === "ft" ? "Software Engineer" : "Intern"),
        testUserId
      );
      const dur = Date.now() - start;
      const outcome: SmokeResult["outcome"] = res.success ? "passed" : "failed";
      console.log(`   ${outcome.toUpperCase()} (${(dur / 1000).toFixed(1)}s)${res.error ? `  err=${res.error.slice(0, 100)}` : ""}`);
      results.push({
        company: c.company,
        companySlug: c.companySlug,
        ats: c.ats,
        control: c.control === true,
        url: fetched.url,
        jobTitle: fetched.title,
        urlKind: fetched.kind,
        outcome,
        errorMessage: res.error,
        durationMs: dur,
        steps: res.steps?.slice(-30),
      });
    } catch (err) {
      const dur = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`   CRASH (${(dur / 1000).toFixed(1)}s)  ${msg.slice(0, 120)}`);
      results.push({
        company: c.company,
        companySlug: c.companySlug,
        ats: c.ats,
        control: c.control === true,
        url: fetched.url,
        jobTitle: fetched.title,
        urlKind: fetched.kind,
        outcome: "failed",
        errorMessage: msg,
        durationMs: dur,
      });
    }
  }

  // Summary
  const passed = results.filter((r) => r.outcome === "passed");
  const failed = results.filter((r) => r.outcome === "failed");
  const skipped = results.filter((r) => r.outcome === "skipped_no_url");
  const ctrlPassed = passed.filter((r) => r.control).length;
  const ctrlTotal = results.filter((r) => r.control).length;
  const candPassed = passed.filter((r) => !r.control).length;
  const candTotal = results.filter((r) => !r.control).length;

  console.log(`\n=== Summary ===`);
  console.log(`  Controls: ${ctrlPassed}/${ctrlTotal} passed`);
  console.log(`  Candidates: ${candPassed}/${candTotal} passed`);
  console.log(`  Failed: ${failed.length}`);
  console.log(`  Skipped (no URL): ${skipped.length}`);

  console.log(`\nPassing candidates (safe to add to auto-apply-companies.json):`);
  for (const r of passed.filter((r) => !r.control)) {
    console.log(`  ${r.company.padEnd(15)} ${r.ats.padEnd(11)} :: ${r.jobTitle}`);
  }
  if (failed.length > 0) {
    console.log(`\nFailures (DO NOT add):`);
    for (const r of failed) {
      console.log(`  ${r.company.padEnd(15)} ${r.ats.padEnd(11)} :: ${r.errorMessage?.slice(0, 100) ?? "unknown"}`);
    }
  }
  if (skipped.length > 0) {
    console.log(`\nSkipped (couldn't find an intern URL):`);
    for (const r of skipped) {
      console.log(`  ${r.company.padEnd(15)} ${r.ats.padEnd(11)} :: ${r.errorMessage}`);
    }
  }

  // Persist for follow-up
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = resolve(__dirname, `smoke-results-${ts}.json`);
  writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
  console.log(`\nWrote ${outPath}`);
}

main().catch((e) => {
  console.error("smoke-companies crashed:", e);
  process.exit(1);
});
