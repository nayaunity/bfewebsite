/**
 * Reset the integration test user back to free/inactive after the verification
 * fix test. queue-test-verification-session.ts promoted them to starter/active
 * so the new freeTierEndsAt wall wouldn't block the run.
 *
 * Run with:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
 *   npx tsx scripts/reset-test-user-after-verification-test.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number",
});
const prisma = new PrismaClient({ adapter });

const TEST_USER_ID = "1d16e543-db6e-497b-b78b-28fbf0a30626";

async function main() {
  await prisma.user.update({
    where: { id: TEST_USER_ID },
    data: {
      subscriptionTier: "free",
      subscriptionStatus: "inactive",
      monthlyAppCount: 0,
    },
  });
  console.log(`Reset test user ${TEST_USER_ID} to free/inactive, monthlyAppCount=0`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
