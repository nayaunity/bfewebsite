import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Unauthenticated checkout endpoint for conversion emails.
 * Creates a Stripe checkout session with a pre-applied coupon
 * and pre-filled customer email — no login required.
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const tier = request.nextUrl.searchParams.get("tier") as "starter" | "pro" | null;
  const coupon = request.nextUrl.searchParams.get("coupon");

  if (!email || !tier || !STRIPE_PRICES[tier]) {
    return NextResponse.json({ error: "Missing email or tier" }, { status: 400 });
  }

  try {
    // Look up user to get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, stripeCustomerId: true, subscriptionTier: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Already paid — redirect to dashboard
    if (user.subscriptionTier && user.subscriptionTier !== "free") {
      return NextResponse.redirect(new URL("/profile/applications", request.nextUrl.origin));
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session with coupon
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICES[tier], quantity: 1 }],
      ...(coupon ? { discounts: [{ coupon }] } : {}),
      success_url: `${request.nextUrl.origin}/profile?subscription=success`,
      cancel_url: `${request.nextUrl.origin}/profile/applications`,
      metadata: { userId: user.id, tier, source: "conversion-email" },
    });

    // Redirect directly to Stripe checkout
    return NextResponse.redirect(checkoutSession.url!);
  } catch (error) {
    console.error("Convert checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
