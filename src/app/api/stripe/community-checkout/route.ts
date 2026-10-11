import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_COMMUNITY, STRIPE_PLUGIN } from "@/lib/stripe";

const PAGE = "/ai-video-editor-workshop";
const THANK_YOU = `${PAGE}/thank-you`;

const PAID_PRODUCTS = new Set(["ai-video-editor-workshop", STRIPE_PLUGIN.product]);

/**
 * Starts a Disgustingly Paid subscription checkout ($99/month).
 *
 * Two callers:
 * - The thank-you page after a workshop or plugin purchase (source
 *   "thank-you", the default). Applies the once-only $50 intro coupon that
 *   buyers are promised there, and reuses the Stripe Customer from the
 *   purchase so email is prefilled.
 * - The sales page offer card (source "sales-page"). Full $99/month, no
 *   coupon, no prior customer.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { sessionId, source } = body as {
    sessionId?: string;
    source?: "thank-you" | "sales-page";
  };
  const fromSalesPage = source === "sales-page";

  if (!STRIPE_COMMUNITY.monthlyPriceId) {
    console.error("Community checkout: STRIPE_DP_MONTHLY_PRICE_ID not set");
    return NextResponse.json(
      { error: "Membership checkout is not open yet. Try again in a moment." },
      { status: 500 }
    );
  }
  if (!fromSalesPage && !STRIPE_COMMUNITY.introCouponId) {
    console.error("Community checkout: STRIPE_DP_INTRO_COUPON_ID not set");
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
        PAID_PRODUCTS.has(prior.metadata?.product ?? "")
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
  const successUrl = fromSalesPage
    ? `${origin}${THANK_YOU}?offer=membership&community=joined`
    : `${origin}${THANK_YOU}?${sessionId ? `session_id=${sessionId}&` : ""}community=joined`;
  const cancelUrl = fromSalesPage
    ? `${origin}${PAGE}#choose-your-option`
    : `${origin}${THANK_YOU}${sessionId ? `?session_id=${sessionId}` : ""}`;
  const source_label = fromSalesPage
    ? "ai-video-editor-sales-page"
    : "ai-video-editor-thank-you";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: STRIPE_COMMUNITY.monthlyPriceId, quantity: 1 }],
      ...(fromSalesPage
        ? { allow_promotion_codes: true }
        : { discounts: [{ coupon: STRIPE_COMMUNITY.introCouponId }] }),
      ...(customerId
        ? { customer: customerId }
        : customerEmail
          ? { customer_email: customerEmail }
          : {}),
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        product: STRIPE_COMMUNITY.product,
        source: source_label,
        intro: fromSalesPage ? "no" : "yes",
        workshopSessionId: sessionId ?? "",
      },
      subscription_data: {
        description: "Disgustingly Paid membership (Skool community)",
        metadata: {
          product: STRIPE_COMMUNITY.product,
          source: source_label,
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
