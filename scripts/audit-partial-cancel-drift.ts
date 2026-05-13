/**
 * Finds every paying user whose Stripe subscription is in the
 * partial-cancel drift state (cancellation_details.reason ===
 * "cancellation_requested" but cancel_at_period_end === false and status
 * still live). For each: figure out when they expressed cancel intent
 * (the customer.subscription.updated event that flipped
 * cancellation_details.reason from null to "cancellation_requested"),
 * refund every successful charge that landed after that timestamp, cancel
 * the subscription, draft an apology email, and print the draft so Naya
 * can approve before sending.
 *
 * Dry-run by default. Add --apply to actually refund + cancel.
 *
 *   STRIPE_SECRET_KEY=sk_live_... \
 *   DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... \
 *   npx tsx scripts/audit-partial-cancel-drift.ts
 *
 *   ... add --apply when you've reviewed the dry-run output.
 */
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const apply = process.argv.includes("--apply");

// Sheerika's sub was hand-resolved already; don't re-process it.
const ALREADY_RESOLVED = new Set<string>(["sub_1TOkbQAbS888QtQNT1rfBI30"]);

type DriftRow = {
  userId: string | null;
  email: string | null;
  firstName: string | null;
  subId: string;
  customerId: string;
  stripeStatus: string;
  currentPeriodEnd: Date | null;
  feedback: string | null;
  comment: string | null;
  intentTs: Date | null;
  intentTsSource: "stripe_event" | "current_period_start_fallback";
  successfulChargesAfterIntent: Array<{ id: string; amount: number; created: Date }>;
};

async function findIntentTimestamp(
  stripe: Stripe,
  subId: string
): Promise<Date | null> {
  // Page through customer.subscription.updated events (Stripe retains 30 days).
  let starting_after: string | undefined = undefined;
  let earliest: Date | null = null;
  for (let i = 0; i < 30; i++) {
    const page: Stripe.ApiList<Stripe.Event> = await stripe.events.list({
      type: "customer.subscription.updated",
      limit: 100,
      starting_after,
    });
    for (const evt of page.data) {
      const obj = evt.data.object as Stripe.Subscription;
      if (obj.id !== subId) continue;
      const prev = (evt.data.previous_attributes ?? {}) as {
        cancellation_details?: { reason?: string | null };
      };
      const becameRequested =
        obj.cancellation_details?.reason === "cancellation_requested" &&
        prev.cancellation_details &&
        prev.cancellation_details.reason !== "cancellation_requested";
      if (becameRequested) {
        const ts = new Date(evt.created * 1000);
        if (!earliest || ts < earliest) earliest = ts;
      }
    }
    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1]?.id;
    if (!starting_after) break;
  }
  return earliest;
}

async function chargesAfter(
  stripe: Stripe,
  customerId: string,
  since: Date
): Promise<Array<{ id: string; amount: number; created: Date }>> {
  const out: Array<{ id: string; amount: number; created: Date }> = [];
  let starting_after: string | undefined = undefined;
  for (let i = 0; i < 20; i++) {
    const page: Stripe.ApiList<Stripe.Charge> = await stripe.charges.list({
      customer: customerId,
      created: { gte: Math.floor(since.getTime() / 1000) },
      limit: 100,
      starting_after,
    });
    for (const c of page.data) {
      if (c.status !== "succeeded") continue;
      if (c.refunded) continue;
      out.push({ id: c.id, amount: c.amount, created: new Date(c.created * 1000) });
    }
    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1]?.id;
    if (!starting_after) break;
  }
  return out;
}

function fmtUSD(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toISOString().slice(0, 16).replace("T", " ");
}

function draftApologyEmail(
  row: DriftRow,
  cancelMode: "immediate" | "at_period_end",
  periodEnd: Date | null
): { subject: string; text: string } {
  const totalCents = row.successfulChargesAfterIntent.reduce((s, c) => s + c.amount, 0);
  const greeting = row.firstName ? `Hi ${row.firstName},` : "Hi,";

  const actionLine = (() => {
    if (row.successfulChargesAfterIntent.length === 1) {
      return `I refunded the ${fmtUSD(totalCents)} charge from ${fmtDate(row.successfulChargesAfterIntent[0].created)} (it should land back on your card in 5 to 10 business days) and canceled your subscription.`;
    }
    if (row.successfulChargesAfterIntent.length > 1) {
      return `I refunded ${row.successfulChargesAfterIntent.length} charges totaling ${fmtUSD(totalCents)} (they should land back on your card in 5 to 10 business days) and canceled your subscription.`;
    }
    // No post-intent charges → cancel at period end so they keep what they paid for.
    if (cancelMode === "at_period_end" && periodEnd) {
      return `I scheduled your cancellation for ${fmtDate(periodEnd).slice(0, 10)} (the end of the period you've already paid for). You won't be charged again after that.`;
    }
    return `I canceled your subscription. You won't be billed again.`;
  })();

  const subject =
    row.successfulChargesAfterIntent.length > 0
      ? "Refund processed and account canceled"
      : "Cancellation confirmed";

  const text = `${greeting}

I'm reaching out because I noticed something on your account and I'm sorry it happened. ${actionLine}

The bug: when you went to cancel through Stripe's billing portal, the portal recorded your cancellation reason but didn't actually schedule the cancellation. Your subscription stayed active. You did everything right; the system didn't.

I'm fixing this now so it can't happen to anyone else. Going forward, the cancel button lives directly in your account settings at theblackfemaleengineer.com/profile/account, not buried in Stripe's portal.

Thank you for your patience. If there's anything else I can do, just reply.

Naya`;
  return { subject, text };
}

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const dbUrl = process.env.DATABASE_URL;
  const dbAuth = process.env.DATABASE_AUTH_TOKEN;
  if (!stripeKey || !dbUrl) {
    console.error("Missing STRIPE_SECRET_KEY or DATABASE_URL");
    process.exit(1);
  }
  const stripe = new Stripe(stripeKey);
  const adapter = new PrismaLibSQL({ url: dbUrl, authToken: dbAuth, intMode: "number" });
  const prisma = new PrismaClient({ adapter });

  console.log(`[audit] mode=${apply ? "APPLY" : "DRY-RUN"}`);

  // List all live subs and pick out the drift cases.
  const allSubs: Stripe.Subscription[] = [];
  for (const status of ["active", "trialing", "past_due", "unpaid"] as const) {
    let starting_after: string | undefined = undefined;
    for (let i = 0; i < 30; i++) {
      const page: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
        status,
        limit: 100,
        starting_after,
      });
      allSubs.push(...page.data);
      if (!page.has_more) break;
      starting_after = page.data[page.data.length - 1]?.id;
      if (!starting_after) break;
    }
  }

  const driftSubs = allSubs.filter((s) => {
    if (ALREADY_RESOLVED.has(s.id)) return false;
    const cd = s.cancellation_details;
    return (
      cd?.reason === "cancellation_requested" &&
      s.cancel_at_period_end === false
    );
  });
  console.log(`[audit] found ${driftSubs.length} drift subs (excluding already-resolved)`);

  const rows: DriftRow[] = [];
  for (const sub of driftSubs) {
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true, email: true, firstName: true },
    });
    const eventTs = await findIntentTimestamp(stripe, sub.id);
    const intentTs =
      eventTs ?? new Date((sub as unknown as { current_period_start: number }).current_period_start * 1000);
    const charges = await chargesAfter(stripe, customerId, intentTs);
    rows.push({
      userId: user?.id ?? null,
      email: user?.email ?? null,
      firstName: user?.firstName ?? null,
      subId: sub.id,
      customerId,
      stripeStatus: sub.status,
      currentPeriodEnd: (() => {
        const cpe = (sub as unknown as { current_period_end: number | null }).current_period_end;
        return cpe ? new Date(cpe * 1000) : null;
      })(),
      feedback: sub.cancellation_details?.feedback ?? null,
      comment: sub.cancellation_details?.comment ?? null,
      intentTs,
      intentTsSource: eventTs ? "stripe_event" : "current_period_start_fallback",
      successfulChargesAfterIntent: charges,
    });
  }

  console.log("\n=== Drift table ===");
  for (const r of rows) {
    console.log(
      `\nUser: ${r.firstName ?? "?"} <${r.email ?? "?"}>  (id=${r.userId ?? "?"})\n  sub=${r.subId} customer=${r.customerId} status=${r.stripeStatus}\n  feedback=${r.feedback ?? "—"}  comment=${JSON.stringify(r.comment ?? "")}\n  intent=${fmtDate(r.intentTs)} (${r.intentTsSource})\n  charges since intent: ${r.successfulChargesAfterIntent.length}, total=${fmtUSD(r.successfulChargesAfterIntent.reduce((s, c) => s + c.amount, 0))}`
    );
    for (const c of r.successfulChargesAfterIntent) {
      console.log(`    ${c.id}  ${fmtUSD(c.amount)}  ${fmtDate(c.created)}`);
    }
  }

  if (!apply) {
    console.log(
      `\n[audit] DRY-RUN complete. Total charges to refund across ${rows.length} users: ${rows.reduce((s, r) => s + r.successfulChargesAfterIntent.length, 0)} (${fmtUSD(rows.reduce((s, r) => s + r.successfulChargesAfterIntent.reduce((a, c) => a + c.amount, 0), 0))}). Re-run with --apply to execute.`
    );
    await prisma.$disconnect();
    return;
  }

  console.log("\n=== APPLY ===");
  for (const r of rows) {
    const hasPostIntentCharges = r.successfulChargesAfterIntent.length > 0;
    const cancelMode: "immediate" | "at_period_end" = hasPostIntentCharges
      ? "immediate"
      : "at_period_end";
    console.log(`\n→ ${r.email ?? r.subId}  mode=${cancelMode}`);
    // Refund every successful charge after intent.
    for (const c of r.successfulChargesAfterIntent) {
      try {
        const refund = await stripe.refunds.create({
          charge: c.id,
          reason: "requested_by_customer",
          metadata: {
            support_audit: "partial-cancel-drift-2026-05-13",
            sub_id: r.subId,
            user_id: r.userId ?? "unknown",
          },
        });
        console.log(`  refunded ${c.id}: ${refund.id} status=${refund.status}`);
      } catch (err) {
        console.log(`  REFUND FAILED ${c.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    // Cancel: immediate if we just refunded, otherwise schedule at period end
    // so they keep what they actually paid for.
    try {
      if (cancelMode === "immediate") {
        const canceled = await stripe.subscriptions.cancel(r.subId);
        console.log(`  canceled immediately: status=${canceled.status} endedAt=${canceled.ended_at ? new Date(canceled.ended_at * 1000).toISOString() : "—"}`);
        if (r.userId) {
          await prisma.user.update({
            where: { id: r.userId },
            data: {
              subscriptionTier: "free",
              subscriptionStatus: "canceled",
              stripeSubscriptionId: null,
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false,
            },
          });
          console.log(`  DB synced to free/canceled`);
        }
      } else {
        const updated = await stripe.subscriptions.update(r.subId, { cancel_at_period_end: true });
        const updCpe = (updated as unknown as { current_period_end: number | null }).current_period_end;
        console.log(`  scheduled cancel: cancel_at_period_end=${updated.cancel_at_period_end} endsAt=${updCpe ? new Date(updCpe * 1000).toISOString() : "—"}`);
        if (r.userId) {
          await prisma.user.update({
            where: { id: r.userId },
            data: { cancelAtPeriodEnd: true },
          });
          console.log(`  DB cancelAtPeriodEnd=true`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/already canceled|no such subscription/i.test(msg)) {
        console.log(`  sub already canceled — fine`);
      } else {
        console.log(`  CANCEL FAILED: ${msg}`);
      }
    }
    // Draft email (DON'T SEND — Naya approves each).
    const draft = draftApologyEmail(r, cancelMode, r.currentPeriodEnd);
    console.log(`\n  --- DRAFT EMAIL (DO NOT SEND without approval) ---`);
    console.log(`  To: ${r.email}`);
    console.log(`  Subject: ${draft.subject}`);
    console.log(`  Body:\n${draft.text.split("\n").map((l) => "  | " + l).join("\n")}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
