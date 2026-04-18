/**
 * Queue a BrowseSession for the integration test user against the same
 * Greenhouse jobs that c.wright-galloway just failed on (verification-timeout).
 *
 * Validates the verification-code fix end-to-end (240s wait + in-line rescue +
 * one-shot retry queue) without touching any real user's quota.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/queue-test-verification-session.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number",
});
const prisma = new PrismaClient({ adapter });

// Documented in HANDOFF.md as the integration test user (role='test').
const TEST_USER_ID = "1d16e543-db6e-497b-b78b-28fbf0a30626";

// Subset of c.wright-galloway's failure list — chosen for verification-timeout
// signal (Greenhouse verification gate). Not testing 12-min timeouts (page
// state unknown, hard to reproduce), Webflow veteran dropdown, or Twilio role
// mismatch — those are deferred follow-ups, not in this fix.
const TARGET_JOBS: Array<{ companyLike: string; titleLike: string }> = [
  { companyLike: "Affirm", titleLike: "Senior Product Manager, Financial Reporting" },
  { companyLike: "ClickHouse", titleLike: "Senior Technical Product Manager" },
  { companyLike: "GitLab", titleLike: "Senior Product Manager, Hosted Runners" },
  { companyLike: "Airtable", titleLike: "Associate Program Manager" },
];

async function findJobByCompanyAndTitle(
  companyLike: string,
  titleLike: string
): Promise<{ id: string; title: string; applyUrl: string; company: string } | null> {
  const job = await prisma.job.findFirst({
    where: {
      isActive: true,
      company: { contains: companyLike },
      title: { contains: titleLike },
    },
    select: { id: true, title: true, applyUrl: true, company: true },
  });
  return job;
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: TEST_USER_ID },
    select: {
      id: true,
      email: true,
      firstName: true,
      role: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      monthlyAppCount: true,
      freeTierEndsAt: true,
      applicationEmail: true,
      resumes: {
        select: { id: true, name: true, blobUrl: true, fileName: true, isFallback: true },
      },
    },
  });

  if (!user) {
    console.error(`Test user ${TEST_USER_ID} not found. Run scripts/seed-integration-test-user.ts first.`);
    process.exit(1);
  }

  console.log(`Test user: ${user.firstName} <${user.email}>`);
  console.log(`  role=${user.role} tier=${user.subscriptionTier} status=${user.subscriptionStatus} monthly=${user.monthlyAppCount}`);
  console.log(`  applicationEmail=${user.applicationEmail || "(none)"}`);
  console.log(`  resumes=${user.resumes.length}`);

  if (!user.applicationEmail) {
    console.error("Test user has no applicationEmail — verification flow can't run.");
    process.exit(1);
  }

  const resume = user.resumes.find((r) => r.isFallback) || user.resumes[0];
  if (!resume) {
    console.error("Test user has no resume — re-seed first.");
    process.exit(1);
  }

  // Promote to starter+active for the duration of the test so the new
  // freeTierEndsAt wall doesn't block the session. Reset monthlyAppCount to 0
  // so the cap doesn't kick in either.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: "starter",
      subscriptionStatus: "active",
      freeTierEndsAt: null,
      monthlyAppCount: 0,
    },
  });
  console.log(`Promoted test user to starter/active for the test.`);

  // Cancel any active sessions so this one queues cleanly.
  const active = await prisma.browseSession.findFirst({
    where: { userId: user.id, status: { in: ["queued", "processing"] } },
  });
  if (active) {
    await prisma.browseSession.update({
      where: { id: active.id },
      data: { status: "cancelled", completedAt: new Date(), errorMessage: "Cancelled to queue verification test" },
    });
    console.log(`Cancelled previous active session ${active.id}`);
  }

  // Look up each target job by company + title fragment.
  const matchedJobs: Array<{ title: string; applyUrl: string; company: string; matchReason: string }> = [];
  for (const target of TARGET_JOBS) {
    const job = await findJobByCompanyAndTitle(target.companyLike, target.titleLike);
    if (!job) {
      console.log(`  ✗ MISSING: ${target.companyLike} — ${target.titleLike}`);
      continue;
    }
    console.log(`  ✓ ${job.company.padEnd(16)} ${job.title}`);
    matchedJobs.push({
      title: job.title,
      applyUrl: job.applyUrl,
      company: job.company,
      matchReason: "test-verification-fix",
    });
  }

  if (matchedJobs.length === 0) {
    console.error("\nNo target jobs found in catalog. Was the daily scrape run today?");
    process.exit(1);
  }

  const companies = [...new Set(matchedJobs.map((j) => j.company))];
  const session = await prisma.browseSession.create({
    data: {
      userId: user.id,
      targetRole: "Product Manager",
      companies: JSON.stringify(companies),
      matchedJobs: JSON.stringify(matchedJobs),
      resumeUrl: resume.blobUrl,
      resumeName: resume.fileName,
      totalCompanies: companies.length,
    },
  });

  console.log(`\nQueued BrowseSession ${session.id}`);
  console.log(`Worker picks up within ~30 seconds. Watch via:`);
  console.log(`  https://www.theblackfemaleengineer.com/admin/auto-apply`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
