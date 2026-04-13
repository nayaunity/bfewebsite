import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { activateSubscription, tierFromPriceId } from "@/lib/subscription";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/admin/stripe/reconcile[?fix=1]
 *
 * Compares every active subscription in Stripe against our DB. Flags users
 * whose Stripe subscription is active but whose DB row still shows free /
 * inactive (the webhook-miss case). With ?fix=1, repairs the mismatches.
 *
 * Read-only by default — always check the report before running with ?fix=1.
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fix = request.nextUrl.searchParams.get("fix") === "1";

  const mismatches: Array<{
    userId: string | null;
    email: string | null;
    customerId: string;
    subscriptionId: string;
    tier: "starter" | "pro";
    dbTier: string | null;
    fixed: boolean;
    reason?: string;
  }> = [];

  let cursor: string | undefined = undefined;
  let totalActive = 0;

  try {
    while (true) {
      const page: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
        status: "active",
        limit: 100,
        ...(cursor ? { starting_after: cursor } : {}),
      });
      totalActive += page.data.length;

      for (const sub of page.data) {
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const tier = tierFromPriceId(sub.items.data[0]?.price?.id);
        if (!tier) continue;

        let userId = sub.metadata?.userId ?? null;
        let email: string | null = null;

        if (!userId) {
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
            select: { id: true, email: true },
          });
          if (user) {
            userId = user.id;
            email = user.email;
          }
        }

        if (!userId) {
          // Try via customer email
          const customer = await stripe.customers.retrieve(customerId);
          if (!customer.deleted && customer.email) {
            email = customer.email;
            const user = await prisma.user.findUnique({
              where: { email: customer.email },
              select: { id: true },
            });
            if (user) userId = user.id;
          }
        }

        if (!userId) {
          mismatches.push({
            userId: null,
            email,
            customerId,
            subscriptionId: sub.id,
            tier,
            dbTier: null,
            fixed: false,
            reason: "No matching DB user",
          });
          continue;
        }

        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            subscriptionTier: true,
            stripeSubscriptionId: true,
          },
        });
        if (!dbUser) continue;

        const isSynced =
          dbUser.subscriptionTier === tier &&
          dbUser.stripeSubscriptionId === sub.id;
        if (isSynced) continue;

        let fixed = false;
        if (fix) {
          try {
            await activateSubscription({ userId, subscription: sub, tier });
            fixed = true;
          } catch (err) {
            console.error("[reconcile] fix failed", { userId, err });
          }
        }

        mismatches.push({
          userId,
          email: dbUser.email,
          customerId,
          subscriptionId: sub.id,
          tier,
          dbTier: dbUser.subscriptionTier,
          fixed,
        });
      }

      if (!page.has_more) break;
      cursor = page.data[page.data.length - 1]?.id;
      if (!cursor) break;
    }

    return NextResponse.json({
      totalActiveStripeSubs: totalActive,
      mismatchCount: mismatches.length,
      fixedCount: mismatches.filter((m) => m.fixed).length,
      fixMode: fix,
      mismatches,
    });
  } catch (err) {
    console.error("[reconcile] error", err);
    return NextResponse.json(
      { error: "Reconciliation failed", detail: String(err) },
      { status: 500 }
    );
  }
}
