import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { logError } from "@/lib/error-logger";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tier } = body as { tier: "starter" | "pro" };

  if (!tier || !STRIPE_PRICES[tier]) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Starter tier ships with a 7-day free trial. Card is captured up front
    // ($0 due today), Stripe auto-charges $29 on day 8 unless the user cancels
    // via the customer portal. Pro tier subscribes immediately, no trial.
    const isTrial = tier === "starter";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICES[tier], quantity: 1 }],
      ...(isTrial
        ? {
            subscription_data: { trial_period_days: 7 },
            payment_method_collection: "always",
          }
        : {}),
      // Trial-start checkout returns to /onboarding/review so the user can
      // verify the resume-extracted fields (YOE, title, school, etc.) before
      // the worker starts auto-applying with potentially wrong data. Pro
      // subscribers (no trial) skip the review page since they're typically
      // existing users upgrading, not new signups.
      success_url: isTrial
        ? `${request.nextUrl.origin}/onboarding/review?session_id={CHECKOUT_SESSION_ID}`
        : `${request.nextUrl.origin}/profile?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/profile/applications`,
      metadata: { userId: session.user.id, tier, trial: isTrial ? "true" : "false" },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Stripe checkout error:", errMsg);
    await logError({
      userId: session.user.id,
      endpoint: "/api/stripe/checkout",
      method: "POST",
      status: 500,
      error: "Failed to create checkout session",
      detail: errMsg,
    });
    return NextResponse.json(
      { error: "Failed to create checkout session", detail: errMsg },
      { status: 500 }
    );
  }
}
