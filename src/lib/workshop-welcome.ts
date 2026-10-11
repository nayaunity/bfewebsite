const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" +
  encodeURIComponent("Build Your AI Video Editing Team (Live Workshop with Naya)") +
  "&dates=20261024T190000Z/20261024T220000Z" +
  "&details=" +
  encodeURIComponent(
    "Live build-along workshop. The join link arrives by email from Naya before the session. Bring a folder with 10 to 20 raw clips and a few voice memos.\n\nhttps://www.theblackfemaleengineer.com/ai-video-editor-workshop"
  );

function firstNameFrom(name: string | null | undefined): string {
  const raw = (name || "").trim().split(/\s+/)[0];
  if (!raw) return "there";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export interface WorkshopWelcomeDraft {
  subject: string;
  text: string;
  html: string;
}

/**
 * Sent by the Stripe webhook the moment a $147 workshop seat is paid for.
 * Delivers the plugin that is included with the ticket (Naya's AI Video
 * Editor Bot template for Grok Bot), the date, and the calendar link. The
 * join link is sent separately by Naya before the session.
 *
 * Voice: Naya, first-person, no em-dashes. Leads with what happened.
 */
export function buildWorkshopWelcomeDraft(
  name: string | null | undefined,
  pluginUrl: string
): WorkshopWelcomeDraft {
  const firstName = firstNameFrom(name);
  const subject = "you're in! your editing plugin is inside";

  const text = `Hi ${firstName},

You're in! Your seat for Build Your AI Video Editing Team is saved, and I am genuinely excited to build this with you. We go live Saturday, October 24 at 3:00 PM Eastern (12:00 PM Pacific, 8:00 PM UK).

Your plugin is included with your ticket, so here it is now: the exact setup behind my AI editing team. The Coordinator plus Voice, Scout, QA, and Cuts, with my editing rules and review steps already written.

${pluginUrl}

Open it in your Grok account tonight and start building. Bring whatever gets stuck to the live session; that is what the three hours are for.

On October 24 we customize it to your content and your style together, and you leave with a team that edits to your rules, minus the hours.

Add it to your calendar: ${CALENDAR_URL}

The join link comes from me by email before the session. Can't make it live? The full recording goes to your inbox within 24 hours after, so you won't miss a thing.

Questions? Just reply to this email. I read every one.

You may not feel it yet, but you just took a huge step toward a brand and a platform that will last, built on content you are proud of. I'm so glad you're here.

See you on the 24th,
Naya`;

  const html = `<p>Hi ${firstName},</p>
<p><strong>You're in!</strong> Your seat for <strong>Build Your AI Video Editing Team</strong> is saved, and I am genuinely excited to build this with you. We go live <strong>Saturday, October 24 at 3:00 PM Eastern</strong> (12:00 PM Pacific, 8:00 PM UK).</p>
<p>Your plugin is included with your ticket, so here it is now: <strong>the exact setup behind my AI editing team</strong>. The Coordinator plus Voice, Scout, QA, and Cuts, with my editing rules and review steps already written.</p>
<p><a href="${pluginUrl}" style="display:inline-block;background:#4d1b27;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Open the plugin</a></p>
<p>Open it in your Grok account tonight and start building. Bring whatever gets stuck to the live session; that is what the three hours are for.</p>
<p>On October 24 we customize it to your content and your style together, and you leave with a team that edits to your rules, minus the hours.</p>
<p><a href="${CALENDAR_URL}">Add it to your Google Calendar</a></p>
<p>The join link comes from me by email before the session. Can't make it live? The full recording goes to your inbox within 24 hours after, so you won't miss a thing.</p>
<p>Questions? Just reply to this email. I read every one.</p>
<p>You may not feel it yet, but you just took a huge step toward a brand and a platform that will last, built on content you are proud of. I'm so glad you're here.</p>
<p>See you on the 24th,<br/>Naya</p>`;

  return { subject, text, html };
}
