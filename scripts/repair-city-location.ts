/**
 * Repair users whose `city` field was corrupted by the old OnboardingSync bug
 * that wrote the first non-Remote entry from `data.locations` (preferred WORK
 * cities) into the residence `city` field.
 *
 * Strategy: for every user with a non-null `city` and non-null `onboardingData`,
 * parse the onboarding data. If their `city` matches the first non-Remote entry
 * in `data.locations`, they were likely affected. We then:
 *   - set workLocations to the filtered locations array (if not already set)
 *   - if city is clearly a preferred work city (one of the wizard's options)
 *     AND usState doesn't match, null out city so the user can re-enter it
 *     on /profile.
 *
 * Pass --apply to actually write; otherwise dry-run.
 *
 * Usage:
 *   DATABASE_URL=... DATABASE_AUTH_TOKEN=... npx tsx scripts/repair-city-location.ts [--apply]
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const WIZARD_WORK_CITIES = new Set([
  "New York",
  "San Francisco",
  "Austin",
  "Chicago",
  "Los Angeles",
  "Seattle",
  "Denver",
  "Boston",
  "Atlanta",
  "Miami",
  "Washington DC",
]);

// rough mapping from city → state so we can detect "SF, Indiana"-style mismatches
const CITY_TO_STATE: Record<string, string> = {
  "New York": "New York",
  "San Francisco": "California",
  "Austin": "Texas",
  "Chicago": "Illinois",
  "Los Angeles": "California",
  "Seattle": "Washington",
  "Denver": "Colorado",
  "Boston": "Massachusetts",
  "Atlanta": "Georgia",
  "Miami": "Florida",
  "Washington DC": "District of Columbia",
};

const apply = process.argv.includes("--apply");

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: "number",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    where: { onboardingData: { not: null } },
    select: {
      id: true,
      email: true,
      city: true,
      usState: true,
      workLocations: true,
      onboardingData: true,
    },
  });

  console.log(`Scanning ${users.length} users with onboardingData...`);
  let patched = 0;
  let cityCleared = 0;
  let workLocsSet = 0;

  for (const u of users) {
    if (!u.onboardingData) continue;
    let parsed: { locations?: unknown };
    try {
      parsed = JSON.parse(u.onboardingData);
    } catch {
      continue;
    }
    const locations = Array.isArray(parsed.locations) ? (parsed.locations as string[]) : [];
    if (locations.length === 0) continue;

    const workLocs = locations.filter((l) => l !== "Remote US");
    const firstNonRemote = workLocs[0];

    const updates: Record<string, unknown> = {};

    // Backfill workLocations if not already set
    if (!u.workLocations && workLocs.length > 0) {
      updates.workLocations = JSON.stringify(workLocs);
      workLocsSet++;
    }

    // Detect corrupted city: it exactly matches a wizard work-city pick AND
    // the stored usState doesn't match that city's real state.
    if (
      u.city &&
      firstNonRemote &&
      u.city === firstNonRemote &&
      WIZARD_WORK_CITIES.has(u.city) &&
      u.usState &&
      CITY_TO_STATE[u.city] !== u.usState
    ) {
      updates.city = null;
      cityCleared++;
      console.log(
        `[clear city] ${u.email}: city="${u.city}" usState="${u.usState}" (should be "${CITY_TO_STATE[u.city]}")`
      );
    }

    if (Object.keys(updates).length > 0) {
      patched++;
      if (apply) {
        await prisma.user.update({ where: { id: u.id }, data: updates });
      }
    }
  }

  console.log("---");
  console.log(`Users affected: ${patched}`);
  console.log(`  city cleared (mismatch): ${cityCleared}`);
  console.log(`  workLocations set: ${workLocsSet}`);
  console.log(apply ? "APPLIED." : "Dry run. Re-run with --apply to write changes.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
