import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logError } from "@/lib/error-logger";

/**
 * User-initiated subscription cancel.
 *
 * - active / trialing → cancel at period end. They keep what they already paid
 *   for; the customer.subscription.deleted webhook fires when the period
 *   actually closes and our handler flips them to free/canceled then.
 * - past_due / unpaid → cancel immediately. They aren't being charged
 *   successfully anyway; immediate cancel stops Stripe's dunning retries.
 *
 * Idempotent: re-canceling a subscription that's already scheduled or already
 * canceled returns ok=true.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
    },
  });

  if (!user?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 400 }
    );
  }

  const immediate =
    user.subscriptionStatus === "past_due" ||
    user.subscriptionStatus === "unpaid";

  try {
    if (immediate) {
      try {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Already canceled / no-op — fine, treat as success.
        if (!/already canceled|no such subscription/i.test(msg)) throw err;
      }

      // Defensive DB sync. The customer.subscription.deleted webhook will fire
      // and do this too, but doing it inline means the Account page reflects
      // the change on the very next request without waiting for Stripe.
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: "free",
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
        },
      });

      return NextResponse.json({ ok: true, mode: "immediate" });
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      ok: true,
      mode: "at_period_end",
      endsAt: user.currentPeriodEnd?.toISOString() ?? null,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("Stripe cancel error:", err);
    await logError({
      userId: user.id,
      endpoint: "stripe/cancel",
      method: "POST",
      status: 500,
      error: "Failed to cancel subscription",
      detail,
    });
    return NextResponse.json(
      { error: "Could not cancel your subscription. Please try again." },
      { status: 500 }
    );
  }
}
