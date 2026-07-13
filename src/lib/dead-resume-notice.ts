import { prisma } from "@/lib/prisma";

const BASE_URL = "https://www.theblackfemaleengineer.com";

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function firstNameFor(raw: string | null): string {
  return capitalize((raw || "there").trim().split(/\s+/)[0]);
}

export interface DeadResumeDraft {
  userId: string;
  email: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Build the "your resume isn't loading; please re-upload" email payload.
 * Used by the admin "send nudge" button and by the daily-apply CRON when
 * it detects a dead resumeUrl pre-flight.
 *
 * Voice: Naya, first-person, no em-dashes, no banned phrases.
 */
export async function buildDeadResumeDraft(
  email: string,
): Promise<DeadResumeDraft> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true },
  });
  if (!user) throw new Error(`User not found: ${email}`);

  const firstName = firstNameFor(user.firstName);
  const profileUrl = `${BASE_URL}/profile`;
  const subject = `urgent: please re-upload your resume today`;

  const text = `Hi ${firstName},

Need a fast favor: please re-upload your resume in your profile today. The copy we have on our end isn't loading anymore (issue on our side, not yours), and until you re-upload, the system can't send out any new applications for you.

We've already patched the bug that caused this, so it won't happen again. But we still need a fresh upload from you to get applications running.

Once you re-upload, applications will resume automatically. Takes 30 seconds at ${profileUrl}.

Sorry for the friction. Reply here if anything's not working.

Naya
`;

  const html = `<!DOCTYPE html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827; line-height: 1.55;">
<p>Hi ${firstName},</p>
<p>Need a fast favor: please re-upload your resume in your profile today. The copy we have on our end isn't loading anymore (issue on our side, not yours), and until you re-upload, the system can't send out any new applications for you.</p>
<p>We've already patched the bug that caused this, so it won't happen again. But we still need a fresh upload from you to get applications running.</p>
<p>Once you re-upload, applications will resume automatically. Takes 30 seconds at <a href="${profileUrl}" style="color: #4d1b27; font-weight: 600;">${profileUrl}</a>.</p>
<p>Sorry for the friction. Reply here if anything's not working.</p>
<p>Naya</p>
</body></html>`;

  return {
    userId: user.id,
    email: user.email,
    subject,
    text,
    html,
  };
}
