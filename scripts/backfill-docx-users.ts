/**
 * One-off backfill for two users whose DOCX resumes were silently returning
 * empty text through the old pdf-parse-only extractor. The fix (mammoth +
 * magic-byte detection in src/lib/resume-extraction.ts) is validated end-to-end
 * via scripts/dump-docx-text.ts — both resumes now extract real text:
 *   Chantil:  13,928 chars
 *   Jessica:   3,751 chars
 *
 * Structured fields below were derived manually from the extracted resume text
 * (same fields the old 25-step onboarding wizard used to capture). We only fill
 * fields currently NULL/empty — never overwrite existing answers.
 *
 * Dry-run by default; pass --apply to write.
 *
 * Production (Turso):
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/backfill-docx-users.ts [--apply]
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const apply = process.argv.includes("--apply");

// Extracted from each user's resume text. Only NULL-current fields get written.
// remotePreference is always "Remote" default; "Remote or Hybrid" when the
// resume states a physical work location (per product direction).
// Two classes of update:
//   fillIfNull — write only when current value is NULL/empty
//   overwrite  — write unconditionally (user approved the specific correction)
type Plan = {
  id: string;
  label: string;
  fillIfNull?: Record<string, unknown>;
  overwrite?: Record<string, unknown>;
};

const BACKFILL: Plan[] = [
  {
    id: "8e645d98-2f45-479d-8b98-1f6e7a7a031e",
    label: "Chantil Wright",
    // Resume: "Blythewood, SC 29016". PhD + 20+ yrs military/healthcare/academia.
    // Keeping yearsOfExperience="5" (her pivot framing) and targetRole (her
    // explicit pivot choice) untouched per product direction.
    fillIfNull: {
      workLocations: JSON.stringify(["Remote", "Blythewood, SC"]),
    },
    overwrite: {
      school: "Northcentral University", // typo fix: "North Central" -> "Northcentral"
    },
  },
  {
    id: "31332ea5-99b2-440a-80bb-42fd5bb249e7",
    label: "Jessica Nwanze",
    // Resume: "Spring, TX" + "Open to Hybrid | The Woodlands, TX"
    fillIfNull: {
      workLocations: JSON.stringify(["Remote", "Spring, TX", "The Woodlands, TX"]),
    },
    overwrite: {
      remotePreference: "Remote or Hybrid", // resume explicitly states hybrid-open
      school: "Culinary Institute LeNotre", // typo fix: "Institue" -> "Institute"
    },
  },
];

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (url && (url.startsWith("libsql://") || url.startsWith("https://"))) {
    const adapter = new PrismaLibSQL({
      url: url.trim().replace(/\/+$/, ""),
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
      intMode: "number",
    });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

const prisma = createPrismaClient();

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "<null>";
  if (typeof v === "string") return v.length > 60 ? `${v.slice(0, 57)}...` : v;
  return String(v);
}

async function runOne(target: Plan) {
  console.log(`\n=== ${target.label} (${target.id}) ===`);
  const user = await prisma.user.findUnique({ where: { id: target.id } });
  if (!user) { console.log(`  not found, skipping`); return; }

  const updates: Record<string, unknown> = {};
  for (const [field, next] of Object.entries(target.fillIfNull ?? {})) {
    const current = (user as Record<string, unknown>)[field];
    if (!isEmpty(current)) {
      console.log(`  skip ${field}: already set to ${fmt(current)} (fillIfNull)`);
      continue;
    }
    if (isEmpty(next)) continue;
    updates[field] = next;
  }
  for (const [field, next] of Object.entries(target.overwrite ?? {})) {
    const current = (user as Record<string, unknown>)[field];
    if (isEmpty(next)) continue;
    if (current === next) {
      console.log(`  skip ${field}: already equals ${fmt(current)} (overwrite)`);
      continue;
    }
    updates[field] = next;
  }

  const fields = Object.keys(updates);
  if (fields.length === 0) {
    console.log(`  no NULL fields to fill — nothing to do`);
    return;
  }

  console.log(`  diff (NULL fields only):`);
  for (const f of fields) {
    const before = (user as Record<string, unknown>)[f];
    console.log(`    ${f.padEnd(20)} ${fmt(before).padEnd(10)} -> ${fmt(updates[f])}`);
  }

  if (apply) {
    await prisma.user.update({ where: { id: target.id }, data: updates });
    console.log(`  WRITTEN (${fields.length} fields)`);
  } else {
    console.log(`  (dry-run — pass --apply to write ${fields.length} fields)`);
  }
}

async function main() {
  console.log(apply ? "APPLY MODE — writing changes" : "DRY RUN — no writes");
  for (const t of BACKFILL) {
    try {
      await runOne(t);
    } catch (err) {
      console.error(`  ERROR:`, err);
    }
  }
  if (!apply) console.log(`\nRun with --apply to write.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
