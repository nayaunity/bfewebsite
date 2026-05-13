import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 400 }
    );
  }

  try {
    // STRIPE_PORTAL_CONFIG_ID points at our custom billing-portal configuration
    // (see scripts/create-stripe-portal-config.ts). The custom config disables
    // subscription_cancel + subscription_pause + subscription_update so the
    // only cancellation path is OUR /profile/account button → POST
    // /api/stripe/cancel. The Stripe portal's default config exposes a
    // multi-step cancel flow that, in failed-payment states, can record a
    // cancellation reason without actually scheduling the cancellation —
    // eleven paying users (incl. Sheerika Lacy) ended up in that drift state
    // and were charged after they thought they canceled. This is the fix.
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${request.nextUrl.origin}/profile/account`,
      ...(process.env.STRIPE_PORTAL_CONFIG_ID
        ? { configuration: process.env.STRIPE_PORTAL_CONFIG_ID }
        : {}),
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
