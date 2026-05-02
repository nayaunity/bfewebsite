// Mirror of getCurrentPeriodStart in src/lib/subscription.ts. Keep in sync.
// Pure — no DB. Anchors on subscribedAt for paid users, createdAt for free.
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

import { getDb } from "./db";

/**
 * Read the user's quota-relevant fields and lazily reset the monthly counter
 * if they've crossed their period anniversary since monthlyAppResetAt. Returns
 * the post-reset (or unchanged) monthlyAppCount along with status fields the
 * worker needs for cap/payment-failed/trial enforcement.
 */
export async function readQuotaWithLazyReset(userId: string): Promise<{
  monthlyAppCount: number;
  subscriptionTier: string;
  subscriptionStatus: string;
  freeTierEndsAt: string | null;
} | undefined> {
  const db = getDb();
  const r = await db.execute({
    sql: `SELECT monthlyAppCount, monthlyAppResetAt, subscribedAt, createdAt,
                 subscriptionTier, subscriptionStatus, freeTierEndsAt
          FROM User WHERE id = ?`,
    args: [userId],
  });
  const row = r.rows?.[0] as unknown as
    | {
        monthlyAppCount: number;
        monthlyAppResetAt: string;
        subscribedAt: string | null;
        createdAt: string;
        subscriptionTier: string;
        subscriptionStatus: string;
        freeTierEndsAt: string | null;
      }
    | undefined;
  if (!row) return undefined;

  const periodStart = getCurrentPeriodStart({
    subscribedAt: row.subscribedAt ? new Date(row.subscribedAt) : null,
    createdAt: new Date(row.createdAt),
  });

  let monthlyAppCount = row.monthlyAppCount;
  if (new Date(row.monthlyAppResetAt) < periodStart) {
    // datetime() normalizes both storage formats (raw-SQL writes use
    // 'YYYY-MM-DD HH:MM:SS', Prisma writes 'YYYY-MM-DDTHH:MM:SS.sssZ').
    const sumRes = await db.execute({
      sql: `SELECT COALESCE(SUM(jobsApplied), 0) AS s
            FROM BrowseSession
            WHERE userId = ?
              AND startedAt IS NOT NULL
              AND datetime(startedAt) >= datetime(?)`,
      args: [userId, periodStart.toISOString()],
    });
    monthlyAppCount = Number(
      (sumRes.rows?.[0] as unknown as { s: number | string })?.s ?? 0
    );
    await db.execute({
      sql: `UPDATE User
            SET monthlyAppCount = ?, monthlyTailorCount = 0, monthlyAppResetAt = ?
            WHERE id = ?`,
      args: [monthlyAppCount, periodStart.toISOString(), userId],
    });
  }

  return {
    monthlyAppCount,
    subscriptionTier: row.subscriptionTier,
    subscriptionStatus: row.subscriptionStatus,
    freeTierEndsAt: row.freeTierEndsAt,
  };
}
