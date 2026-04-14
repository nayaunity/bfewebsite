/**
 * Retroactive refund for apply attempts that failed because our Anthropic API
 * key ran out of credits. Users were charged against their monthly app quota
 * for OUR billing outage — this script restores that quota and relabels the
 * affected BrowseDiscovery rows from "failed" to "skipped" with a tag so the
 * dashboards no longer show them as red failures.
 *
 * DRY RUN by default. Pass --apply to actually write.
 *
 * Usage:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/refund-credit-failures.ts [--apply]
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number",
});

const prisma = new PrismaClient({ adapter });

const CREDIT_ERR_FRAGMENT = "credit balance is too low";
const REFUND_TAG = "[refunded — API outage]";

async function main() {
  const apply = process.argv.includes("--apply");

  const failures = await prisma.browseDiscovery.findMany({
    where: {
      status: "failed",
      errorMessage: { contains: CREDIT_ERR_FRAGMENT },
    },
    select: {
      id: true,
      createdAt: true,
      company: true,
      jobTitle: true,
      errorMessage: true,
      session: { select: { userId: true, user: { select: { email: true, monthlyAppCount: true } } } },
    },
  });

  console.log(`Found ${failures.length} failed discoveries caused by credit exhaustion.`);

  if (failures.length === 0) {
    console.log("Nothing to refund.");
    await prisma.$disconnect();
    return;
  }

  // Group by userId
  const perUser = new Map<
    string,
    { email: string; currentCount: number; failureIds: string[] }
  >();
  for (const f of failures) {
    const uid = f.session.userId;
    if (!perUser.has(uid)) {
      perUser.set(uid, {
        email: f.session.user.email,
        currentCount: f.session.user.monthlyAppCount,
        failureIds: [],
      });
    }
    perUser.get(uid)!.failureIds.push(f.id);
  }

  console.log(`\nAffected users: ${perUser.size}`);
  console.log(`${"email".padEnd(42)} ${"current".padStart(8)} ${"refund".padStart(8)} ${"→ new".padStart(8)}`);
  console.log("-".repeat(72));

  let totalRefunded = 0;
  for (const [uid, info] of perUser) {
    const refundAmount = info.failureIds.length;
    const newCount = Math.max(0, info.currentCount - refundAmount);
    totalRefunded += info.currentCount - newCount;
    console.log(
      `${info.email.padEnd(42)} ${String(info.currentCount).padStart(8)} ${String(refundAmount).padStart(8)} ${String(newCount).padStart(8)}`
    );

    if (apply) {
      await prisma.user.update({
        where: { id: uid },
        data: { monthlyAppCount: newCount },
      });
    }
  }

  console.log(`\nTotal quota restored: ${totalRefunded} across ${perUser.size} users`);

  if (apply) {
    // Relabel the discovery rows
    const ids = failures.map((f) => f.id);
    const BATCH = 100;
    let relabeled = 0;
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH);
      for (const f of failures.filter((f) => chunk.includes(f.id))) {
        const newMsg = `${REFUND_TAG} ${f.errorMessage || ""}`.slice(0, 2000);
        await prisma.browseDiscovery.update({
          where: { id: f.id },
          data: { status: "skipped", errorMessage: newMsg },
        });
        relabeled++;
      }
    }
    console.log(`Relabeled ${relabeled} discoveries as status="skipped"`);
    console.log(`\nDone.`);
  } else {
    console.log(`\nDry run — pass --apply to actually refund and relabel.`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
