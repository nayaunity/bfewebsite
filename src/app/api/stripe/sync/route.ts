import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

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
    const priceId = sub.items.data[0]?.price?.id;

    let tier = "free";
    if (priceId === process.env.STRIPE_STARTER_PRICE_ID) tier = "starter";
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) tier = "pro";

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: "active",
        stripeSubscriptionId: sub.id,
        currentPeriodEnd: new Date(
          (sub as unknown as { current_period_end: number }).current_period_end * 1000
        ),
      },
    });

    console.log(`[Stripe Sync] Updated ${session.user.id} to ${tier} (webhook fallback)`);
    return NextResponse.json({ synced: true, tier });
  } catch (err) {
    console.error("[Stripe Sync] Error:", err);
    return NextResponse.json({ synced: false, reason: "Stripe API error" }, { status: 500 });
  }
}
