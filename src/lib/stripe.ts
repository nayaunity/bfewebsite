import "server-only";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder_for_build");

export const STRIPE_PRICES = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
};

export const TIER_LIMITS: Record<
  string,
  { appsPerMonth: number; maxResumes: number; tailoredPerMonth: number }
> = {
  free: { appsPerMonth: 5, maxResumes: 3, tailoredPerMonth: 1 },
  starter: { appsPerMonth: 100, maxResumes: 5, tailoredPerMonth: 9999 },
  pro: { appsPerMonth: 300, maxResumes: 10, tailoredPerMonth: 9999 },
};
