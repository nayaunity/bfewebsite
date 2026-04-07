import "server-only";
import { prisma } from "./prisma";
import { TIER_LIMITS } from "./stripe";

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
}> {
  const user = await getUserTier(userId);
  if (!user)
    return { allowed: false, remaining: 0, tier: "free", used: 0, limit: 0 };

  const tier = user.subscriptionTier || "free";
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const used = user.monthlyAppCount;
  const remaining = Math.max(0, limits.appsPerMonth - used);

  return {
    allowed: remaining > 0,
    remaining,
    tier,
    used,
    limit: limits.appsPerMonth,
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
