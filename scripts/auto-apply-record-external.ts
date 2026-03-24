import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseArgs(): {
  company: string;
  title: string;
  url: string;
  status: string;
  error?: string;
} {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--(\w+)="?([^"]*)"?$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }

  if (!args.company || !args.title || !args.url || !args.status) {
    console.error(
      'Usage: auto-apply-record-external.ts --company="X" --title="Y" --url="Z" --status=<submitted|failed|skipped> [--error="msg"]'
    );
    process.exit(1);
  }

  return {
    company: args.company,
    title: args.title,
    url: args.url,
    status: args.status,
    error: args.error,
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const { company, title, url, status, error } = parseArgs();
  const companySlug = slugify(company);

  // Get admin user
  const user = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true },
  });

  if (!user) {
    console.error("No admin user found");
    process.exit(1);
  }

  // Find or create the job in the database
  const externalId = `ext-${Buffer.from(url).toString("base64url").slice(0, 40)}`;

  const job = await prisma.job.upsert({
    where: {
      externalId_companySlug: { externalId, companySlug },
    },
    create: {
      externalId,
      company,
      companySlug,
      title,
      location: "See listing",
      type: "Full-time",
      remote: false,
      applyUrl: url,
      category: "Software Engineering",
      tags: JSON.stringify([]),
      source: "browser-apply",
      isActive: true,
      postedAt: new Date(),
    },
    update: {
      title,
      isActive: true,
    },
  });

  // Record the application
  await prisma.jobApplication.upsert({
    where: {
      userId_jobId: { userId: user.id, jobId: job.id },
    },
    create: {
      userId: user.id,
      jobId: job.id,
      externalJobId: externalId,
      company,
      companySlug,
      boardToken: "browser",
      jobTitle: title,
      status,
      errorMessage: error || null,
      submittedAt: status === "submitted" ? new Date() : null,
    },
    update: {
      status,
      errorMessage: error || null,
      submittedAt: status === "submitted" ? new Date() : null,
    },
  });

  console.log(`Recorded: ${title} at ${company} → ${status}`);
}

main().finally(() => prisma.$disconnect());
