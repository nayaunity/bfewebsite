import { getCurrentPeriodStart } from "./subscription";
import { TIER_LIMITS } from "./stripe";

const DAILY_CAP = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const GRACE_DAYS = 5;

export type PacingStatus = "on_track" | "behind" | "at_risk" | "critical";

export interface PacingInput {
  subscribedAt: Date | null;
  createdAt: Date;
  currentPeriodEnd: Date | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  monthlyAppCount: number;
}

export interface PacingResult {
  status: PacingStatus;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  appsSent: number;
  effectiveCap: number;
  expectedByNow: number;
  projectedTotal: number;
  maxPossible: number;
  pacePercent: number;
  irrecoverable: boolean;
}

function getPeriodEnd(periodStart: Date, currentPeriodEnd: Date | null): Date {
  if (currentPeriodEnd && currentPeriodEnd > periodStart) return currentPeriodEnd;
  const end = new Date(periodStart);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return end;
}

export function calculatePacing(input: PacingInput, now?: Date): PacingResult {
  const clock = now ?? new Date();
  const periodStart = getCurrentPeriodStart(input);
  const periodEnd = getPeriodEnd(periodStart, input.currentPeriodEnd);

  const isTrialing = input.subscriptionStatus === "trialing";
  const tierLimits = TIER_LIMITS[input.subscriptionTier] ?? TIER_LIMITS.free;
  const effectiveCap = isTrialing ? 5 : tierLimits.appsPerMonth;

  const daysElapsed = Math.max(1, Math.floor((clock.getTime() - periodStart.getTime()) / MS_PER_DAY));
  const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - clock.getTime()) / MS_PER_DAY));
  const totalDays = daysElapsed + daysRemaining;

  const appsSent = input.monthlyAppCount;
  const expectedByNow = totalDays > 0 ? effectiveCap * (daysElapsed / totalDays) : effectiveCap;
  const projectedTotal = daysElapsed > 0 ? Math.round((appsSent / daysElapsed) * totalDays) : appsSent;
  const maxPossible = appsSent + daysRemaining * DAILY_CAP;
  const pacePercent = expectedByNow > 0 ? Math.round((appsSent / expectedByNow) * 100) : (appsSent >= effectiveCap ? 100 : 0);
  const irrecoverable = maxPossible < effectiveCap;

  if (isTrialing) {
    return {
      status: "on_track",
      daysElapsed, daysRemaining, totalDays,
      appsSent, effectiveCap, expectedByNow: Math.round(expectedByNow),
      projectedTotal, maxPossible, pacePercent, irrecoverable,
    };
  }

  let status: PacingStatus;
  if (irrecoverable) {
    status = "critical";
  } else if (pacePercent < 40) {
    status = "at_risk";
  } else if (pacePercent < 70) {
    status = "behind";
  } else {
    status = "on_track";
  }

  if (daysElapsed <= GRACE_DAYS && (status === "at_risk" || status === "critical")) {
    status = "behind";
  }

  return {
    status,
    daysElapsed, daysRemaining, totalDays,
    appsSent, effectiveCap, expectedByNow: Math.round(expectedByNow),
    projectedTotal, maxPossible, pacePercent, irrecoverable,
  };
}
