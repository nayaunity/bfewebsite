/**
 * Real-URL integration runner.
 *
 * Walks the URL catalog at worker/test/integration/url-catalog.json and
 * invokes `applyToJob()` on each URL with a seeded test user. Writes
 * per-URL results into an IntegrationRun row on the production DB so
 * regressions are visible in /admin.
 *
 * Safe to run from Railway as a scheduled job, or locally for smoke
 * testing. Uses the Turso prod DB (read-only for the catalog + write of
 * the IntegrationRun row).
 *
 * Env:
 *   DATABASE_URL, DATABASE_AUTH_TOKEN  — Turso prod credentials
 *   INTEGRATION_TEST_USER_ID            — seeded user with role='test'
 *   USE_BROWSERBASE=true|false           — forwards to applyToJob
 *   INTEGRATION_KIND=nightly|canary|ad-hoc  — default: ad-hoc
 *   INTEGRATION_URL_LIMIT=<n>            — optional, cap URLs run (canary)
 *
 * Usage:
 *   npx tsx test/integration/real-urls.ts
 *   INTEGRATION_KIND=canary INTEGRATION_URL_LIMIT=10 npx tsx test/integration/real-urls.ts
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { createClient } from "@libsql/client";
import { applyToJob } from "../../src/apply-engine";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CatalogEntry {
  url: string;
  ats: string;
  role: string;
  expected: "apply" | "fail" | "skip";
  notes?: string;
}

interface RunResult {
  url: string;
  ats: string;
  role: string;
  expected: string;
  actual: "apply" | "fail" | "skip";
  durationMs: number;
  errorMessage?: string;
}

function loadCatalog(): CatalogEntry[] {
  const raw = readFileSync(resolve(__dirname, "url-catalog.json"), "utf-8");
  const parsed = JSON.parse(raw);
  return parsed.urls as CatalogEntry[];
}

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const kind = process.env.INTEGRATION_KIND || "ad-hoc";
  const useBrowserbase = process.env.USE_BROWSERBASE === "true";
  const testUserId = process.env.INTEGRATION_TEST_USER_ID;
  if (!testUserId) {
    console.error("INTEGRATION_TEST_USER_ID env var is required");
    process.exit(1);
  }

  // Load test user from DB so applicant data matches what'd hit real forms.
  const userRow = await db.execute({
    sql: "SELECT id, firstName, lastName, email, phone, city, usState, countryOfResidence, linkedinUrl, yearsOfExperience, targetRole, workAuthorized, needsSponsorship, remotePreference, race, pronouns, resumeUrl, resumeName, subscriptionTier FROM User WHERE id = ? AND role = 'test' LIMIT 1",
    args: [testUserId],
  });
  if (userRow.rows.length === 0) {
    console.error(`Test user not found or not role='test': ${testUserId}`);
    process.exit(1);
  }
  const u = userRow.rows[0] as unknown as {
    firstName: string; lastName: string; email: string; phone: string;
    city: string | null; usState: string | null; countryOfResidence: string | null;
    linkedinUrl: string | null; yearsOfExperience: string | null;
    targetRole: string | null; workAuthorized: number | null;
    needsSponsorship: number | null; remotePreference: string | null;
    race: string | null; pronouns: string | null;
    resumeUrl: string | null; resumeName: string | null; subscriptionTier: string | null;
  };
  if (!u.resumeUrl) {
    console.error("Test user has no resumeUrl — seed one before running.");
    process.exit(1);
  }

  const applicant = {
    firstName: u.firstName || "",
    lastName: u.lastName || "",
    email: u.email || "",
    phone: u.phone || "",
    city: u.city || undefined,
    usState: u.usState || undefined,
    countryOfResidence: u.countryOfResidence || "United States",
    linkedinUrl: u.linkedinUrl || undefined,
    yearsOfExperience: u.yearsOfExperience || "3",
    workAuthorized: u.workAuthorized === 1 ? true : u.workAuthorized === 0 ? false : undefined,
    needsSponsorship: u.needsSponsorship === 1 ? true : u.needsSponsorship === 0 ? false : undefined,
    remotePreference: u.remotePreference || "Remote or Hybrid",
    race: u.race || undefined,
    pronouns: u.pronouns || undefined,
  };
  const resumeUrl = u.resumeUrl!;
  const resumeName = u.resumeName || "resume.pdf";

  // Load catalog
  const catalog = loadCatalog();
  const limit = process.env.INTEGRATION_URL_LIMIT
    ? parseInt(process.env.INTEGRATION_URL_LIMIT, 10)
    : catalog.length;
  const urls = catalog.slice(0, limit);

  const runId = randomUUID();
  await db.execute({
    sql: "INSERT INTO IntegrationRun (id, kind, urlsTotal, useBrowserbase, status) VALUES (?, ?, ?, ?, 'running')",
    args: [runId, kind, urls.length, useBrowserbase ? 1 : 0],
  });
  const runStart = Date.now();
  console.log(`[integration] run ${runId} kind=${kind} urls=${urls.length} useBrowserbase=${useBrowserbase}`);

  const results: RunResult[] = [];
  let applied = 0;
  let failed = 0;
  let skipped = 0;

  for (const entry of urls) {
    const start = Date.now();
    let actual: RunResult["actual"] = "fail";
    let errorMessage: string | undefined;
    try {
      const res = await applyToJob(
        entry.url,
        applicant as Parameters<typeof applyToJob>[1],
        resumeUrl,
        resumeName,
        entry.role,
        u.subscriptionTier || "free",
        entry.role,
        testUserId
      );
      if (res.success) {
        actual = "apply";
        applied++;
      } else {
        const em = res.error || "unknown";
        if (/cooldown|skipped/i.test(em)) {
          actual = "skip";
          skipped++;
        } else {
          actual = "fail";
          failed++;
        }
        errorMessage = em.slice(0, 500);
      }
    } catch (err) {
      actual = "fail";
      failed++;
      errorMessage = err instanceof Error ? err.message.slice(0, 500) : String(err).slice(0, 500);
    }
    const durationMs = Date.now() - start;
    const r: RunResult = {
      url: entry.url,
      ats: entry.ats,
      role: entry.role,
      expected: entry.expected,
      actual,
      durationMs,
      errorMessage,
    };
    results.push(r);
    console.log(
      `[integration] ${actual.padEnd(5)} (${durationMs}ms) ${entry.ats} ${entry.role} :: ${entry.url}${errorMessage ? `\n    err: ${errorMessage.slice(0, 160)}` : ""}`
    );
  }

  const durationMs = Date.now() - runStart;
  const status = failed === 0 ? "success" : applied > 0 ? "partial" : "failed";
  await db.execute({
    sql: "UPDATE IntegrationRun SET completedAt = CURRENT_TIMESTAMP, durationMs = ?, status = ?, urlsApplied = ?, urlsFailed = ?, urlsSkipped = ?, details = ? WHERE id = ?",
    args: [durationMs, status, applied, failed, skipped, JSON.stringify(results), runId],
  });
  console.log(`[integration] done — ${applied} applied / ${failed} failed / ${skipped} skipped in ${durationMs}ms → status=${status}`);

  // Non-zero exit if the run failed outright, so schedulers can alert.
  if (status === "failed") process.exit(2);
}

main().catch((e) => {
  console.error("[integration] runner crashed:", e);
  process.exit(1);
});
