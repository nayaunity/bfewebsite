import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number" as const,
});
const prisma = new PrismaClient({ adapter } as any);

const NEW_SLUGS = [
  "verkada",
  "pagerduty",
  "tanium",
  "chainguard",
  "lithic",
  "heygen",
  "calendly",
  "braze",
  "iterable",
  "deepmind",
  "kalshi",
  "medium",
  "relativity",
  "nvidia",
  "unisys",
  "novartis",
  "tmobile",
];

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "theblackfemaleengineer@gmail.com" },
    select: { id: true, email: true, firstName: true },
  });
  if (!user) throw new Error("Test user not found");
  console.log(`User: ${user.firstName} (${user.email})\n`);

  const resume = await prisma.userResume.findFirst({
    where: { userId: user.id },
    orderBy: { uploadedAt: "desc" },
    select: { blobUrl: true, fileName: true },
  });
  if (!resume) throw new Error("No resume found for test user");
  console.log(`Resume: ${resume.fileName}\n`);

  const jobs = await prisma.job.findMany({
    where: {
      companySlug: { in: NEW_SLUGS },
      isActive: true,
      region: { in: ["us", "both"] },
    },
    select: {
      company: true,
      companySlug: true,
      title: true,
      applyUrl: true,
    },
  });

  const picked: { title: string; applyUrl: string; company: string }[] = [];
  const seen = new Set<string>();

  const feKeywords = ["frontend", "front end", "front-end", "software engineer", "full stack", "fullstack"];
  for (const slug of NEW_SLUGS) {
    if (seen.has(slug)) continue;
    const companyJobs = jobs.filter((j) => j.companySlug === slug);
    const feJob = companyJobs.find((j) =>
      feKeywords.some((kw) => j.title.toLowerCase().includes(kw))
    );
    const job = feJob || companyJobs[0];
    if (!job) {
      console.log(`WARNING: No US jobs found for ${slug}`);
      continue;
    }
    picked.push({ title: job.title, applyUrl: job.applyUrl, company: job.company });
    seen.add(slug);
  }

  console.log(`Picked ${picked.length} test jobs:\n`);
  for (const j of picked) {
    console.log(`  ${j.company}: ${j.title}`);
    console.log(`    ${j.applyUrl}\n`);
  }

  if (picked.length === 0) {
    console.log("No jobs to test. Aborting.");
    return;
  }

  const companies = [...new Set(picked.map((j) => j.company))];

  const session = await prisma.browseSession.create({
    data: {
      userId: user.id,
      targetRole: "Software Engineer",
      companies: JSON.stringify(companies),
      matchedJobs: JSON.stringify(picked),
      resumeUrl: resume.blobUrl,
      resumeName: resume.fileName,
      totalCompanies: companies.length,
      seekingInternship: false,
    },
  });

  console.log(`\nSession created: ${session.id}`);
  console.log(`Status: ${session.status}`);
  console.log(`\nThe Railway worker will pick this up within 30 seconds.`);
  console.log(`\nTo monitor results, run:`);
  console.log(`  npx tsx scripts/check-test-results.ts ${session.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
