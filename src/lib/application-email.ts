import { prisma } from "@/lib/prisma";

const APPLICATION_EMAIL_DOMAIN = "apply.theblackfemaleengineer.com";

/**
 * Ensure a user has a dedicated application email.
 * Generated lazily on first auto-apply use.
 * Format: u-{first 8 chars of userId}@apply.theblackfemaleengineer.com
 */
export async function ensureApplicationEmail(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { applicationEmail: true },
  });

  if (user?.applicationEmail) return user.applicationEmail;

  const shortId = userId.slice(0, 8);
  const appEmail = `u-${shortId}@${APPLICATION_EMAIL_DOMAIN}`;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { applicationEmail: appEmail },
    });
    return appEmail;
  } catch {
    // Collision on unique constraint — use longer prefix
    const longId = userId.slice(0, 12);
    const fallbackEmail = `u-${longId}@${APPLICATION_EMAIL_DOMAIN}`;
    await prisma.user.update({
      where: { id: userId },
      data: { applicationEmail: fallbackEmail },
    });
    return fallbackEmail;
  }
}

/**
 * Extract email address from "Name <email>" format.
 */
export function extractEmail(raw: string): string | null {
  const match = raw.match(/<([^>]+)>/);
  if (match) return match[1];
  if (raw.includes("@")) return raw.trim();
  return null;
}

/**
 * Extract display name from "Name <email>" format.
 */
export function extractName(raw: string): string | null {
  const match = raw.match(/^([^<]+)</);
  if (match) return match[1].trim();
  return null;
}

/**
 * Check if an email is a Greenhouse verification code email.
 */
export function isGreenhouseVerification(subject: string, text: string): boolean {
  const combined = `${subject} ${text}`.toLowerCase();
  return (
    combined.includes("verification code") ||
    combined.includes("verify your email") ||
    combined.includes("security code") ||
    combined.includes("confirm you're a human")
  );
}
