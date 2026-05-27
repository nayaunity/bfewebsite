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

  // Idempotency: Stripe retries failed deliveries (timeouts, 5xx, network
  // blips). Replaying customer.subscription.deleted on an already-processed
  // event could clobber state if the user has since re-subscribed. Look up
  // event.id; if we've handled it before, return 200 without re-processing.
  const already = await prisma.stripeWebhookEvent.findUnique({
    where: { id: event.id },
    select: { id: true },
  });
  if (already) {
    return NextResponse.json({ received: true, deduped: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // Auto-apply sunset: reject any new subscription activations
        console.warn("[webhook] checkout.session.completed received post-sunset — ignoring", {
          sessionId: (event.data.object as Stripe.Checkout.Session).id,
        });
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
          select: { id: true, subscriptionStatus: true, stripeSubscriptionId: true },
        });
        if (!user) break;

        // Out-of-order guard: if a deletion webhook already arrived (row is
        // canceled with the sub id nulled), refuse to reactivate the row
        // from a stale customer.subscription.updated event.
        if (
          user.subscriptionStatus === "canceled" &&
          user.stripeSubscriptionId === null
        ) {
          console.warn("[webhook] subscription.updated received after deletion — ignoring", {
            userId: user.id,
            subscriptionId: subscription.id,
            eventId: event.id,
          });
          break;
        }

        // Partial-cancel auto-finalize. The "Sheerika pattern": Stripe portal
        // recorded cancellation_details.reason but cancel_at_period_end is
        // still false, so the subscription will keep billing. Detect it,
        // finalize the cancel via Stripe API, and let the resulting webhook
        // sync the DB. Belt-and-suspenders: also store cancelAtPeriodEnd=true
        // immediately so the UI doesn't lag.
        const cd = subscription.cancellation_details;
        const isPartialCancelDrift =
          cd?.reason === "cancellation_requested" &&
          subscription.cancel_at_period_end === false &&
          (subscription.status === "active" ||
            subscription.status === "trialing" ||
            subscription.status === "past_due");

        if (isPartialCancelDrift) {
          console.warn("[webhook] partial-cancel drift detected — auto-finalizing", {
            userId: user.id,
            subscriptionId: subscription.id,
            feedback: cd?.feedback,
            comment: cd?.comment,
          });
          try {
            await stripe.subscriptions.update(subscription.id, {
              cancel_at_period_end: true,
            });
            await prisma.user.update({
              where: { id: user.id },
              data: { cancelAtPeriodEnd: true },
            });
          } catch (finalizeErr) {
            console.error("[webhook] auto-finalize failed:", finalizeErr);
            // Don't swallow — re-throw so Stripe retries this event.
            throw finalizeErr;
          }
          // Don't fall through to activateSubscription; the next event will
          // sync state with cancel_at_period_end set.
          break;
        }

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
              cancelAtPeriodEnd: subscription.cancel_at_period_end === true,
            },
          });
          break;
        }

        await activateSubscription({ userId: user.id, subscription, tier });
        // Sync the local cancelAtPeriodEnd flag whichever direction Stripe
        // moved it (user un-canceled in our flow, or the schedule changed).
        await prisma.user.update({
          where: { id: user.id },
          data: { cancelAtPeriodEnd: subscription.cancel_at_period_end === true },
        });
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
            cancelAtPeriodEnd: false,
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

    // Record the event id so retries of the same event are dropped on the
    // dedup check at the top. We only get here if no case threw — failed
    // events stay un-recorded so Stripe can retry them.
    await prisma.stripeWebhookEvent
      .create({ data: { id: event.id, type: event.type } })
      .catch((err) => {
        // Unique-constraint violation = a concurrent delivery beat us to the
        // insert. Safe to ignore; idempotency held either way.
        if (!/UNIQUE constraint failed|already exists/i.test(String(err?.message))) {
          console.error("[webhook] failed to record event id:", err);
        }
      });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
