import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * End the 7-day Stripe trial immediately for the current user. Stripe charges
 * the card on file ($29 today), flips subscriptionStatus from "trialing" to
 * "active" via the existing webhook, and unlocks the full Starter monthly cap.
 *
 * Used by the "trial cap reached" upgrade moment on the applications dashboard
 * — when a trialing user hits their 5-app trial cap and wants to keep applying
 * without waiting until day 8.
 *
 * Idempotent: if the user is already active (or has no trialing subscription),
 * returns ok with status="already_active" so the UI can refresh.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      subscriptionTier: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "No Stripe subscription on file. Start the trial first via checkout." },
      { status: 400 }
    );
  }

  if (user.subscriptionStatus !== "trialing") {
    return NextResponse.json({ ok: true, status: "already_active" });
  }

  try {
    // trial_end='now' tells Stripe to end the trial immediately. Stripe will
    // create the first invoice (charged to the card on file) and emit a
    // customer.subscription.updated webhook with status='active' which the
    // existing webhook handler already syncs to User.subscriptionStatus.
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      trial_end: "now",
    });

    // Optimistic local write: flip the row to "active" immediately so the
    // dashboard re-render after page reload picks up the new state without
    // waiting for the webhook (1-3s race window). The webhook will overwrite
    // this with the same value when it arrives — idempotent.
    await prisma.user.update({
      where: { id: session.user.id },
      data: { subscriptionStatus: "active" },
    });

    return NextResponse.json({ ok: true, status: "trial_ended" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[end-trial] Stripe update failed", message);
    return NextResponse.json(
      { error: "Could not end trial. Try again or contact support." },
      { status: 500 }
    );
  }
}
