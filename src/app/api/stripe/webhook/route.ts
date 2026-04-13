import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { activateSubscription, tierFromPriceId } from "@/lib/subscription";
import Stripe from "stripe";

export const runtime = "nodejs";

async function resolveUserId(
  metadataUserId: string | undefined,
  customerId: string | null | undefined,
  customerEmail: string | null | undefined
): Promise<string | null> {
  if (metadataUserId) return metadataUserId;
  if (customerId) {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    if (user) return user.id;
  }
  if (customerEmail) {
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
      select: { id: true },
    });
    if (user) return user.id;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadataTier = session.metadata?.tier as
          | "starter"
          | "pro"
          | undefined;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;

        const userId = await resolveUserId(
          session.metadata?.userId,
          customerId,
          session.customer_details?.email ?? session.customer_email ?? null
        );

        if (!userId) {
          console.error("[webhook] checkout.session.completed: could not resolve user", {
            sessionId: session.id,
            customerId,
          });
          // Return 200 to stop Stripe retries — the sync fallbacks and admin
          // reconcile endpoint will catch any user that slips through here.
          return NextResponse.json({ received: true, handled: false });
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (!subscriptionId) {
          console.error("[webhook] checkout.session.completed: no subscription on session", {
            sessionId: session.id,
          });
          return NextResponse.json({ received: true, handled: false });
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const tier =
          metadataTier ??
          tierFromPriceId(subscription.items.data[0]?.price?.id);

        if (!tier) {
          console.error("[webhook] checkout.session.completed: unknown tier", {
            sessionId: session.id,
            priceId: subscription.items.data[0]?.price?.id,
          });
          return NextResponse.json({ received: true, handled: false });
        }

        await activateSubscription({ userId, subscription, tier });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (
          invoice as unknown as { subscription: string | null }
        ).subscription;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const userId = await resolveUserId(
          subscription.metadata?.userId,
          customerId,
          invoice.customer_email ?? null
        );
        if (!userId) {
          console.error("[webhook] invoice.payment_succeeded: could not resolve user", {
            invoiceId: invoice.id,
            subscriptionId,
          });
          return NextResponse.json({ received: true, handled: false });
        }

        const tier = tierFromPriceId(subscription.items.data[0]?.price?.id);
        if (!tier) break;

        await activateSubscription({ userId, subscription, tier });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscription.id },
              { stripeCustomerId: customerId },
            ],
          },
          select: { id: true },
        });
        if (!user) break;

        const tier = tierFromPriceId(subscription.items.data[0]?.price?.id);
        if (!tier) {
          // Unknown price — just update status/period, don't flip tier.
          const rootCpe = (subscription as unknown as { current_period_end?: number }).current_period_end;
          const itemCpe = (subscription.items.data[0] as unknown as { current_period_end?: number })?.current_period_end;
          const cpe = rootCpe ?? itemCpe;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus:
                subscription.status === "active" ? "active" : subscription.status,
              currentPeriodEnd: cpe ? new Date(cpe * 1000) : null,
            },
          });
          break;
        }

        await activateSubscription({ userId: user.id, subscription, tier });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
          select: { id: true },
        });
        if (!user) break;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: "free",
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (
          invoice as unknown as { subscription: string | null }
        ).subscription;
        if (!subscriptionId) break;

        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          select: { id: true },
        });
        if (!user) break;

        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: "past_due" },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
