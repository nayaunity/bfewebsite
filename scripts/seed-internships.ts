/**
 * Seed the catalog with 2026 summer internships pulled live from Greenhouse
 * boards. Faster than waiting for the 3am scrape, and uses the existing
 * scraper helpers so output matches what nightly scrapes produce.
 *
 * Filters incoming jobs to intern/co-op titles only (uses the same regex as
 * looksLikeInternshipTitle) and inserts as source='manual', type='Internship'.
 *
 * Idempotent — uses Job.@@unique([externalId, companySlug]); re-running just
 * touches updatedAt on existing rows.
 *
 * Dry-run by default. Pass --apply to write.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/seed-internships.ts [--apply]
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { categorizeJob, extractTags, isRemote, looksLikeInternshipTitle } from "../src/lib/scrapers/job-filter";

type Ats = "greenhouse" | "lever" | "ashby";

interface Board {
  slug: string;
  company: string;
  companySlug: string;
  ats: Ats;
}

// Boards we query for internship listings. Companies on multiple ATSes
// must be deduped by (externalId, companySlug) at insert time — we do
// skip-on-conflict so this is safe.
//
// SMOKE-GATED: only companies whose apply path was verified by
// worker/test/integration/smoke-companies.ts are listed here. Companies
// that failed the smoke (Roblox: 12-min timeout; Datadog: form not visible;
// Palantir: stuck-cascade) are excluded so we don't inject jobs the worker
// can't actually submit. Re-test before re-adding.
const BOARDS: Board[] = [
  // Greenhouse — already in scrape list, smoke-verified or in BLOCKED_COMPANIES (matcher serves but worker skips)
  { ats: "greenhouse", slug: "robinhood",     company: "Robinhood",     companySlug: "robinhood" },
  { ats: "greenhouse", slug: "discord",       company: "Discord",       companySlug: "discord" },
  { ats: "greenhouse", slug: "brex",          company: "Brex",          companySlug: "brex" },          // smoke PASSED
  { ats: "greenhouse", slug: "mercury",       company: "Mercury",       companySlug: "mercury" },
  { ats: "greenhouse", slug: "mongodb",       company: "MongoDB",       companySlug: "mongodb" },
  { ats: "greenhouse", slug: "faire",         company: "Faire",         companySlug: "faire" },         // smoke PASSED
  { ats: "greenhouse", slug: "coursera",      company: "Coursera",      companySlug: "coursera" },
  { ats: "greenhouse", slug: "databricks",    company: "Databricks",    companySlug: "databricks" },
  { ats: "greenhouse", slug: "cloudflare",    company: "Cloudflare",    companySlug: "cloudflare" },    // smoke PASSED (control)
  { ats: "greenhouse", slug: "doordashusa",   company: "DoorDash",      companySlug: "doordashusa" },
  { ats: "greenhouse", slug: "twilio",        company: "Twilio",        companySlug: "twilio" },        // smoke PASSED (control)
  { ats: "greenhouse", slug: "affirm",        company: "Affirm",        companySlug: "affirm" },
  { ats: "greenhouse", slug: "scaleai",       company: "Scale AI",      companySlug: "scaleai" },
  { ats: "greenhouse", slug: "gitlab",        company: "GitLab",        companySlug: "gitlab" },
  { ats: "greenhouse", slug: "reddit",        company: "Reddit",        companySlug: "reddit" },
  { ats: "greenhouse", slug: "amplitude",     company: "Amplitude",     companySlug: "amplitude" },
  { ats: "greenhouse", slug: "klaviyo",       company: "Klaviyo",       companySlug: "klaviyo" },
  { ats: "greenhouse", slug: "airtable",      company: "Airtable",      companySlug: "airtable" },
  { ats: "greenhouse", slug: "coinbase",      company: "Coinbase",      companySlug: "coinbase" },
  { ats: "greenhouse", slug: "andurilindustries", company: "Anduril",  companySlug: "anduril" },        // smoke PASSED (alt slug)
  // Lever — Spotify is the only smoke-allowed lever board. Palantir was tested and FAILED (stuck-cascade), excluded.
  { ats: "lever",      slug: "spotify",       company: "Spotify",       companySlug: "spotify" },
  // Ashby — companies in BLOCKED_COMPANIES still served by matcher, worker skips. Safe to seed for catalog visibility.
  { ats: "ashby",      slug: "vercel",        company: "Vercel",        companySlug: "vercel" },
  { ats: "ashby",      slug: "modal",         company: "Modal",         companySlug: "modal" },
  { ats: "ashby",      slug: "supabase",      company: "Supabase",      companySlug: "supabase" },
  { ats: "ashby",      slug: "pinecone",      company: "Pinecone",      companySlug: "pinecone" },
  { ats: "ashby",      slug: "linear",        company: "Linear",        companySlug: "linear" },
  { ats: "ashby",      slug: "notion",        company: "Notion",        companySlug: "notion" },
  { ats: "ashby",      slug: "ramp",          company: "Ramp",          companySlug: "ramp" },
  { ats: "ashby",      slug: "perplexity",    company: "Perplexity",    companySlug: "perplexity" },
  { ats: "ashby",      slug: "openai",        company: "OpenAI",        companySlug: "openai" },
  { ats: "ashby",      slug: "elevenlabs",    company: "ElevenLabs",    companySlug: "elevenlabs" },
  { ats: "ashby",      slug: "cursor",        company: "Cursor",        companySlug: "cursor" },
];

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location?: { name?: string };
  updated_at?: string;
  content?: string;
}

interface LeverJob {
  id: string;
  text: string;
  hostedUrl: string;
  categories?: { location?: string };
  createdAt?: number;
  description?: string;
  descriptionPlain?: string;
}

interface AshbyJob {
  id: string;
  title: string;
  applyUrl: string;
  location?: string;
  isRemote?: boolean;
  publishedAt?: string;
  descriptionPlain?: string;
}

interface SeedRow {
  externalId: string;
  company: string;
  companySlug: string;
  title: string;
  description: string | null;
  location: string;
  type: string;
  remote: boolean;
  postedAt: Date | null;
  applyUrl: string;
  category: string;
  tags: string;
  source: string;
  region: string;
  isActive: boolean;
}

function inferRegion(location: string): string {
  const loc = location.toLowerCase();
  if (!loc || loc === "n/a") return "us";
  if (/(remote)/.test(loc) && !/india|uk|canada|europe|emea|apac/.test(loc)) return "us";
  if (/india|uk|united kingdom|england|germany|france|japan|singapore|australia|brazil|canada/.test(loc)) {
    return /\bus\b|united states|usa/.test(loc) ? "both" : "international";
  }
  return "us";
}

interface NormalizedJob {
  externalId: string;
  title: string;
  applyUrl: string;
  location: string;
  postedAt: Date | null;
  description: string | null;
  remote: boolean | null;
}

async function fetchGreenhouse(slug: string): Promise<NormalizedJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ! greenhouse/${slug}: HTTP ${res.status}`);
    return [];
  }
  const data = await res.json() as { jobs?: GreenhouseJob[] };
  return (data.jobs ?? []).map((j) => ({
    externalId: `gh-${j.id}`,
    title: j.title,
    applyUrl: j.absolute_url,
    location: j.location?.name || "Unknown",
    postedAt: j.updated_at ? new Date(j.updated_at) : null,
    description: j.content
      ? j.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 8000)
      : null,
    remote: null,
  }));
}

async function fetchLever(slug: string): Promise<NormalizedJob[]> {
  const url = `https://api.lever.co/v0/postings/${slug}?limit=200`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ! lever/${slug}: HTTP ${res.status}`);
    return [];
  }
  const data = await res.json() as LeverJob[];
  return (data ?? []).map((j) => ({
    externalId: `lv-${j.id}`,
    title: j.text,
    applyUrl: j.hostedUrl,
    location: j.categories?.location || "Unknown",
    postedAt: j.createdAt ? new Date(j.createdAt) : null,
    description: (j.descriptionPlain || j.description || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000) || null,
    remote: null,
  }));
}

async function fetchAshby(slug: string): Promise<NormalizedJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ! ashby/${slug}: HTTP ${res.status}`);
    return [];
  }
  const data = await res.json() as { jobs?: AshbyJob[] };
  return (data.jobs ?? []).map((j) => ({
    externalId: `ab-${j.id}`,
    title: j.title,
    applyUrl: j.applyUrl,
    location: j.location || "Unknown",
    postedAt: j.publishedAt ? new Date(j.publishedAt) : null,
    description: (j.descriptionPlain || "").trim().slice(0, 8000) || null,
    remote: typeof j.isRemote === "boolean" ? j.isRemote : null,
  }));
}

async function fetchBoardJobs(board: Board): Promise<NormalizedJob[]> {
  if (board.ats === "greenhouse") return fetchGreenhouse(board.slug);
  if (board.ats === "lever") return fetchLever(board.slug);
  if (board.ats === "ashby") return fetchAshby(board.slug);
  return [];
}

async function main() {
  const apply = process.argv.includes("--apply");

  const adapter = new PrismaLibSQL({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
    intMode: "number",
  });
  const prisma = new PrismaClient({ adapter });

  console.log(`\n=== seed-internships (${apply ? "APPLY" : "DRY-RUN"}) ===\n`);
  console.log(`Boards to query: ${BOARDS.length} (greenhouse + lever + ashby)\n`);

  const allRows: SeedRow[] = [];
  let totalScanned = 0;
  let totalIntern = 0;

  for (const board of BOARDS) {
    const jobs = await fetchBoardJobs(board);
    totalScanned += jobs.length;
    const internJobs = jobs.filter((j) => looksLikeInternshipTitle(j.title));
    totalIntern += internJobs.length;
    const tag = `${board.ats}/${board.slug}`;
    if (internJobs.length === 0) {
      console.log(`  ${board.company.padEnd(15)} ${tag.padEnd(28)} ${jobs.length.toString().padStart(4)} jobs, 0 interns`);
      continue;
    }
    console.log(`  ${board.company.padEnd(15)} ${tag.padEnd(28)} ${jobs.length.toString().padStart(4)} jobs, ${internJobs.length} interns`);
    for (const j of internJobs) {
      allRows.push({
        externalId: j.externalId,
        company: board.company,
        companySlug: board.companySlug,
        title: j.title,
        description: j.description,
        location: j.location,
        type: "Internship",
        remote: typeof j.remote === "boolean" ? j.remote : isRemote(j.location, j.title),
        postedAt: j.postedAt,
        applyUrl: j.applyUrl,
        category: categorizeJob(j.title),
        tags: JSON.stringify(extractTags(j.title, j.description ?? undefined)),
        source: "manual",
        region: inferRegion(j.location),
        isActive: true,
      });
    }
  }

  console.log("");
  console.log(`Scanned ${totalScanned} jobs, identified ${totalIntern} internships, ${allRows.length} ready for upsert.\n`);

  if (allRows.length === 0) {
    console.log("Nothing to upsert. Exiting.");
    await prisma.$disconnect();
    return;
  }

  // Sample
  console.log("Sample rows (first 8):");
  for (const r of allRows.slice(0, 8)) {
    console.log(`  ${r.company.padEnd(15)} :: ${r.title} [${r.region}, ${r.location}]`);
  }

  if (!apply) {
    console.log("\n(dry-run; pass --apply to upsert)\n");
    await prisma.$disconnect();
    return;
  }

  console.log("\nInserting (skip-on-conflict)...");
  // Skip rows that already exist to avoid stomping the auto-apply scrape's
  // ownership of (externalId, companySlug). The reclassifier handles those
  // rows separately by flipping `type` to Internship without changing
  // source. We only want to ADD new internships here.
  let created = 0;
  let skippedExisting = 0;
  for (const r of allRows) {
    const existing = await prisma.job.findUnique({
      where: { externalId_companySlug: { externalId: r.externalId, companySlug: r.companySlug } },
      select: { id: true, type: true },
    });
    if (existing) {
      // Row already in catalog under a different source. The reclassifier
      // will set its type=Internship if the title matches, so we leave it
      // alone here.
      skippedExisting++;
      continue;
    }
    await prisma.job.create({ data: r });
    created++;
  }
  console.log(`✓ Created ${created} new rows, skipped ${skippedExisting} already-present rows`);

  const after = await prisma.$queryRawUnsafe<Array<{ c: number }>>(
    `SELECT COUNT(*) as c FROM Job WHERE isActive = 1 AND type = 'Internship'`
  );
  console.log(`Total active type=Internship rows after run: ${after[0]?.c ?? 0}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
