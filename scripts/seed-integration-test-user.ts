/**
 * Seed (or refresh) the role='test' user used by the real-URL integration
 * suite. Copies profile + resumeUrl from a reference user so the test user
 * looks like a real applicant — name on the resume PDF needs to match the
 * firstName/lastName being submitted, otherwise ATS consistency checks flag
 * the application.
 *
 * Usage:
 *   DATABASE_URL=... DATABASE_AUTH_TOKEN=... \
 *     npx tsx scripts/seed-integration-test-user.ts [referenceUserId]
 *
 * Prints the test user id (copy into INTEGRATION_TEST_USER_ID env for
 * real-urls.ts).
 */

import { createClient } from "@libsql/client";

const TEST_EMAIL = "integration-test@apply.theblackfemaleengineer.com";

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const referenceUserId = process.argv[2];
  if (!referenceUserId) {
    console.error("Usage: seed-integration-test-user.ts <referenceUserId>");
    process.exit(1);
  }

  const ref = await db.execute({
    sql: `SELECT firstName, lastName, phone, city, usState, countryOfResidence,
             linkedinUrl, yearsOfExperience, targetRole, workAuthorized,
             needsSponsorship, remotePreference, race, pronouns,
             resumeUrl, resumeName, currentEmployer, currentTitle, school,
             degree, graduationYear, salaryExpectation
          FROM User WHERE id = ? LIMIT 1`,
    args: [referenceUserId],
  });
  if (ref.rows.length === 0) {
    console.error(`Reference user ${referenceUserId} not found`);
    process.exit(1);
  }
  const r = ref.rows[0] as unknown as Record<string, string | number | null>;
  if (!r.resumeUrl) {
    console.error("Reference user has no resumeUrl");
    process.exit(1);
  }

  // Upsert the test user
  const existing = await db.execute({
    sql: "SELECT id FROM User WHERE email = ? LIMIT 1",
    args: [TEST_EMAIL],
  });

  let testUserId: string;
  if (existing.rows.length > 0) {
    testUserId = existing.rows[0].id as string;
    console.log(`Refreshing existing test user ${testUserId}`);
    await db.execute({
      sql: `UPDATE User SET
              firstName = ?, lastName = ?, phone = ?, city = ?, usState = ?,
              countryOfResidence = ?, linkedinUrl = ?, yearsOfExperience = ?,
              targetRole = ?, workAuthorized = ?, needsSponsorship = ?,
              remotePreference = ?, race = ?, pronouns = ?,
              resumeUrl = ?, resumeName = ?,
              currentEmployer = ?, currentTitle = ?, school = ?, degree = ?,
              graduationYear = ?, salaryExpectation = ?,
              role = 'test', emailVerified = CURRENT_TIMESTAMP,
              onboardingCompletedAt = CURRENT_TIMESTAMP,
              autoApplyEnabled = 0
            WHERE id = ?`,
      args: [
        r.firstName, r.lastName, r.phone, r.city, r.usState,
        r.countryOfResidence, r.linkedinUrl, r.yearsOfExperience,
        r.targetRole, r.workAuthorized, r.needsSponsorship,
        r.remotePreference, r.race, r.pronouns,
        r.resumeUrl, r.resumeName,
        r.currentEmployer, r.currentTitle, r.school, r.degree,
        r.graduationYear, r.salaryExpectation,
        testUserId,
      ],
    });
  } else {
    testUserId = crypto.randomUUID();
    console.log(`Creating new test user ${testUserId}`);
    await db.execute({
      sql: `INSERT INTO User (
              id, email, role, emailVerified,
              firstName, lastName, phone, city, usState, countryOfResidence,
              linkedinUrl, yearsOfExperience, targetRole, workAuthorized,
              needsSponsorship, remotePreference, race, pronouns,
              resumeUrl, resumeName, currentEmployer, currentTitle,
              school, degree, graduationYear, salaryExpectation,
              onboardingCompletedAt, autoApplyEnabled, subscriptionTier
            ) VALUES (
              ?, ?, 'test', CURRENT_TIMESTAMP,
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
              CURRENT_TIMESTAMP, 0, 'free'
            )`,
      args: [
        testUserId, TEST_EMAIL,
        r.firstName, r.lastName, r.phone, r.city, r.usState, r.countryOfResidence,
        r.linkedinUrl, r.yearsOfExperience, r.targetRole, r.workAuthorized,
        r.needsSponsorship, r.remotePreference, r.race, r.pronouns,
        r.resumeUrl, r.resumeName, r.currentEmployer, r.currentTitle,
        r.school, r.degree, r.graduationYear, r.salaryExpectation,
      ],
    });
  }

  console.log("---");
  console.log(`INTEGRATION_TEST_USER_ID=${testUserId}`);
  console.log(`name: ${r.firstName} ${r.lastName}`);
  console.log(`resume: ${String(r.resumeUrl).slice(0, 80)}...`);
  console.log(`city/state: ${r.city}, ${r.usState}`);
  console.log(`work auth: ${r.workAuthorized}, sponsorship: ${r.needsSponsorship}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
