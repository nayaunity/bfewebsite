import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { activateSubscription, tierFromPriceId } from "@/lib/subscription";

export const runtime = "nodejs";

/**
 * GET /api/stripe/sync-by-session?session_id=cs_live_...
 *
 * Unauthenticated fallback that activates a user's subscription from a
 * Stripe Checkout Session ID. Used when the webhook didn't deliver and the
 * user may or may not be signed in (e.g., conversion-email purchases).
 *
 * Safe because the only way to obtain a session_id is via Stripe's success
 * redirect — the ID is not discoverable and maps to a specific user via
 * the session's metadata/customer.
 *
 * Idempotent: no-ops if the user is already on the target tier.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ synced: false, reason: "Missing session_id" }, { status: 400 });
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({
        synced: false,
        reason: `Payment status: ${checkoutSession.payment_status}`,
      });
    }

    const customerId =
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : checkoutSession.customer?.id ?? null;

    // Resolve user: metadata userId > stripe customer > email
    let userId = checkoutSession.metadata?.userId ?? null;
    if (!userId && customerId) {
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      });
      if (user) userId = user.id;
    }
    if (!userId) {
      const email =
        checkoutSession.customer_details?.email ??
        checkoutSession.customer_email ??
        null;
      if (email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (user) userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ synced: false, reason: "User not found" }, { status: 404 });
    }

    const subscriptionId =
      typeof checkoutSession.subscription === "string"
        ? checkoutSession.subscription
        : checkoutSession.subscription?.id ?? null;
    if (!subscriptionId) {
      return NextResponse.json({ synced: false, reason: "No subscription on session" });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const metadataTier = checkoutSession.metadata?.tier as
      | "starter"
      | "pro"
      | undefined;
    const tier =
      metadataTier ?? tierFromPriceId(subscription.items.data[0]?.price?.id);
    if (!tier) {
      return NextResponse.json({ synced: false, reason: "Unknown tier" });
    }

    // Idempotency short-circuit
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, stripeSubscriptionId: true },
    });
    if (
      existing?.subscriptionTier === tier &&
      existing.stripeSubscriptionId === subscription.id
    ) {
      return NextResponse.json({ synced: false, reason: "Already synced", tier });
    }

    await activateSubscription({ userId, subscription, tier });
    console.log(`[sync-by-session] Activated ${userId} as ${tier} from ${sessionId}`);

    return NextResponse.json({ synced: true, tier });
  } catch (err) {
    console.error("[sync-by-session] Error:", err);
    return NextResponse.json(
      { synced: false, reason: "Stripe API error" },
      { status: 500 }
    );
  }
}
