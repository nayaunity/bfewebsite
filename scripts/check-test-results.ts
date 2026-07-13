import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number" as const,
});
const prisma = new PrismaClient({ adapter } as any);

const sessionId = process.argv[2];
if (!sessionId) {
  console.error("Usage: npx tsx scripts/check-test-results.ts <sessionId>");
  process.exit(1);
}

async function main() {
  const session = await prisma.browseSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      status: true,
      jobsApplied: true,
      jobsFailed: true,
      jobsSkipped: true,
      jobsFound: true,
      errorMessage: true,
      startedAt: true,
      completedAt: true,
    },
  });

  if (!session) {
    console.error(`Session ${sessionId} not found`);
    return;
  }

  console.log(`Session: ${session.id}`);
  console.log(`Status:  ${session.status}`);
  console.log(`Applied: ${session.jobsApplied} | Failed: ${session.jobsFailed} | Skipped: ${session.jobsSkipped}`);
  if (session.errorMessage) console.log(`Error:   ${session.errorMessage}`);
  if (session.startedAt) console.log(`Started: ${session.startedAt}`);
  if (session.completedAt) console.log(`Done:    ${session.completedAt}`);
  console.log("");

  const discoveries = await prisma.browseDiscovery.findMany({
    where: { sessionId },
    select: {
      company: true,
      jobTitle: true,
      status: true,
      errorMessage: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (discoveries.length === 0) {
    console.log("No discoveries yet. Worker may not have started.");
    return;
  }

  console.log(`Results (${discoveries.length} jobs):\n`);
  for (const d of discoveries) {
    const icon = d.status === "applied" ? "OK" : d.status === "skipped" ? "SKIP" : "FAIL";
    console.log(`  [${icon}] ${d.company}: ${d.jobTitle}`);
    if (d.errorMessage) {
      const msg = d.errorMessage.length > 120 ? d.errorMessage.slice(0, 120) + "..." : d.errorMessage;
      console.log(`       ${msg}`);
    }
  }

  const passed = discoveries.filter((d) => d.status === "applied").map((d) => d.company);
  const failed = discoveries.filter((d) => d.status === "failed").map((d) => d.company);
  const skipped = discoveries.filter((d) => d.status === "skipped").map((d) => d.company);

  console.log(`\nSummary:`);
  if (passed.length) console.log(`  Passed:  ${passed.join(", ")}`);
  if (failed.length) console.log(`  Failed:  ${failed.join(", ")}`);
  if (skipped.length) console.log(`  Skipped: ${skipped.join(", ")}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
