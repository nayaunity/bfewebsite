import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PLUGIN } from "@/lib/stripe";

const PAGE = "/ai-video-editor-workshop";

/**
 * One-time $97 checkout for the AI Video Editing Plugin (Naya's configured
 * Grok Bot editing team). Fulfillment happens in the Stripe webhook on
 * checkout.session.completed with metadata.product === "ai-video-editor-plugin":
 * the buyer gets the plugin link by email. The thank-you page never shows the
 * link because it is reachable without paying.
 */
export async function POST(request: NextRequest) {
  if (!STRIPE_PLUGIN.priceId) {
    console.error("Plugin checkout: STRIPE_AIVE_PLUGIN_PRICE_ID not set");
    return NextResponse.json(
      { error: "The plugin is not on sale yet. Try again in a moment." },
      { status: 500 }
    );
  }

  const origin = request.nextUrl.origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: STRIPE_PLUGIN.priceId, quantity: 1 }],
      allow_promotion_codes: true,
      customer_creation: "always",
      success_url: `${origin}${PAGE}/thank-you?offer=plugin&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${PAGE}#choose-your-option`,
      metadata: { product: STRIPE_PLUGIN.product },
      payment_intent_data: {
        description: "AI Video Editing Plugin (Grok Bot editing team)",
        metadata: { product: STRIPE_PLUGIN.product },
        // Save the card so the Disgustingly Paid offer on the thank-you page
        // can reuse the Customer in its own subscription checkout.
        setup_future_usage: "off_session",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Plugin checkout error:", errMsg);
    return NextResponse.json(
      { error: "Failed to start checkout. Try again in a moment." },
      { status: 500 }
    );
  }
}
