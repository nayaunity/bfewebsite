import { NextRequest, NextResponse } from "next/server";
import { stripeCourse, STRIPE_COURSE_PRICES } from "@/lib/stripe";

type Tier = keyof typeof STRIPE_COURSE_PRICES;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { tier } = body as { tier?: Tier };

  if (!tier || !STRIPE_COURSE_PRICES[tier]) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const priceId = STRIPE_COURSE_PRICES[tier];
  if (!priceId) {
    return NextResponse.json(
      { error: "Price is not configured for this tier yet" },
      { status: 500 }
    );
  }

  try {
    const checkoutSession = await stripeCourse.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      customer_creation: "always",
      success_url: `${request.nextUrl.origin}/building-a-tech-audience/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/building-a-tech-audience#pricing`,
      metadata: { tier, product: "building-a-tech-audience" },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Course checkout error:", errMsg);
    return NextResponse.json(
      { error: "Failed to start checkout. Try again in a moment." },
      { status: 500 }
    );
  }
}
