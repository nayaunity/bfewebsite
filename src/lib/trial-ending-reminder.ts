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

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export interface TrialEndingDraft {
  userId: string;
  email: string;
  subject: string;
  text: string;
  html: string;
}

export async function buildTrialEndingDraft(
  email: string
): Promise<TrialEndingDraft> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      currentPeriodEnd: true,
      subscriptionTier: true,
    },
  });
  if (!user) throw new Error(`User not found: ${email}`);
  if (!user.currentPeriodEnd)
    throw new Error(`No currentPeriodEnd for ${email}`);

  const firstName = firstNameFor(user.firstName);
  const days = daysUntil(user.currentPeriodEnd);
  const endDate = formatDate(user.currentPeriodEnd);
  const profileUrl = `${BASE_URL}/profile`;

  const subject = `${firstName}, your free trial ends in ${days} day${days === 1 ? "" : "s"}`;

  const text = `Hey ${firstName},

Your 7-day free trial ends in ${days} day${days === 1 ? "" : "s"}, on ${endDate}. After that, you'll be charged $29/mo for the Starter plan.

If you'd like to cancel, you can do so anytime from your profile page. No questions asked.

Manage your subscription: ${profileUrl}

Talk soon,
Naya
`;

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 560px;">
  <p>Hey ${firstName},</p>
  <p>Your 7-day free trial ends in <strong>${days} day${days === 1 ? "" : "s"}</strong>, on <strong>${endDate}</strong>. After that, you'll be charged $29/mo for the Starter plan.</p>
  <p>If you'd like to cancel, you can do so anytime from your profile page. No questions asked.</p>
  <p style="margin: 20px 0;">
    <a href="${profileUrl}" style="display: inline-block; background: #ef562a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Manage your subscription</a>
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

export async function findTrialEndingCandidates(): Promise<
  { userId: string; email: string; currentPeriodEnd: Date }[]
> {
  const now = new Date();
  const horizon = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      subscriptionStatus: "trialing",
      subscriptionTier: { in: ["starter", "pro"] },
      role: { notIn: ["admin", "contributor", "test"] },
      emailVerified: { not: null },
      trialEndReminderSentAt: null,
      currentPeriodEnd: { gte: now, lte: horizon },
    },
    select: { id: true, email: true, currentPeriodEnd: true },
  });

  return users
    .filter((u) => u.email && u.currentPeriodEnd)
    .map((u) => ({
      userId: u.id,
      email: u.email!,
      currentPeriodEnd: u.currentPeriodEnd!,
    }));
}
