const SKOOL_URL = "https://www.skool.com/disgustingly-paid/about";

function firstNameFrom(name: string | null | undefined): string {
  const raw = (name || "").trim().split(/\s+/)[0];
  if (!raw) return "there";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function dollars(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

export interface CommunityWelcomeDraft {
  subject: string;
  text: string;
  html: string;
}

export interface CommunityWelcomeOptions {
  /** What Stripe charged today, in cents. $49 with the intro coupon, $99 without. */
  firstChargeCents?: number | null;
  /** The AI Video Editing Plugin link (included with membership). */
  pluginUrl?: string | null;
}

/**
 * "Your Disgustingly Paid membership went through" email, sent by the Stripe
 * webhook when the subscription checkout completes.
 *
 * Voice: Naya, first-person, no em-dashes. Leads with what happened, says
 * exactly what happens next, and leaves the door open.
 */
export function buildCommunityWelcomeDraft(
  name: string | null | undefined,
  options: CommunityWelcomeOptions = {}
): CommunityWelcomeDraft {
  const firstName = firstNameFrom(name);
  const first = options.firstChargeCents ?? 9900;
  const billing =
    first === 9900
      ? "$99 a month, billed through Stripe"
      : `${dollars(first)} for your first month, then $99 a month after that, billed through Stripe`;
  const subject = "you're in Disgustingly Paid (your invite is coming)";

  const pluginText = options.pluginUrl
    ? `

Your AI Video Editing Plugin is included with membership. Open it in your Grok account:
${options.pluginUrl}`
    : "";
  const pluginHtml = options.pluginUrl
    ? `<p>Your <strong>AI Video Editing Plugin</strong> is included with membership. <a href="${options.pluginUrl}">Open it in your Grok account</a>.</p>`
    : "";

  const text = `Hi ${firstName},

Your Disgustingly Paid membership just went through: ${billing}. Thank you for joining.

Here is what happens next. Your invite to the Skool community comes from me within the next 24 hours. Watch for an email from Skool with a Join button. Click it and you are in. You never pay anything on Skool itself. Your membership is handled entirely through Stripe.${pluginText}

Inside, you get the workflows I teach hands on, my sound-effects folder, and the new builds I add each week.

If you ever need to pause or cancel, reply to this email and I will take care of it the same day. No forms.

See you inside,
Naya

Community: ${SKOOL_URL}`;

  const html = `<p>Hi ${firstName},</p>
<p>Your Disgustingly Paid membership just went through: <strong>${billing}</strong>. Thank you for joining.</p>
<p>Here is what happens next. Your invite to the Skool community comes from me within the next 24 hours. Watch for an email from Skool with a <strong>Join</strong> button. Click it and you are in. You never pay anything on Skool itself. Your membership is handled entirely through Stripe.</p>
${pluginHtml}
<p>Inside, you get the workflows I teach hands on, my sound-effects folder, and the new builds I add each week.</p>
<p>If you ever need to pause or cancel, reply to this email and I will take care of it the same day. No forms.</p>
<p>See you inside,<br/>Naya</p>
<p style="color:#888;font-size:12px">Community: <a href="${SKOOL_URL}">${SKOOL_URL}</a></p>`;

  return { subject, text, html };
}
