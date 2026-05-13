import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { activateSubscription, tierFromPriceId } from "@/lib/subscription";
import { logError } from "@/lib/error-logger";
import { Resend } from "resend";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Daily Stripe ↔ DB reconciliation. Catches drift in three buckets:
 *
 *  1. Stripe shows active/trialing/past_due → DB shows free/canceled.
 *     Most often a webhook miss after a successful re-subscription.
 *     Fix: re-run `activateSubscription()` to sync the DB.
 *
 *  2. DB shows active/trialing/past_due → Stripe shows the subscription
 *     missing or canceled. Webhook miss on `customer.subscription.deleted`.
 *     Fix: flip the DB row to free/canceled.
 *
 *  3. Partial-cancel pattern (the Sheerika failure mode):
 *     `cancellation_details.reason === "cancellation_requested"` while
 *     `cancel_at_period_end === false` and status is still live. The
 *     webhook's auto-finalize should have caught this in real time, but
 *     this cron is the safety net if a delivery was missed entirely.
 *     Fix: call `stripe.subscriptions.update(cancel_at_period_end: true)`.
 *
 * Anything fixed (or unfixable) is emailed in a daily digest to the admin.
 */

type DriftRow =
  | { kind: "stripe_active_db_inactive"; userId: string; email: string; subId: string; stripeStatus: string }
  | { kind: "db_active_stripe_canceled"; userId: string; email: string; dbStatus: string; subId: string }
  | { kind: "partial_cancel_drift"; userId: string; email: string; subId: string; stripeStatus: string; feedback: string | null; comment: string | null }
  | { kind: "fix_failed"; userId: string | null; subId: string; kind_origin: string; error: string };

async function listAllLiveSubs(): Promise<Stripe.Subscription[]> {
  const all: Stripe.Subscription[] = [];
  for (const status of ["active", "trialing", "past_due", "unpaid"] as const) {
    let starting_after: string | undefined = undefined;
    for (let i = 0; i < 50; i++) {
      const page: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
        status,
        limit: 100,
        starting_after,
      });
      all.push(...page.data);
      if (!page.has_more) break;
      starting_after = page.data[page.data.length - 1]?.id;
      if (!starting_after) break;
    }
  }
  return all;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const drift: DriftRow[] = [];
  let fixedCount = 0;

  try {
    const stripeSubs = await listAllLiveSubs();
    const stripeBySubId = new Map(stripeSubs.map((s) => [s.id, s]));

    // Bucket 3: Partial-cancel drift (highest priority — these are
    // actively billing users who tried to cancel). Walk Stripe-side.
    for (const sub of stripeSubs) {
      const cd = sub.cancellation_details;
      if (
        cd?.reason !== "cancellation_requested" ||
        sub.cancel_at_period_end === true
      ) {
        continue;
      }
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true, email: true },
      });
      drift.push({
        kind: "partial_cancel_drift",
        userId: user?.id ?? "unknown",
        email: user?.email ?? "unknown",
        subId: sub.id,
        stripeStatus: sub.status,
        feedback: cd?.feedback ?? null,
        comment: cd?.comment ?? null,
      });
      try {
        await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { cancelAtPeriodEnd: true },
          });
        }
        fixedCount++;
      } catch (err) {
        drift.push({
          kind: "fix_failed",
          userId: user?.id ?? null,
          subId: sub.id,
          kind_origin: "partial_cancel_drift",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Bucket 1: Stripe active → DB inactive. Walk Stripe-side.
    for (const sub of stripeSubs) {
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true, email: true, subscriptionStatus: true, stripeSubscriptionId: true },
      });
      if (!user) continue;
      const dbAlive =
        user.subscriptionStatus === "active" ||
        user.subscriptionStatus === "trialing" ||
        user.subscriptionStatus === "past_due";
      const matches = user.stripeSubscriptionId === sub.id && dbAlive;
      if (matches) continue;
      // Drift candidate.
      const tier = tierFromPriceId(sub.items.data[0]?.price?.id);
      if (!tier) continue;
      drift.push({
        kind: "stripe_active_db_inactive",
        userId: user.id,
        email: user.email,
        subId: sub.id,
        stripeStatus: sub.status,
      });
      try {
        await activateSubscription({ userId: user.id, subscription: sub, tier });
        fixedCount++;
      } catch (err) {
        drift.push({
          kind: "fix_failed",
          userId: user.id,
          subId: sub.id,
          kind_origin: "stripe_active_db_inactive",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Bucket 2: DB active → Stripe missing/canceled. Walk DB-side.
    const dbActiveUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: { in: ["active", "trialing", "past_due"] },
        stripeSubscriptionId: { not: null },
      },
      select: { id: true, email: true, subscriptionStatus: true, stripeSubscriptionId: true },
    });
    for (const u of dbActiveUsers) {
      if (!u.stripeSubscriptionId) continue;
      const sub = stripeBySubId.get(u.stripeSubscriptionId);
      if (sub) continue; // Sub is live in Stripe — no drift.
      // Not in our live list. Confirm it's truly canceled (not just paginated past).
      let actual: Stripe.Subscription | null = null;
      try {
        actual = await stripe.subscriptions.retrieve(u.stripeSubscriptionId);
      } catch {
        actual = null;
      }
      const stripeCanceled =
        !actual || actual.status === "canceled" || actual.status === "incomplete_expired";
      if (!stripeCanceled) continue;
      drift.push({
        kind: "db_active_stripe_canceled",
        userId: u.id,
        email: u.email,
        dbStatus: u.subscriptionStatus,
        subId: u.stripeSubscriptionId,
      });
      try {
        await prisma.user.update({
          where: { id: u.id },
          data: {
            subscriptionTier: "free",
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
        });
        fixedCount++;
      } catch (err) {
        drift.push({
          kind: "fix_failed",
          userId: u.id,
          subId: u.stripeSubscriptionId,
          kind_origin: "db_active_stripe_canceled",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const durationSec = Math.round((Date.now() - startedAt) / 1000);

    // Email digest if there's anything worth reporting.
    if (drift.length > 0 && process.env.RESEND_API_KEY) {
      try {
        const lines = drift.map((d) => {
          if (d.kind === "fix_failed") {
            return `[FIX FAILED] origin=${d.kind_origin} userId=${d.userId} sub=${d.subId} error=${d.error}`;
          }
          if (d.kind === "partial_cancel_drift") {
            return `[PARTIAL-CANCEL] user=${d.email} sub=${d.subId} status=${d.stripeStatus} feedback=${d.feedback ?? "—"} comment=${JSON.stringify(d.comment ?? "")}`;
          }
          if (d.kind === "stripe_active_db_inactive") {
            return `[STRIPE-ACTIVE/DB-INACTIVE] user=${d.email} sub=${d.subId} stripeStatus=${d.stripeStatus}`;
          }
          return `[DB-ACTIVE/STRIPE-CANCELED] user=${d.email} sub=${d.subId} dbStatus=${d.dbStatus}`;
        });
        const html = `<p>Stripe reconcile ran in ${durationSec}s and found ${drift.length} drift row(s); auto-fixed ${fixedCount}.</p><pre style="font-family:ui-monospace,monospace;white-space:pre-wrap;font-size:12px">${lines.join("\n")}</pre>`;
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Reconcile <naya@theblackfemaleengineer.com>",
          to: "theblackfemaleengineer@gmail.com",
          replyTo: "theblackfemaleengineer@gmail.com",
          subject: `[reconcile] ${drift.length} drift row(s), ${fixedCount} fixed`,
          html,
          text: lines.join("\n"),
        });
      } catch (mailErr) {
        console.error("[reconcile] digest email failed:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      durationSec,
      stripeLiveSubs: stripeSubs.length,
      driftCount: drift.length,
      fixedCount,
      drift,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[reconcile] failed:", error);
    await logError({
      endpoint: "cron/stripe-reconcile",
      method: "GET",
      status: 500,
      error: "Stripe reconcile failed",
      detail,
    });
    return NextResponse.json({ success: false, error: detail }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
