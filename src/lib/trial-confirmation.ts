import { prisma } from "@/lib/prisma";

const BASE_URL = "https://www.theblackfemaleengineer.com";

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function firstNameFor(raw: string | null): string {
  return capitalize((raw || "there").trim().split(/\s+/)[0]);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export interface TrialConfirmationDraft {
  userId: string;
  email: string;
  subject: string;
  text: string;
  html: string;
}

export async function buildTrialConfirmationDraft(
  userId: string
): Promise<TrialConfirmationDraft> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      currentPeriodEnd: true,
      subscriptionTier: true,
    },
  });
  if (!user || !user.email) throw new Error(`User not found: ${userId}`);

  const firstName = firstNameFor(user.firstName);
  const trialEndDate = user.currentPeriodEnd
    ? formatDate(user.currentPeriodEnd)
    : "7 days from now";

  const profileUrl = `${BASE_URL}/profile`;

  const subject = `${firstName}, your 7-day free trial is live`;

  const text = `Hey ${firstName},

Welcome to the Starter plan! Your 7-day free trial is now active.

Your trial ends on ${trialEndDate}. After that, you'll be charged $29/mo. You can cancel anytime from your profile page.

Manage your subscription: ${profileUrl}

Talk soon,
Naya
`;

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 560px;">
  <p>Hey ${firstName},</p>
  <p>Welcome to the Starter plan! Your 7-day free trial is now active.</p>
  <p>Your trial ends on <strong>${trialEndDate}</strong>. After that, you'll be charged $29/mo. You can cancel anytime from your profile page.</p>
  <p style="margin: 20px 0;">
    <a href="${profileUrl}" style="display: inline-block; background: #4d1b27; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to your dashboard</a>
  </p>
  <p style="margin-top: 24px;">Talk soon,<br/>Naya</p>
</div>`;

  return {
    userId: user.id,
    email: user.email,
    subject,
    text,
    html,
  };
}
