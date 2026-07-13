import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number" as const,
});
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const discoveries = await prisma.browseDiscovery.findMany({
    where: { status: { in: ["applied", "failed", "skipped"] } },
    select: {
      company: true,
      status: true,
      errorMessage: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const byCompany: Record<string, { applied: number; failed: number; skipped: number; errors: string[] }> = {};

  for (const d of discoveries) {
    if (!byCompany[d.company]) {
      byCompany[d.company] = { applied: 0, failed: 0, skipped: 0, errors: [] };
    }
    const co = byCompany[d.company];
    if (d.status === "applied") co.applied++;
    else if (d.status === "failed") {
      co.failed++;
      if (d.errorMessage) co.errors.push(d.errorMessage.slice(0, 100));
    } else if (d.status === "skipped") co.skipped++;
  }

  const sorted = Object.entries(byCompany)
    .map(([company, stats]) => ({
      company,
      ...stats,
      total: stats.applied + stats.failed + stats.skipped,
      rate: stats.applied / (stats.applied + stats.failed + stats.skipped),
    }))
    .filter((c) => c.total >= 2)
    .sort((a, b) => b.total - a.total);

  console.log("Company Success Rates (2+ attempts):\n");
  console.log("Company".padEnd(25) + "Applied".padStart(8) + "Failed".padStart(8) + "Skipped".padStart(8) + "Total".padStart(8) + "Rate".padStart(8));
  console.log("-".repeat(65));

  let totalApplied = 0, totalFailed = 0, totalSkipped = 0;

  for (const c of sorted) {
    totalApplied += c.applied;
    totalFailed += c.failed;
    totalSkipped += c.skipped;
    const rate = (c.rate * 100).toFixed(0) + "%";
    console.log(
      c.company.slice(0, 24).padEnd(25) +
      String(c.applied).padStart(8) +
      String(c.failed).padStart(8) +
      String(c.skipped).padStart(8) +
      String(c.total).padStart(8) +
      rate.padStart(8)
    );
  }

  const grandTotal = totalApplied + totalFailed + totalSkipped;
  console.log("-".repeat(65));
  console.log(
    "TOTAL".padEnd(25) +
    String(totalApplied).padStart(8) +
    String(totalFailed).padStart(8) +
    String(totalSkipped).padStart(8) +
    String(grandTotal).padStart(8) +
    ((totalApplied / grandTotal * 100).toFixed(0) + "%").padStart(8)
  );

  console.log("\n\nTop Error Messages:\n");
  const errorCounts: Record<string, number> = {};
  for (const c of sorted) {
    for (const e of c.errors) {
      const key = e.replace(/https?:\/\/\S+/g, "<url>").replace(/[a-f0-9-]{36}/g, "<id>");
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    }
  }
  const topErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [msg, count] of topErrors) {
    console.log(`  ${String(count).padStart(3)}x  ${msg}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
