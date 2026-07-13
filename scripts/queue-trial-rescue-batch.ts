/**
 * One-off rescue: queue a curated BrowseSession for each trial user listed,
 * targeting only companies with a recent track record of successful applies.
 * The trial cap (5 apps) stops each session naturally; the worker dedupes
 * against prior sessions, so it picks fresh jobs only.
 *
 * Strategy:
 *   - ALLOW list built from last-7d BrowseDiscovery success rate (>=50% with
 *     >=3 attempts).
 *   - DENY list overrides ALLOW for known-broken patterns (Zscaler stuck,
 *     Twilio right-to-work Q, Webflow board-not-form, Stripe S3 self-click,
 *     CockroachDB / Brex / Marqeta / Grafana 12-min timeouts, etc.).
 *
 * Pass --apply to actually queue. Otherwise dry-run.
 *
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/queue-trial-rescue-batch.ts [--apply]
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { ROLE_OPTIONS } from "../src/lib/role-options";

const apply = process.argv.includes("--apply");

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number",
});
const prisma = new PrismaClient({ adapter });

// Round 2 (May 2 evening): the 5 trial users still below cap after round 1.
// Ruth removed — UK user, sub paused via Stripe trial extension.
const TARGET_EMAILS = [
  "aafia1606@gmail.com",
  "patrickmwa81@gmail.com",
  "marcmkdi@gmail.com",
  "mmchoudhry@gmail.com",
  "manalchem6.02@gmail.com",
];

// Per-user overrides for round 2:
// - intern flag override (true => force intern, false => force non-intern)
// - extra target roles to append
const PER_USER_OVERRIDES: Record<string, { forceIntern?: boolean; extraRoles?: string[] }> = {
  // Catalog has zero Frontend Engineer Intern roles in non-deny companies.
  // Drop intern requirement so she sees entry-level FE roles (her switcher
  // status keeps senior/lead/staff blocked).
  "manalchem6.02@gmail.com": { forceIntern: false },
  // Graduating May 2026 — treat as new grad. Catalog has more "Software
  // Engineer New Grad / I" roles than dedicated ML internships for undergrad.
  "patrickmwa81@gmail.com": { forceIntern: false },
  // Content Strategist allow-list catalog is only 2 roles. Add Product
  // Marketing — Momin is a Retail Strategy Director, the keyword overlap
  // is plausible and the PMM allow-list catalog is much deeper.
  "mmchoudhry@gmail.com": { extraRoles: ["Product Marketing"] },
};

// company slug (lowercase) -> include in ALLOW. Built from last-7d apply data.
// IMPORTANT: slugs are not always the lowercased company name. Real slugs in
// our DB: doordashusa, gleanwork, abnormalsecurity, temporaltechnologies.
// Cross-check against the Job table when adding new entries.
const ALLOW_SLUGS = new Set([
  "temporaltechnologies", "doordashusa", "doximity", "airtable", "apollo",
  "planetscale",
  "mercury", "instacart", "affirm", "attentive", "databricks",
  "gitlab", "clickhouse",
  "launchdarkly", "box",
  "airbnb",
]);
// Note: discord, klaviyo, anduril, gleanwork, abnormalsecurity are
// intentionally NOT here — they're in DENY due to round 1 failures.

// Always block, regardless of ALLOW match (covers known-broken UI patterns).
// Slugs cross-checked against the Job table — see ALLOW_SLUGS comment above.
const DENY_SLUGS = new Set([
  "zscaler", "twilio", "webflow", "stripe", "cockroachdb", "brex",
  "scale-ai", "scaleai", "scale", "grafana-labs", "grafana", "marqeta",
  "datadog", "pinecone", "plaid", "spotify", "lyft", "cursor", "chime",
  "ziprecruiter", "gusto", "abnormalsecurity",
  "duolingo", "samsara", "grammarly",
  "openai", "ramp", "notion", "perplexity", "linear", "elevenlabs",
  "anthropic",
  // Round 2 additions (May 2 evening): observed 12-min openFlyout dropdown
  // timeouts in round 1 across multiple users. Anduril 0/3 in Marc's session,
  // Discord listings-page-not-form bug, Klaviyo "Stuck: 3 fields skipped".
  "anduril", "discord", "klaviyo",
  // Glean (slug=gleanwork): 55% rate but timed out on Delina's session.
  "gleanwork",
]);

const NON_US_INDICATORS = [
  "india", "ireland", "uk", "united kingdom", "england", "germany", "france",
  "japan", "singapore", "australia", "brazil", "canada", "italy", "spain",
  "netherlands", "sweden", "denmark", "norway", "finland", "poland", "czech",
  "israel", "korea", "china", "hong kong", "taiwan", "mexico", "argentina",
  "colombia", "chile", "peru", "bangalore", "bengaluru", "hyderabad", "mumbai",
  "pune", "delhi", "chennai", "london", "berlin", "paris", "tokyo", "sydney",
  "melbourne", "toronto", "vancouver", "montreal", "dublin", "amsterdam",
  "são paulo", "sao paulo", "tel aviv", "seoul", "shanghai", "beijing",
  "dubai", "uae", "abu dhabi", "qatar", "saudi arabia", "egypt", "south africa",
  "kenya", "nigeria", "morocco",
];
const STOP_WORDS = new Set([
  "engineer", "engineering", "senior", "junior", "staff", "principal",
  "lead", "manager", "director", "head", "vp", "chief",
]);

function buildKeywords(roleName: string): string[] {
  const opt = ROLE_OPTIONS.find((r) => r.label === roleName);
  if (!opt)
    return roleName.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return opt.searchTerms.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
}

function titleHintsNonUS(s: string): boolean {
  const l = s.toLowerCase();
  return NON_US_INDICATORS.some((ind) => l.includes(ind));
}

interface Cand {
  applyUrl: string;
  title: string;
  company: string;
  score: number;
  reason: string;
  matchedRole: string;
}

const INTERN_TITLE_RE = /\bintern(?:ship)?s?\b|\bnew\s*grad\b|\bco-?op\b/i;
const SWITCHER_BLOCKED_RE =
  /\bsenior\b|\bsr\.?\b|\blead\b|\bstaff\b|\bprincipal\b|\bdirector\b|\bhead\b|\bvp\b|\bchief\b|\bgroup\b/i;
const MANAGER_PREFIX_RE = /^manager[, ]/i;

function isCareerSwitcher(currentTitle: string | null, roleKeywords: string[]): boolean {
  if (!currentTitle) return true;
  const lower = currentTitle.toLowerCase();
  return !roleKeywords.some((k) => lower.includes(k));
}

async function findCandidates(
  user: {
    id: string; yearsOfExperience: number | string | null;
    countryOfResidence: string | null; remotePreference: string | null;
    currentTitle: string | null; seekingInternship: boolean | null;
  },
  roles: string[],
  cap: number
): Promise<Cand[]> {
  const allJobs = await prisma.job.findMany({
    where: { isActive: true },
    select: {
      id: true, title: true, applyUrl: true, company: true, companySlug: true,
      location: true, remote: true, region: true, description: true,
    },
  });

  // Dedup: skip ANY URL already attempted in a prior session, regardless of
  // status. Round 1 showed re-queueing failed URLs just refails them on the
  // same worker bug — round 2 wants fresh candidates only.
  const appliedUrls = new Set(
    (
      await prisma.browseDiscovery.findMany({
        where: { session: { userId: user.id } },
        select: { applyUrl: true },
      })
    ).map((d) => d.applyUrl)
  );

  const isUS = (user.countryOfResidence || "").toLowerCase().includes("united states");
  const yoeRaw = typeof user.yearsOfExperience === "number"
    ? user.yearsOfExperience
    : parseFloat(String(user.yearsOfExperience));
  const statedYoe = Number.isFinite(yoeRaw) && yoeRaw >= 0 ? yoeRaw : 2;

  // Per-role: stated yoe applies only if user's currentTitle overlaps with
  // the role's keywords. Otherwise this is a career switcher — treat as 0
  // experience IN that role.
  const roleKw = roles.map((r) => {
    const kw = buildKeywords(r);
    const switcher = isCareerSwitcher(user.currentTitle, kw);
    return { role: r, kw, roleYoe: switcher ? 0 : statedYoe, switcher };
  });

  const intern = !!user.seekingInternship;

  const scored: Cand[] = [];
  for (const job of allJobs) {
    const slug = (job.companySlug || "").toLowerCase();
    if (!slug) continue;
    if (DENY_SLUGS.has(slug)) continue;
    // Intern users get a wider company net (any non-deny) since the allow list
    // has barely any intern roles. Non-intern users stay on the tight allow.
    if (!intern && !ALLOW_SLUGS.has(slug)) continue;
    if (!job.applyUrl) continue;
    if (appliedUrls.has(job.applyUrl)) continue;

    if (intern && !INTERN_TITLE_RE.test(job.title)) continue;

    if (isUS && job.region === "international") continue;
    if (!isUS && job.region === "us") continue;
    // For US users only, also exclude title/location hints of non-US so that
    // mis-tagged region=us rows don't leak (e.g. "Senior Frontend Engineer,
    // Alerting | Germany | Remote" tagged region=us). Non-US users keep
    // international jobs — they may live in the country named.
    if (isUS && titleHintsNonUS(`${job.title} ${job.location || ""}`)) continue;

    let locScore = 0.5;
    if (job.remote) locScore = 1;
    else if (isUS && job.region === "us") locScore = 0.8;

    // Match the job to whichever target role scores highest. Apply that role's
    // own seniority gate (roleYoe accounts for switcher status).
    let bestScore = 0;
    let bestRole = "";
    let bestRoleYoe = statedYoe;
    let reason = "";
    for (const { role, kw, roleYoe } of roleKw) {
      let s = 0;
      const matched: string[] = [];
      for (const k of kw) {
        if (job.title.toLowerCase().includes(k)) {
          s += k.length;
          matched.push(k);
        }
      }
      if (s > bestScore) {
        bestScore = s;
        bestRole = role;
        bestRoleYoe = roleYoe;
        reason = matched.length > 0 ? `${role} match` : "";
        if (job.remote) reason += " · Remote";
      }
    }
    if (bestScore === 0) continue;

    // Seniority gate using role-relevant yoe (0 for switchers).
    const t = job.title;
    if (bestRoleYoe <= 2 && SWITCHER_BLOCKED_RE.test(t) && !/\bjunior\b/i.test(t)) continue;
    if (bestRoleYoe <= 2 && MANAGER_PREFIX_RE.test(t)) continue;
    if (
      bestRoleYoe <= 5 &&
      /\b(staff|principal|director|head of|vp|chief|(engineering|software)\s+manager)\b/i.test(t)
    ) continue;

    const norm = Math.min(1, bestScore / 20);
    const score = norm * 0.6 + locScore * 0.4;
    scored.push({
      applyUrl: job.applyUrl, title: job.title, company: job.company,
      score, reason, matchedRole: bestRole,
    });
  }

  scored.sort((a, b) => b.score - a.score);

  // Round 2: bump per-company cap from 2 → 5. Original cap existed to spread
  // risk across companies if one had worker bugs, but DENY now handles that
  // explicitly — let users with thin pools (Marc, Manal) consume more from
  // their few working companies.
  const perCompany = new Map<string, number>();
  const out: Cand[] = [];
  for (const c of scored) {
    const n = perCompany.get(c.company) || 0;
    if (n >= 5) continue;
    out.push(c);
    perCompany.set(c.company, n + 1);
    if (out.length >= cap) break;
  }
  return out;
}

async function processUser(email: string) {
  const u = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, email: true, firstName: true, targetRole: true,
      yearsOfExperience: true, countryOfResidence: true, remotePreference: true,
      currentTitle: true, seekingInternship: true,
      monthlyAppCount: true, autoApplyEnabled: true,
      resumeUrl: true, resumeName: true,
      resumes: { select: { id: true, name: true, blobUrl: true, fileName: true, isFallback: true } },
    },
  });
  if (!u) {
    console.log(`SKIP ${email}: not found`);
    return;
  }
  if (!u.autoApplyEnabled) {
    console.log(`SKIP ${u.email}: autoApplyEnabled=false`);
    return;
  }
  if (u.resumes.length === 0 && !u.resumeUrl) {
    console.log(`SKIP ${u.email}: no resume (UserResume + User.resumeUrl both empty)`);
    return;
  }

  const active = await prisma.browseSession.findFirst({
    where: { userId: u.id, status: { in: ["queued", "processing"] } },
    select: { id: true, status: true },
  });
  if (active) {
    console.log(`SKIP ${u.email}: already has ${active.status} session ${active.id}`);
    return;
  }

  let roles: string[] = [];
  try {
    const parsed = JSON.parse(u.targetRole || "[]");
    if (Array.isArray(parsed)) roles = parsed;
    else if (typeof parsed === "string") roles = [parsed];
  } catch {
    if (u.targetRole) roles = [u.targetRole];
  }
  if (roles.length === 0) {
    console.log(`SKIP ${u.email}: no target roles`);
    return;
  }

  // Apply per-user overrides for round 2.
  const override = PER_USER_OVERRIDES[u.email];
  let effectiveIntern = !!u.seekingInternship;
  if (override?.forceIntern !== undefined) effectiveIntern = override.forceIntern;
  if (override?.extraRoles) {
    for (const r of override.extraRoles) {
      if (!roles.includes(r)) roles.push(r);
    }
  }
  const userForMatch = { ...u, seekingInternship: effectiveIntern };

  // Aim for ~12 candidates — trial cap will stop at 5 successful applies. Extra
  // headroom lets the worker bypass any unexpected per-job failure.
  const candidates = await findCandidates(userForMatch, roles, 12);
  if (candidates.length === 0) {
    console.log(`NONE  ${u.email}: 0 matching jobs in ALLOW list (roles=${roles.join("/")})`);
    return;
  }

  const primaryRole = roles[0];
  const resumeRow =
    u.resumes.find((r) => r.name.toLowerCase() === primaryRole.toLowerCase()) ||
    u.resumes.find((r) => r.isFallback) ||
    u.resumes[0];
  const resume = resumeRow
    ? { blobUrl: resumeRow.blobUrl, fileName: resumeRow.fileName }
    : { blobUrl: u.resumeUrl!, fileName: u.resumeName ?? "resume.pdf" };

  const companies = [...new Set(candidates.map((c) => c.company))];
  const remaining = Math.max(0, 5 - u.monthlyAppCount);

  // Surface switcher / intern flags so the operator can sanity-check that the
  // candidate list reflects the user's actual position, not their stated YOE.
  const statedYoeForLog = typeof u.yearsOfExperience === "number" ? u.yearsOfExperience : u.yearsOfExperience;
  const flags: string[] = [];
  if (effectiveIntern) flags.push("INTERN");
  if (override?.forceIntern === false && u.seekingInternship) flags.push("intern-override-off");
  if (override?.extraRoles) flags.push(`extra-roles=${override.extraRoles.join("|")}`);
  // Switcher detection mirrors findCandidates — we just compute it once for
  // the primary role for the operator's display.
  const primaryKw = buildKeywords(primaryRole);
  if (isCareerSwitcher(u.currentTitle, primaryKw)) flags.push("SWITCHER");
  console.log(
    `READY ${u.email}  apps=${u.monthlyAppCount}/5  remaining=${remaining}  candidates=${candidates.length}  companies=${companies.length}  primaryRole=${primaryRole}  yoe=${statedYoeForLog}  ${flags.join(",")}`
  );
  for (const c of candidates.slice(0, 5)) {
    console.log(`        ${(c.score * 100).toFixed(0)}%  ${c.company.padEnd(14)}  ${c.title}  [matched=${c.matchedRole}]`);
  }

  if (!apply) return;

  const session = await prisma.browseSession.create({
    data: {
      userId: u.id,
      targetRole: primaryRole,
      companies: JSON.stringify(companies),
      matchedJobs: JSON.stringify(
        candidates.map((c) => ({
          title: c.title,
          applyUrl: c.applyUrl,
          company: c.company,
          matchScore: c.score,
          matchReason: c.reason,
        }))
      ),
      resumeUrl: resume.blobUrl,
      resumeName: resume.fileName,
      totalCompanies: companies.length,
    },
  });
  console.log(`        QUEUED session ${session.id}`);
}

async function main() {
  for (const email of TARGET_EMAILS) {
    await processUser(email);
  }
  if (!apply) console.log("\n(dry-run — re-run with --apply to queue)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
