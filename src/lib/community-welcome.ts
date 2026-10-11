const SKOOL_URL = "https://www.skool.com/disgustingly-paid/about";

function firstNameFrom(name: string | null | undefined): string {
  const raw = (name || "").trim().split(/\s+/)[0];
  if (!raw) return "there";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export interface CommunityWelcomeDraft {
  subject: string;
  text: string;
  html: string;
}

/**
 * "Your Disgustingly Paid membership went through" email, sent by the Stripe
 * webhook when the subscription checkout completes.
 *
 * Voice: Naya, first-person, no em-dashes. Leads with what happened, says
 * exactly what happens next, and leaves the door open.
 */
export function buildCommunityWelcomeDraft(name: string | null | undefined): CommunityWelcomeDraft {
  const firstName = firstNameFrom(name);
  const subject = "you're in Disgustingly Paid (your invite is coming)";

  const text = `Hi ${firstName},

Your Disgustingly Paid membership just went through: $49 for your first month, then $99 a month after that, billed through Stripe. Thank you for joining.

Here is what happens next. Your invite to the Skool community comes from me within the next 24 hours. Watch for an email from Skool with a Join button. Click it and you are in. You never pay anything on Skool itself. Your membership is handled entirely through Stripe.

Inside, you get the workflows I teach hands on, including the AI editing team we are building together at the workshop on October 24.

If you ever need to pause or cancel, reply to this email and I will take care of it the same day. No forms.

See you inside,
Naya

Community: ${SKOOL_URL}`;

  const html = `<p>Hi ${firstName},</p>
<p>Your Disgustingly Paid membership just went through: <strong>$49 for your first month, then $99 a month</strong> after that, billed through Stripe. Thank you for joining.</p>
<p>Here is what happens next. Your invite to the Skool community comes from me within the next 24 hours. Watch for an email from Skool with a <strong>Join</strong> button. Click it and you are in. You never pay anything on Skool itself. Your membership is handled entirely through Stripe.</p>
<p>Inside, you get the workflows I teach hands on, including the AI editing team we are building together at the workshop on October 24.</p>
<p>If you ever need to pause or cancel, reply to this email and I will take care of it the same day. No forms.</p>
<p>See you inside,<br/>Naya</p>
<p style="color:#888;font-size:12px">Community: <a href="${SKOOL_URL}">${SKOOL_URL}</a></p>`;

  return { subject, text, html };
}
