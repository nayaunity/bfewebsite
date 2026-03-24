import { PrismaClient } from "@prisma/client";

// Usage: npx tsx scripts/check-already-applied.ts --company="Stripe" --title="Software Engineer"
// Returns: {"applied": true/false, "status": "submitted"/"failed"/"skipped"/null}

const prisma = new PrismaClient();

function parseArgs(): { company: string; title: string } {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--(\w+)="?([^"]*)"?$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }
  if (!args.company || !args.title) {
    console.error('Usage: check-already-applied.ts --company="X" --title="Y"');
    process.exit(1);
  }
  return { company: args.company, title: args.title };
}

async function main() {
  const { company, title } = parseArgs();

  const existing = await prisma.jobApplication.findFirst({
    where: {
      company: { equals: company },
      jobTitle: { equals: title },
      status: { in: ["submitted", "pending"] },
    },
    select: { status: true, createdAt: true },
  });

  console.log(JSON.stringify({
    applied: !!existing,
    status: existing?.status || null,
    date: existing?.createdAt || null,
  }));
}

main().finally(() => prisma.$disconnect());
