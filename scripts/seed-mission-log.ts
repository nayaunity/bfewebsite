import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Use the user the active browser cookie points at, so visual tests work
  // without re-signing-in. cmkjad7op007l118884s0vsyu is the id baked into the
  // existing playwright session cookie.
  const userId = "cmkjad7op007l118884s0vsyu";

  await prisma.user.upsert({
    where: { id: userId },
    update: {
      firstName: "Test",
      subscriptionTier: "starter",
      subscriptionStatus: "active",
      targetRole: JSON.stringify(["Product Manager", "Senior PM"]),
      resumeUrl: "https://example.com/resume.pdf",
      resumeName: "PM-Resume.pdf",
      monthlyAppCount: 47,
    },
    create: {
      id: userId,
      email: "theblackfemaleengineer@gmail.com",
      firstName: "Test",
      role: "user",
      subscriptionTier: "starter",
      subscriptionStatus: "active",
      targetRole: JSON.stringify(["Product Manager", "Senior PM"]),
      resumeUrl: "https://example.com/resume.pdf",
      resumeName: "PM-Resume.pdf",
      monthlyAppCount: 47,
      passwordHash: await bcrypt.hash("test1234", 10),
    },
  });

  // Wipe any prior dev sessions for clean state
  await prisma.browseDiscovery.deleteMany({
    where: { session: { userId } },
  });
  await prisma.browseSession.deleteMany({ where: { userId } });

  const companies = [
    { company: "Stripe", title: "Senior Product Manager", city: "San Francisco" },
    { company: "Anthropic", title: "AI Product Manager", city: "San Francisco" },
    { company: "Linear", title: "Product Lead", city: "San Francisco" },
    { company: "Vercel", title: "Growth PM", city: "San Francisco" },
    { company: "Figma", title: "Platform PM", city: "San Francisco" },
    { company: "Ramp", title: "Senior PM", city: "New York" },
    { company: "Plaid", title: "Technical PM", city: "New York" },
    { company: "Datadog", title: "Product Manager", city: "New York" },
    { company: "Spotify", title: "Senior Product Manager", city: "New York" },
    { company: "HubSpot", title: "Growth PM", city: "Boston" },
    { company: "Atlassian", title: "Staff PM", city: "Austin" },
    { company: "Cloudflare", title: "Platform PM", city: "Austin" },
    { company: "Shopify", title: "Senior PM", city: "Toronto" },
    { company: "Snowflake", title: "Product Manager", city: "San Mateo" },
    { company: "Discord", title: "Associate PM", city: "San Francisco" },
    { company: "DoorDash", title: "Senior Product Manager", city: "San Francisco" },
    { company: "Notion", title: "Principal PM", city: "San Francisco" },
    { company: "Asana", title: "Senior PM", city: "Chicago" },
    { company: "Twilio", title: "Product Manager", city: "San Francisco" },
    { company: "OpenAI", title: "AI Product Manager", city: "San Francisco" },
    { company: "Brex", title: "Growth PM", city: "San Francisco" },
    { company: "Gusto", title: "Senior PM", city: "San Francisco" },
    { company: "Robinhood", title: "Product Manager", city: "Menlo Park" },
    { company: "Affirm", title: "Senior PM", city: "San Francisco" },
    { company: "Coinbase", title: "Principal PM", city: "Remote" },
  ];

  // Today's session — 7 of 12 sent (matches the design's TODAY_SESSION fixture)
  const todaySession = await prisma.browseSession.create({
    data: {
      userId,
      status: "processing",
      targetRole: "Product Manager",
      resumeUrl: "https://example.com/resume.pdf",
      resumeName: "PM-Resume.pdf",
      companies: JSON.stringify(["Stripe", "Anthropic", "Linear", "Vercel", "Figma"]),
      totalCompanies: 38,
      companiesDone: 38,
      jobsFound: 12,
      jobsApplied: 7,
      jobsFailed: 0,
      jobsSkipped: 0,
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });

  // Spread historical apps over the last 6 days
  const now = Date.now();
  let i = 0;
  for (const c of companies) {
    const minutesAgo = Math.floor(Math.random() * 60 * 24 * 6);
    const ts = new Date(now - minutesAgo * 60 * 1000);
    // 92% applied, 8% applying for the today session, rest historical
    const applying = i < 5; // first 5 are applying right now (in flight)
    const session =
      i < 7
        ? todaySession
        : await prisma.browseSession.create({
            data: {
              userId,
              status: "completed",
              targetRole: "Product Manager",
              resumeUrl: "https://example.com/resume.pdf",
              resumeName: "PM-Resume.pdf",
              companies: JSON.stringify([c.company]),
              totalCompanies: 1,
              companiesDone: 1,
              jobsFound: 1,
              jobsApplied: 1,
              jobsFailed: 0,
              jobsSkipped: 0,
              startedAt: ts,
              completedAt: ts,
              createdAt: ts,
            },
          });
    await prisma.browseDiscovery.create({
      data: {
        sessionId: session.id,
        company: c.company,
        jobTitle: c.title,
        applyUrl: `https://example.com/jobs/${c.company.toLowerCase()}-${i}`,
        status: applying ? "applying" : "applied",
        matchScore: 72 + Math.floor(Math.random() * 27),
        matchReason: i % 3 === 0 ? "Matched your PM target role and SF location" : null,
        resumeTailored: Math.random() > 0.35,
        tailoredResumeUrl: Math.random() > 0.35 ? "https://example.com/tailored.pdf" : null,
        createdAt: ts,
      },
    });
    i++;
  }

  console.log("Seeded 25 discoveries + today session for test@test.com (password: test1234)");
}

main().finally(() => prisma.$disconnect());
