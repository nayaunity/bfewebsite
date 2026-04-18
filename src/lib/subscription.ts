import "server-only";
import type Stripe from "stripe";
import { prisma } from "./prisma";
import { TIER_LIMITS } from "./stripe";

/**
 * Apply subscription state from a Stripe subscription to a user row.
 * Idempotent — safe to call from the webhook and from fallback sync paths.
 *
 * Used by: webhook handler, /api/stripe/sync, /api/stripe/sync-by-session,
 * /api/admin/stripe/reconcile.
 */
export async function activateSubscription(params: {
  userId: string;
  subscription: Stripe.Subscription;
  tier: "starter" | "pro";
}): Promise<void> {
  const { userId, subscription, tier } = params;
  // Newer Stripe API versions expose current_period_end on the subscription
  // item rather than the root. Read both for forward compatibility.
  const rootPeriodEnd = (
    subscription as unknown as { current_period_end?: number }
  ).current_period_end;
  const itemPeriodEnd = (
    subscription.items.data[0] as unknown as { current_period_end?: number }
  )?.current_period_end;
  const currentPeriodEnd = rootPeriodEnd ?? itemPeriodEnd;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier,
      subscriptionStatus:
        subscription.status === "active" ? "active" : subscription.status,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000)
        : null,
    },
  });
}

/**
 * Resolve the tier string from a Stripe price ID.
 * Returns null if the price doesn't map to a known paid tier.
 */
export function tierFromPriceId(priceId: string | undefined): "starter" | "pro" | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return "starter";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  return null;
}

/**
 * Get user's subscription tier, resetting the monthly counter if needed.
 */
export async function getUserTier(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      monthlyAppCount: true,
      monthlyTailorCount: true,
      monthlyAppResetAt: true,
      currentPeriodEnd: true,
      freeTierEndsAt: true,
    },
  });

  if (!user) return null;

  // Check if monthly counter needs resetting (new month)
  const now = new Date();
  const resetAt = new Date(user.monthlyAppResetAt);
  if (
    now.getMonth() !== resetAt.getMonth() ||
    now.getFullYear() !== resetAt.getFullYear()
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: { monthlyAppCount: 0, monthlyTailorCount: 0, monthlyAppResetAt: now },
    });
    return { ...user, monthlyAppCount: 0 };
  }

  return user;
}

/**
 * Check if a user can apply to more jobs this month.
 */
export async function canApply(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  tier: string;
  used: number;
  limit: number;
  reason?: "trial-required" | "monthly-cap";
}> {
  const user = await getUserTier(userId);
  if (!user)
    return { allowed: false, remaining: 0, tier: "free", used: 0, limit: 0 };

  const tier = user.subscriptionTier || "free";
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const used = user.monthlyAppCount;

  // Trial guardrail: during the 7-day Stripe trial we cap at 5 total apps
  // (matches legacy free tier) so users do not burn through Starter inventory
  // before paying. After the trial converts (status = "active"), the full
  // TIER_LIMITS.starter unlocks.
  const isTrialing = user.subscriptionStatus === "trialing";
  const effectiveLimit = isTrialing ? 5 : limits.appsPerMonth;
  const remaining = Math.max(0, effectiveLimit - used);

  // Free-tier sunset wall: once freeTierEndsAt has passed, the user must
  // start the 7-day Stripe trial (or subscribe directly) to keep applying.
  // Takes precedence over the monthly cap.
  if (
    tier === "free" &&
    user.freeTierEndsAt &&
    user.freeTierEndsAt <= new Date()
  ) {
    return {
      allowed: false,
      remaining: 0,
      tier,
      used,
      limit: effectiveLimit,
      reason: "trial-required",
    };
  }

  return {
    allowed: remaining > 0,
    remaining,
    tier,
    used,
    limit: effectiveLimit,
    ...(remaining === 0 ? { reason: "monthly-cap" as const } : {}),
  };
}

/**
 * Increment the user's monthly application count.
 */
export async function incrementAppCount(
  userId: string,
  count: number = 1
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { monthlyAppCount: { increment: count } },
  });
}

/**
 * Get the number of resumes a user is allowed to have.
 */
export function getMaxResumes(tier: string): number {
  return (TIER_LIMITS[tier] || TIER_LIMITS.free).maxResumes;
}

/**
 * Check if a user can tailor resumes this month.
 */
export async function canTailorResume(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  tier: string;
  used: number;
  limit: number;
}> {
  const user = await getUserTier(userId);
  if (!user)
    return { allowed: false, remaining: 0, tier: "free", used: 0, limit: 0 };

  const tier = user.subscriptionTier || "free";
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const used = user.monthlyTailorCount;
  const remaining = Math.max(0, limits.tailoredPerMonth - used);

  return {
    allowed: remaining > 0,
    remaining,
    tier,
    used,
    limit: limits.tailoredPerMonth,
  };
}
