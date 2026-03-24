import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseArgs(): { jobId: string; status: string; error?: string } {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--(\w+)="?([^"]*)"?$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }

  if (!args.jobId || !args.status) {
    console.error("Usage: auto-apply-record.ts --jobId=<id> --status=<submitted|failed|skipped> [--error=<message>]");
    process.exit(1);
  }

  return {
    jobId: args.jobId,
    status: args.status,
    error: args.error,
  };
}

async function main() {
  const { jobId, status, error } = parseArgs();

  // Get admin user
  const user = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true },
  });

  if (!user) {
    console.error("No admin user found");
    process.exit(1);
  }

  // Get job details
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      externalId: true,
      company: true,
      companySlug: true,
      title: true,
    },
  });

  if (!job) {
    console.error(`Job not found: ${jobId}`);
    process.exit(1);
  }

  // Upsert application record
  const greenhouseId = job.externalId.startsWith("gh-")
    ? job.externalId.slice(3)
    : job.externalId;

  await prisma.jobApplication.upsert({
    where: {
      userId_jobId: {
        userId: user.id,
        jobId: job.id,
      },
    },
    create: {
      userId: user.id,
      jobId: job.id,
      externalJobId: greenhouseId,
      company: job.company,
      companySlug: job.companySlug,
      boardToken: job.companySlug,
      jobTitle: job.title,
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

  console.log(`Recorded: ${job.title} at ${job.company} → ${status}`);
}

main().finally(() => prisma.$disconnect());
