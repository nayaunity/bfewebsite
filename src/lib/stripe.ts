import "server-only";
import Stripe from "stripe";
export { TIER_LIMITS } from "./plan-limits";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder_for_build");

// Building a Tech Audience course lives in a separate Stripe account
// from the main BFE subscriptions. Uses its own secret key.
export const stripeCourse = new Stripe(
  process.env.STRIPE_COURSE_SECRET_KEY || "sk_placeholder_for_build"
);

export const STRIPE_PRICES = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
};

export const STRIPE_COURSE_PRICES = {
  selfGuided: process.env.STRIPE_BTA_SELF_GUIDED_PRICE_ID!,
  groupCoaching: process.env.STRIPE_BTA_GROUP_PRICE_ID!,
  privateCoaching: process.env.STRIPE_BTA_COACHING_PRICE_ID!,
};

// One-time live workshops. Sold through the main BFE Stripe account.
export const STRIPE_WORKSHOP_PRICES = {
  aiVideoEditor: process.env.STRIPE_AIVE_WORKSHOP_PRICE_ID!,
};

// Disgustingly Paid (Skool community) sold as a Stripe subscription.
// Skool never bills the member; access is granted via a free Skool invite.
export const STRIPE_COMMUNITY = {
  product: "disgustingly-paid",
  monthlyPriceId: process.env.STRIPE_DP_MONTHLY_PRICE_ID!,
  introCouponId: process.env.STRIPE_DP_INTRO_COUPON_ID!,
};

// AI Video Editing Plugin: Naya's configured Grok Bot editing team, sold on
// its own for $97 one time. The same bot template is included with the $147
// workshop and with Disgustingly Paid, and is delivered by email from the
// webhook using AIVE_WORKSHOP_BONUS_URL (the x.ai bot template link).
export const STRIPE_PLUGIN = {
  product: "ai-video-editor-plugin",
  priceId: process.env.STRIPE_AIVE_PLUGIN_PRICE_ID!,
};
