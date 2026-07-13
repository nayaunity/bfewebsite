/**
 * Seeds a fully-provisioned test user in the local dev database.
 * Clears all onboarding/subscription gates so E2E tests can access every page.
 *
 * Usage: npx tsx scripts/seed-e2e-user.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_EMAIL = "e2e@test.local";
const TEST_PASSWORD = "test1234";
const TEST_USER_ID = "e2e-test-user-001";

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: {
      passwordHash,
      firstName: "Test",
      lastName: "User",
      role: "user",
      emailVerified: now,
      onboardingCompletedAt: now,
      selfIdCompletedAt: now,
      subscriptionTier: "pro",
      subscriptionStatus: "active",
      currentPeriodEnd: thirtyDaysFromNow,
      freeTierEndsAt: null,
      monthlyAppCount: 5,
      targetRole: JSON.stringify(["Software Engineer", "Frontend Engineer"]),
      resumeUrl: "https://example.com/test-resume.pdf",
    },
    create: {
      id: TEST_USER_ID,
      email: TEST_EMAIL,
      passwordHash,
      firstName: "Test",
      lastName: "User",
      role: "user",
      emailVerified: now,
      onboardingCompletedAt: now,
      selfIdCompletedAt: now,
      subscriptionTier: "pro",
      subscriptionStatus: "active",
      currentPeriodEnd: thirtyDaysFromNow,
      freeTierEndsAt: null,
      monthlyAppCount: 5,
      targetRole: JSON.stringify(["Software Engineer", "Frontend Engineer"]),
      resumeUrl: "https://example.com/test-resume.pdf",
    },
  });

  console.log(`User: ${user.email} (${user.id})`);

  // Seed LinkedIn connections
  const connections = [
    { fullName: "Amara Okonkwo", headline: "Senior Engineer at Figma", company: "Figma", slug: "figma" },
    { fullName: "Jordan Williams", headline: "Product Manager at Stripe", company: "Stripe", slug: "stripe" },
    { fullName: "Priya Sharma", headline: "Software Engineer at Google", company: "Google", slug: "google" },
    { fullName: "Marcus Chen", headline: "Engineering Manager at Anthropic", company: "Anthropic", slug: "anthropic" },
  ];

  for (const conn of connections) {
    const profileUrl = `csv://${conn.fullName.toLowerCase().replace(/\s+/g, "-")}-at-${conn.slug}`;
    await prisma.linkedInConnection.upsert({
      where: {
        userId_profileUrl: { userId: user.id, profileUrl },
      },
      update: {
        fullName: conn.fullName,
        headline: conn.headline,
        currentCompany: conn.company,
        companySlug: conn.slug,
        status: "active",
        lastSyncedAt: now,
      },
      create: {
        userId: user.id,
        fullName: conn.fullName,
        headline: conn.headline,
        currentCompany: conn.company,
        companySlug: conn.slug,
        profileUrl,
        status: "active",
        lastSyncedAt: now,
      },
    });
    console.log(`  Connection: ${conn.fullName} @ ${conn.company}`);
  }

  // Seed a LinkedIn sync run
  await prisma.linkedInSyncRun.upsert({
    where: { id: "e2e-sync-run-001" },
    update: {
      status: "completed",
      completedAt: now,
      connectionsSeen: connections.length,
      connectionsUpserted: connections.length,
    },
    create: {
      id: "e2e-sync-run-001",
      userId: user.id,
      source: "csv_upload",
      status: "completed",
      startedAt: now,
      completedAt: now,
      connectionsSeen: connections.length,
      connectionsUpserted: connections.length,
    },
  });

  // Seed some browse discoveries (applications)
  const companies = [
    { company: "Figma", slug: "figma", title: "Frontend Engineer", score: 92 },
    { company: "Stripe", slug: "stripe", title: "Full Stack Engineer", score: 78 },
    { company: "Anthropic", slug: "anthropic", title: "Software Engineer, AI Platform", score: 85 },
    { company: "Google", slug: "google", title: "Software Engineer, Cloud", score: 70 },
    { company: "Vercel", slug: "vercel", title: "Frontend Engineer", score: 88 },
  ];

  // Create a browse session
  const session = await prisma.browseSession.upsert({
    where: { id: "e2e-browse-session-001" },
    update: {
      status: "completed",
      totalCompanies: companies.length,
      companiesDone: companies.length,
      jobsFound: companies.length,
      jobsApplied: companies.length,
    },
    create: {
      id: "e2e-browse-session-001",
      userId: user.id,
      status: "completed",
      targetRole: "Software Engineer",
      companies: JSON.stringify(companies.map((c) => c.company)),
      resumeUrl: "https://example.com/test-resume.pdf",
      resumeName: "test-resume.pdf",
      totalCompanies: companies.length,
      companiesDone: companies.length,
      jobsFound: companies.length,
      jobsApplied: companies.length,
      jobsFailed: 0,
      jobsSkipped: 0,
    },
  });

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    const id = `e2e-discovery-${String(i + 1).padStart(3, "0")}`;
    await prisma.browseDiscovery.upsert({
      where: { id },
      update: {
        company: c.company,
        jobTitle: c.title,
        status: "applied",
        matchScore: c.score,
        matchReason: c.score >= 85 ? "Strong role alignment" : "Role match",
      },
      create: {
        id,
        sessionId: session.id,
        company: c.company,
        jobTitle: c.title,
        applyUrl: `https://${c.slug}.com/careers/test`,
        status: "applied",
        matchScore: c.score,
        matchReason: c.score >= 85 ? "Strong role alignment" : "Role match",
      },
    });
    console.log(`  Discovery: ${c.title} @ ${c.company}`);
  }

  console.log("\nDone. Login with:");
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Password: ${TEST_PASSWORD}`);
  console.log(`  Dev API:  curl -X POST http://localhost:3000/api/dev/login -H 'Content-Type: application/json' -d '{"email":"${TEST_EMAIL}"}'`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
