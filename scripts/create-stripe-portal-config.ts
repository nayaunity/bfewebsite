/**
 * One-off setup script. Creates a Stripe billing-portal configuration that
 * matches our cancel policy: users can update their card and see invoice
 * history, but cannot cancel or pause from inside the Stripe portal. All
 * cancellations now have to go through OUR `/profile/account` page, which
 * calls POST /api/stripe/cancel with explicit semantics.
 *
 * Why: Stripe's default portal lets users start a multi-step cancel flow
 * that, in failed-payment states, can save a cancellation reason WITHOUT
 * actually scheduling the cancellation. Eleven paying users have ended up
 * in that drift state and been charged after they thought they canceled
 * (Sheerika's case, May 13 2026). The portal is the leak. This config
 * removes the leak.
 *
 * Run:
 *   STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/create-stripe-portal-config.ts
 *
 * Then take the bpc_... id it prints and add it to Vercel env as
 * STRIPE_PORTAL_CONFIG_ID (production + preview).
 */
import Stripe from "stripe";

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("STRIPE_SECRET_KEY missing");
    process.exit(1);
  }
  const stripe = new Stripe(key);

  const cfg = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "To cancel, use the button in your account settings.",
      privacy_policy_url: "https://www.theblackfemaleengineer.com/privacy",
      terms_of_service_url: "https://www.theblackfemaleengineer.com/terms",
    },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      // The whole reason this script exists. Off.
      subscription_cancel: { enabled: false },
      // Pause exposes the same multi-step flow shape. Off. (Not in the
      // current @types/stripe Features shape, but the API accepts it.)
      ...({ subscription_pause: { enabled: false } } as Record<string, unknown>),
      // Tier swaps go through /pricing, not the portal.
      subscription_update: { enabled: false },
    },
    default_return_url: "https://www.theblackfemaleengineer.com/profile/account",
    metadata: {
      created_by: "create-stripe-portal-config.ts",
      reason: "lock-down-cancel-leak-2026-05-13",
    },
  });

  console.log("Created portal configuration:");
  console.log("  id:", cfg.id);
  console.log("  is_default:", cfg.is_default);
  console.log();
  console.log("Next step — add to Vercel env (production AND preview):");
  console.log(`  STRIPE_PORTAL_CONFIG_ID=${cfg.id}`);
  console.log();
  console.log("Verify in dashboard:");
  console.log(`  https://dashboard.stripe.com/settings/billing/portal/configurations/${cfg.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
