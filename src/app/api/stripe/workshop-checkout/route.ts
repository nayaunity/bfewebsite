import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WORKSHOP_PRICES } from "@/lib/stripe";

type WorkshopKey = keyof typeof STRIPE_WORKSHOP_PRICES;

const WORKSHOPS: Record<
  WorkshopKey,
  { slug: string; successPath: string; cancelPath: string }
> = {
  aiVideoEditor: {
    slug: "ai-video-editor-workshop",
    successPath: "/ai-video-editor-workshop/thank-you",
    cancelPath: "/ai-video-editor-workshop#register",
  },
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { workshop } = body as { workshop?: WorkshopKey };

  if (!workshop || !WORKSHOPS[workshop]) {
    return NextResponse.json({ error: "Invalid workshop" }, { status: 400 });
  }

  const priceId = STRIPE_WORKSHOP_PRICES[workshop];
  if (!priceId) {
    console.error(`Workshop checkout: price not configured for ${workshop}`);
    return NextResponse.json(
      { error: "Registration is not open yet. Try again in a moment." },
      { status: 500 }
    );
  }

  const config = WORKSHOPS[workshop];

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      customer_creation: "always",
      success_url: `${request.nextUrl.origin}${config.successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}${config.cancelPath}`,
      metadata: { product: config.slug, workshop },
      payment_intent_data: {
        description: "Build Your AI Video Editing Team: Live Workshop (Oct 24, 2026)",
        metadata: { product: config.slug, workshop },
        // Save the card so the Disgustingly Paid upsell on the thank-you
        // page can prefill payment details in its own subscription checkout.
        setup_future_usage: "off_session",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Workshop checkout error:", errMsg);
    return NextResponse.json(
      { error: "Failed to start checkout. Try again in a moment." },
      { status: 500 }
    );
  }
}
