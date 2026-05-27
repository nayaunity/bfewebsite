/**
 * Cancel ALL Stripe subscriptions to prevent any future billing.
 *
 * Strategy:
 *   - active:   cancel_at_period_end (user already paid for this period)
 *   - trialing: cancel immediately (prevent trial-to-paid conversion)
 *   - past_due: cancel immediately (stop dunning retries)
 *   - unpaid:   cancel immediately
 *
 * Also cancels any queued/processing BrowseSession rows.
 *
 * Dry-run (default):
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | head -1 | sed 's/^DATABASE_URL=//' | tr -d '"') \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | head -1 | sed 's/^DATABASE_AUTH_TOKEN=//' | tr -d '"') \
 *   STRIPE_SECRET_KEY=$(grep "^STRIPE_SECRET_KEY=" .env.production | head -1 | sed 's/^STRIPE_SECRET_KEY=//' | tr -d '"') \
 *   npx tsx scripts/sunset-cancel-all-subscriptions.ts
 *
 * Apply:
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | head -1 | sed 's/^DATABASE_URL=//' | tr -d '"') \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | head -1 | sed 's/^DATABASE_AUTH_TOKEN=//' | tr -d '"') \
 *   STRIPE_SECRET_KEY=$(grep "^STRIPE_SECRET_KEY=" .env.production | head -1 | sed 's/^STRIPE_SECRET_KEY=//' | tr -d '"') \
 *   npx tsx scripts/sunset-cancel-all-subscriptions.ts --apply
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import Stripe from "stripe";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number",
});
const prisma = new PrismaClient({ adapter });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function listAllLiveSubscriptions(): Promise<Stripe.Subscription[]> {
  const all: Stripe.Subscription[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const page = await stripe.subscriptions.list({
      status: "all",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const sub of page.data) {
      if (["active", "trialing", "past_due", "unpaid"].includes(sub.status)) {
        all.push(sub);
      }
    }

    hasMore = page.has_more;
    if (page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id;
    }
  }

  return all;
}

async function main() {
  const apply = process.argv[2] === "--apply";

  console.log(`Mode: ${apply ? "APPLY (real cancellations)" : "DRY-RUN (no changes)"}\n`);

  // 1. List all live Stripe subscriptions
  console.log("Fetching all live subscriptions from Stripe...");
  const subscriptions = await listAllLiveSubscriptions();
  console.log(`Found ${subscriptions.length} live subscriptions.\n`);

  if (subscriptions.length === 0) {
    console.log("No live subscriptions. Nothing to cancel.");
  }

  let cancelledImmediately = 0;
  let scheduledEnd = 0;
  let errors = 0;

  for (const sub of subscriptions) {
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { stripeSubscriptionId: sub.id },
          { stripeCustomerId: customerId },
        ],
      },
      select: { id: true, email: true },
    });

    const email = user?.email ?? "unknown";
    const immediate = ["trialing", "past_due", "unpaid"].includes(sub.status);

    if (immediate) {
      console.log(`  [CANCEL NOW]      ${sub.id} (${sub.status}) — ${email}`);
    } else {
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toLocaleDateString()
        : "unknown";
      console.log(`  [CANCEL AT END]   ${sub.id} (${sub.status}, ends ${periodEnd}) — ${email}`);
    }

    if (!apply) continue;

    try {
      if (immediate) {
        try {
          await stripe.subscriptions.cancel(sub.id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!/already canceled|no such subscription/i.test(msg)) throw err;
        }

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionTier: "free",
              subscriptionStatus: "canceled",
              stripeSubscriptionId: null,
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false,
            },
          });
        }
        cancelledImmediately++;
      } else {
        await stripe.subscriptions.update(sub.id, {
          cancel_at_period_end: true,
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { cancelAtPeriodEnd: true },
          });
        }
        scheduledEnd++;
      }
    } catch (err) {
      console.error(`  ERROR on ${sub.id}:`, err instanceof Error ? err.message : err);
      errors++;
    }
  }

  // 2. Cancel any queued/processing browse sessions
  console.log("\nChecking for in-flight browse sessions...");
  const inFlightSessions = await prisma.browseSession.findMany({
    where: { status: { in: ["queued", "planning", "processing", "awaiting_review"] } },
    select: { id: true, status: true },
  });
  console.log(`Found ${inFlightSessions.length} in-flight sessions.`);

  if (apply && inFlightSessions.length > 0) {
    const result = await prisma.browseSession.updateMany({
      where: { status: { in: ["queued", "planning", "processing", "awaiting_review"] } },
      data: { status: "canceled", errorMessage: "Auto-apply sunset" },
    });
    console.log(`Canceled ${result.count} browse sessions.`);
  }

  // Summary
  console.log("\n--- Summary ---");
  console.log(`Total live subscriptions found: ${subscriptions.length}`);
  if (apply) {
    console.log(`Canceled immediately: ${cancelledImmediately}`);
    console.log(`Scheduled for period end: ${scheduledEnd}`);
    console.log(`Errors: ${errors}`);
    console.log(`Browse sessions canceled: ${inFlightSessions.length}`);
  } else {
    const wouldImmediate = subscriptions.filter((s) =>
      ["trialing", "past_due", "unpaid"].includes(s.status)
    ).length;
    const wouldSchedule = subscriptions.length - wouldImmediate;
    console.log(`Would cancel immediately: ${wouldImmediate}`);
    console.log(`Would schedule for period end: ${wouldSchedule}`);
    console.log(`Would cancel ${inFlightSessions.length} browse sessions`);
    console.log("\nRun with --apply to execute.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
