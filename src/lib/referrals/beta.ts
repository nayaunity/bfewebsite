import { prisma } from "@/lib/prisma";

const DEFAULT_PRODUCTION_REFERRAL_BETA_EMAILS = [
  "theblackfemaleengineer@gmail.com",
];

function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized ? normalized : null;
}

export function getReferralAssistAllowedEmails(): string[] {
  const configured = (process.env.REFERRAL_ASSIST_BETA_EMAILS || "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter((email): email is string => !!email);

  return [
    ...new Set([
      ...DEFAULT_PRODUCTION_REFERRAL_BETA_EMAILS,
      ...configured,
    ]),
  ];
}

export function isReferralAssistEnabledForEmail(
  email: string | null | undefined
): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return true;
}

export async function isReferralAssistEnabledForUserId(
  userId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  return isReferralAssistEnabledForEmail(user?.email);
}
