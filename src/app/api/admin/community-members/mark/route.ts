import { NextRequest, NextResponse } from "next/server";
import { requireFullAdmin } from "@/lib/admin";
import { stripe, STRIPE_COMMUNITY } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Records on the Stripe subscription that Naya has invited (or removed)
 * the member in Skool. Stripe metadata is the source of truth here so no
 * DB migration is needed.
 */
export async function POST(request: NextRequest) {
  try {
    await requireFullAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { subscriptionId, action } = body as {
    subscriptionId?: string;
    action?: "invited" | "removed";
  };
  if (!subscriptionId || !/^sub_[A-Za-z0-9]+$/.test(subscriptionId) || !action) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    if (sub.metadata?.product !== STRIPE_COMMUNITY.product) {
      return NextResponse.json({ error: "Not a community subscription" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const metadata: Record<string, string> =
      action === "invited"
        ? { skool_invited: "true", skool_invited_at: now }
        : { skool_removed: "true", skool_removed_at: now };
    await stripe.subscriptions.update(subscriptionId, { metadata });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("community-members/mark failed:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
