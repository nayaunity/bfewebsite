import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { activateSubscription, tierFromPriceId } from "@/lib/subscription";

/**
 * POST /api/stripe/sync
 * Fallback: syncs the user's subscription from Stripe if the webhook missed.
 * Called after successful checkout redirect.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionTier: true,
    },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ synced: false, reason: "No Stripe customer" });
  }

  // Already has a subscription ID and non-free tier — webhook worked fine
  if (user.stripeSubscriptionId && user.subscriptionTier !== "free") {
    return NextResponse.json({ synced: false, reason: "Already synced" });
  }

  try {
    // Fetch active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ synced: false, reason: "No active subscription in Stripe" });
    }

    const sub = subscriptions.data[0];
    const tier = tierFromPriceId(sub.items.data[0]?.price?.id);
    if (!tier) {
      return NextResponse.json({ synced: false, reason: "Unknown tier" });
    }

    await activateSubscription({ userId: session.user.id, subscription: sub, tier });

    console.log(`[Stripe Sync] Updated ${session.user.id} to ${tier} (webhook fallback)`);
    return NextResponse.json({ synced: true, tier });
  } catch (err) {
    console.error("[Stripe Sync] Error:", err);
    return NextResponse.json({ synced: false, reason: "Stripe API error" }, { status: 500 });
  }
}
