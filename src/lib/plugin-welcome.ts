const PAGE_URL = "https://www.theblackfemaleengineer.com/ai-video-editor-workshop";

function firstNameFrom(name: string | null | undefined): string {
  const raw = (name || "").trim().split(/\s+/)[0];
  if (!raw) return "there";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export interface PluginWelcomeDraft {
  subject: string;
  text: string;
  html: string;
}

/**
 * Sent by the Stripe webhook the moment a $97 plugin purchase is paid.
 * Delivers the plugin (Naya's AI Video Editor Bot template for Grok Bot) and
 * the self-service setup steps. No workshop, no personal setup.
 *
 * Voice: Naya, first-person, no em-dashes. Leads with what happened.
 */
export function buildPluginWelcomeDraft(
  name: string | null | undefined,
  pluginUrl: string
): PluginWelcomeDraft {
  const firstName = firstNameFrom(name);
  const subject = "your AI editing plugin is inside";

  const text = `Hi ${firstName},

Your payment went through and your AI Video Editing Plugin is ready. This is the exact setup behind my AI editing team: the Coordinator plus Voice, Scout, QA, and Cuts, with my editing rules and review steps already written.

Open it here:
${pluginUrl}

How to set it up:

1. Open the link in the Grok account you want to edit from. The plugin runs in Grok Bot, so you need a Grok account. Any xAI subscription or usage charges are billed by xAI and are separate from this purchase.
2. Give the coordinator a folder with 10 to 20 raw clips and a few voice memos, one line per memo.
3. Tell it your rules in plain English (angles, light, captions, what never makes the cut), or keep mine and change them as you go.
4. Approve the storyboard and the mockup, then send notes by clip number on the version it hands back.

Keep this email. The link is your access to the plugin.

If you want to set it up with me live, the workshop on Saturday, October 24 at 3:00 PM Eastern includes this same plugin: ${PAGE_URL}#workshop

Questions? Reply to this email. I read every one.

Naya`;

  const html = `<p>Hi ${firstName},</p>
<p>Your payment went through and your <strong>AI Video Editing Plugin</strong> is ready. This is the exact setup behind my AI editing team: the Coordinator plus Voice, Scout, QA, and Cuts, with my editing rules and review steps already written.</p>
<p><a href="${pluginUrl}" style="display:inline-block;background:#4d1b27;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Open the plugin</a></p>
<p><strong>How to set it up:</strong></p>
<ol>
<li>Open the link in the Grok account you want to edit from. The plugin runs in Grok Bot, so you need a Grok account. Any xAI subscription or usage charges are billed by xAI and are separate from this purchase.</li>
<li>Give the coordinator a folder with 10 to 20 raw clips and a few voice memos, one line per memo.</li>
<li>Tell it your rules in plain English (angles, light, captions, what never makes the cut), or keep mine and change them as you go.</li>
<li>Approve the storyboard and the mockup, then send notes by clip number on the version it hands back.</li>
</ol>
<p>Keep this email. The link is your access to the plugin.</p>
<p>If you want to set it up with me live, the <a href="${PAGE_URL}#workshop">workshop on Saturday, October 24 at 3:00 PM Eastern</a> includes this same plugin.</p>
<p>Questions? Reply to this email. I read every one.</p>
<p>Naya</p>`;

  return { subject, text, html };
}
