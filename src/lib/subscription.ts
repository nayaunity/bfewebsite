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

  const isActive = subscription.status === "active";

  const updateData: Record<string, unknown> = {
    subscriptionTier: tier,
    subscriptionStatus: isActive ? "active" : subscription.status,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000)
      : null,
  };

  if (isActive) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscribedAt: true },
    });
    if (!existing?.subscribedAt) {
      updateData.subscribedAt = new Date();
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
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
 * Start of the user's current monthly period. Anchors on the subscription
 * anniversary (subscribedAt) for paid users and on signup (createdAt) for
 * free users. Pure — no DB. Mirrored in worker/src/period.ts.
 */
export function getCurrentPeriodStart(user: {
  subscribedAt: Date | null;
  createdAt: Date;
}): Date {
  const anchor = user.subscribedAt ?? user.createdAt;
  const now = new Date();
  const anchorDay = anchor.getUTCDate();
  const h = anchor.getUTCHours();
  const m = anchor.getUTCMinutes();
  const s = anchor.getUTCSeconds();

  const buildAt = (year: number, month: number): Date => {
    // month may be -1 (Dec of previous year) — normalize.
    let y = year;
    let mo = month;
    if (mo < 0) {
      mo += 12;
      y -= 1;
    }
    const daysInMonth = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    const day = Math.min(anchorDay, daysInMonth);
    return new Date(Date.UTC(y, mo, day, h, m, s, 0));
  };

  let candidate = buildAt(now.getUTCFullYear(), now.getUTCMonth());
  if (candidate > now) {
    candidate = buildAt(now.getUTCFullYear(), now.getUTCMonth() - 1);
  }
  return candidate;
}

/**
 * Get user's subscription tier, resetting the monthly counter if the user
 * has crossed their subscription/signup anniversary since the last reset.
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
      subscribedAt: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  const periodStart = getCurrentPeriodStart(user);
  const resetAt = new Date(user.monthlyAppResetAt);

  if (resetAt < periodStart) {
    // Recompute counter from BrowseSession history rather than zeroing
    // blindly — keeps the worker's increments and the lazy reset in agreement
    // if they race across the boundary. Uses datetime() so the comparison
    // works across both storage formats (worker writes 'YYYY-MM-DD HH:MM:SS'
    // via raw SQL, Prisma writes ISO 'YYYY-MM-DDTHH:MM:SS.sssZ').
    const rows = await prisma.$queryRaw<{ s: number | bigint | null }[]>`
      SELECT COALESCE(SUM(jobsApplied), 0) AS s
      FROM BrowseSession
      WHERE userId = ${userId}
        AND startedAt IS NOT NULL
        AND datetime(startedAt) >= datetime(${periodStart.toISOString()})
    `;
    const recomputed = Number(rows[0]?.s ?? 0);

    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyAppCount: recomputed,
        monthlyTailorCount: 0,
        monthlyAppResetAt: periodStart,
      },
    });
    return { ...user, monthlyAppCount: recomputed, monthlyTailorCount: 0 };
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
  reason?: "trial-required" | "monthly-cap" | "payment-failed";
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

  // Payment-failed wall: once Stripe marks the subscription past_due or
  // unpaid (card decline at trial-end billing, or later failed renewal),
  // stop consuming paid resources until the invoice clears.
  if (
    user.subscriptionStatus === "past_due" ||
    user.subscriptionStatus === "unpaid"
  ) {
    return {
      allowed: false,
      remaining: 0,
      tier,
      used,
      limit: effectiveLimit,
      reason: "payment-failed",
    };
  }

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
 * Convert a denied canApply() result into user-facing error copy.
 * Centralised so the start, browse, and one-shot apply routes never drift
 * from each other (the original /start route was reporting "Monthly limit
 * reached" even when the real reason was a card decline).
 */
export function usageErrorMessage(usage: {
  used: number;
  limit: number;
  reason?: "trial-required" | "monthly-cap" | "payment-failed";
}): string {
  switch (usage.reason) {
    case "payment-failed":
      return "Auto-apply is paused. We couldn't process your last payment. Update your card in account settings and applications will resume automatically.";
    case "trial-required":
      return "Your free tier has ended. Start your 7-day trial to keep applying.";
    default:
      return `Monthly limit reached (${usage.used}/${usage.limit}). Upgrade for more.`;
  }
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
