import { prisma } from "@/lib/prisma";

const BASE_URL = "https://www.theblackfemaleengineer.com";

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function firstNameFor(raw: string | null): string {
  return capitalize((raw || "there").trim().split(/\s+/)[0]);
}

function daysUntil(d: Date, now = new Date()): number {
  return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
}

export interface SunsetDraft {
  userId: string;
  email: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Build the sunset warning email for a single user. Pure-data, no side
 * effects, so the cron can preview the draft before sending and tests can
 * exercise the template directly.
 */
export async function buildSunsetDraft(email: string): Promise<SunsetDraft> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, freeTierEndsAt: true },
  });
  if (!user) throw new Error(`User not found: ${email}`);
  if (!user.freeTierEndsAt) throw new Error(`No freeTierEndsAt for ${email}`);

  const firstName = firstNameFor(user.firstName);
  const days = daysUntil(user.freeTierEndsAt);

  const totalActiveJobs = await prisma.job.count({
    where: { source: "auto-apply", isActive: true, region: { in: ["us", "both"] } },
  });

  // Round down to nearest thousand for cleaner copy ("5,000+" not "5,231")
  const rounded = Math.floor(totalActiveJobs / 1000) * 1000;
  const inventoryPhrase = rounded >= 1000
    ? `your queue has ${rounded.toLocaleString()}+ active tech roles ready right now`
    : `your queue has thousands of active tech roles ready right now`;

  const checkoutUrl = `${BASE_URL}/profile/applications?startTrial=1`;

  const subject = `${firstName}, your free month ends in ${days} day${days === 1 ? "" : "s"}`;

  const text = `Hey ${firstName},

Your free month ends in ${days} day${days === 1 ? "" : "s"}. Most job searches take 100+ applications, and ${inventoryPhrase}. The 7-day free trial keeps your auto-apply running so you don't lose ground. $0 today, $29/mo after the trial. Cancel anytime.

Start your 7-day trial: ${checkoutUrl}

Talk soon,
Naya
`;

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 560px;">
  <p>Hey ${firstName},</p>
  <p>Your free month ends in <strong>${days} day${days === 1 ? "" : "s"}</strong>. Most job searches take 100+ applications, and ${inventoryPhrase}. The 7-day free trial keeps your auto-apply running so you don't lose ground. $0 today, $29/mo after the trial. Cancel anytime.</p>
  <p style="margin: 20px 0;">
    <a href="${checkoutUrl}" style="display: inline-block; background: #ef562a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Start your 7-day free trial</a>
  </p>
  <p style="margin-top: 24px;">Talk soon,<br/>Naya</p>
</div>`;

  if (!user.email) throw new Error(`User has no email: ${user.id}`);

  return {
    userId: user.id,
    email: user.email,
    subject,
    text,
    html,
  };
}

/**
 * Find users whose free tier ends within the next ~3 days and who have not
 * yet received the sunset warning. Excludes admins, contributors, and the
 * integration test user.
 */
export async function findSunsetCandidates(): Promise<
  { userId: string; email: string; freeTierEndsAt: Date }[]
> {
  const now = new Date();
  const horizon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      subscriptionTier: "free",
      role: { notIn: ["admin", "contributor", "test"] },
      emailVerified: { not: null },
      freeTierSunsetEmailAt: null,
      freeTierEndsAt: { gte: now, lte: horizon },
    },
    select: { id: true, email: true, freeTierEndsAt: true },
  });

  return users
    .filter((u) => u.email && u.freeTierEndsAt)
    .map((u) => ({
      userId: u.id,
      email: u.email!,
      freeTierEndsAt: u.freeTierEndsAt!,
    }));
}
