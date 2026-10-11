import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_COMMUNITY } from "@/lib/stripe";

const THANK_YOU = "/ai-video-editor-workshop/thank-you";

/**
 * Starts a subscription checkout for Disgustingly Paid ($49 first month via
 * a once-only coupon, then $99/month). Called from the workshop thank-you
 * page. If the caller passes the workshop Checkout Session id, we reuse the
 * Stripe Customer it created so email and saved card are prefilled.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { sessionId } = body as { sessionId?: string };

  if (!STRIPE_COMMUNITY.monthlyPriceId || !STRIPE_COMMUNITY.introCouponId) {
    console.error("Community checkout: price or coupon env var not set");
    return NextResponse.json(
      { error: "Membership checkout is not open yet. Try again in a moment." },
      { status: 500 }
    );
  }

  let customerId: string | undefined;
  let customerEmail: string | undefined;
  if (sessionId && /^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) {
    try {
      const prior = await stripe.checkout.sessions.retrieve(sessionId);
      if (
        prior.payment_status === "paid" &&
        prior.metadata?.product === "ai-video-editor-workshop"
      ) {
        customerId =
          typeof prior.customer === "string"
            ? prior.customer
            : prior.customer?.id;
        customerEmail = prior.customer_details?.email ?? undefined;
      }
    } catch (err) {
      // Fall through: we can still sell the membership without the link.
      console.warn("Community checkout: could not load prior session", err);
    }
  }

  const origin = request.nextUrl.origin;
  const back = sessionId ? `${THANK_YOU}?session_id=${sessionId}` : THANK_YOU;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: STRIPE_COMMUNITY.monthlyPriceId, quantity: 1 }],
      discounts: [{ coupon: STRIPE_COMMUNITY.introCouponId }],
      ...(customerId
        ? { customer: customerId }
        : customerEmail
          ? { customer_email: customerEmail }
          : {}),
      success_url: `${origin}${back}${back.includes("?") ? "&" : "?"}community=joined`,
      cancel_url: `${origin}${back}`,
      metadata: {
        product: STRIPE_COMMUNITY.product,
        source: "ai-video-editor-workshop",
        workshopSessionId: sessionId ?? "",
      },
      subscription_data: {
        description: "Disgustingly Paid membership (Skool community)",
        metadata: {
          product: STRIPE_COMMUNITY.product,
          source: "ai-video-editor-workshop",
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Community checkout error:", errMsg);
    return NextResponse.json(
      { error: "Failed to start checkout. Try again in a moment." },
      { status: 500 }
    );
  }
}
