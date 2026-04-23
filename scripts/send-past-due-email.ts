/**
 * Past-due payment notification emails for users whose first Stripe charge
 * failed at trial-end (card declined, insufficient_funds). Links them to the
 * Stripe-hosted invoice page so they can update their card in one click.
 *
 * Phase 1: test-send both personalized drafts to theblackfemaleengineer@gmail.com
 *   npx tsx scripts/send-past-due-email.ts --test
 * Phase 2: after approval, send to real recipients
 *   npx tsx scripts/send-past-due-email.ts --send
 *
 * Notes:
 * - Hosted invoice URLs are hardcoded from the Stripe API at the time of
 *   authoring (Apr 22, 2026). These URLs are stable for the life of the
 *   invoice and remain valid until the invoice is paid or voided.
 * - No em dashes in copy (product-wide rule).
 * - Reply-To set to theblackfemaleengineer@gmail.com (standard).
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { Resend } from "resend";

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: "number",
});
const prisma = new PrismaClient({ adapter });

type Target = {
  email: string;
  invoiceUrl: string;
  retryDateLabel: string;
  /** "natural" = 7-day trial ended, "early" = user clicked Upgrade Now */
  trialEndKind: "natural" | "early";
};

const TARGETS: Target[] = [
  {
    email: "sheerielacy97@gmail.com",
    invoiceUrl:
      "https://invoice.stripe.com/i/acct_1KNrubAbS888QtQN/live_YWNjdF8xS05ydWJBYlM4ODhRdFFOLF9VTnJpd1g2Y2VMTktoU0ZDVnkxZVJXdUs2amtFYVNwLDE2NzQ0NTUyMQ0200Cuxqh1Ma?s=ap",
    retryDateLabel: "April 30",
    trialEndKind: "natural",
  },
  {
    email: "malikjdurant@gmail.com",
    invoiceUrl:
      "https://invoice.stripe.com/i/acct_1KNrubAbS888QtQN/live_YWNjdF8xS05ydWJBYlM4ODhRdFFOLF9VTnRmU0xGTkd3OGNNYzQ4N0dGa3ltb3Y5d2V2ZVhvLDE2NzQ0NTUyMQ0200VEqCcYkJ?s=ap",
    retryDateLabel: "April 26",
    trialEndKind: "early",
  },
];

const TEST_TO = "theblackfemaleengineer@gmail.com";

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function buildDraft(t: Target) {
  const user = await prisma.user.findUnique({
    where: { email: t.email },
    select: { firstName: true },
  });
  if (!user) throw new Error(`User not found: ${t.email}`);
  const rawFirst = (user.firstName || "there").trim().split(/\s+/)[0];
  const firstName = capitalize(rawFirst);

  const subject = "Quick heads up about your BFE Starter payment";

  const openingLine =
    t.trialEndKind === "early"
      ? `Thanks for upgrading earlier today. When we ran the first $29 Starter charge, your card came back as declined, so the subscription is in a pending state.`
      : `Your 7-day trial wrapped up today and we tried to run the first $29 Starter charge, but your card came back as declined. Nothing is lost.`;

  const text = `Hi ${firstName},

${openingLine} I paused new applications on your account so nothing runs until your billing is back in good standing.

To reactivate your Starter plan, update your card here:
${t.invoiceUrl}

Stripe will also retry your current card on ${t.retryDateLabel}. If you'd rather let that run, no action needed. If something's wrong, just reply to this email.

Talk soon,
Naya
theblackfemaleengineer.com`;

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 560px;">
  <p style="font-size: 20px; font-weight: 700; margin: 0 0 18px;">the<span style="color: #ef562a;">BFE</span></p>
  <p style="margin: 0 0 12px;">Hi ${firstName},</p>
  <p style="margin: 0 0 14px;">${openingLine} I paused new applications on your account so nothing runs until your billing is back in good standing.</p>
  <p style="text-align: center; margin: 18px 0 20px;"><a href="${t.invoiceUrl}" style="display: inline-block; background: #ef562a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Update payment method</a></p>
  <p style="margin: 0 0 14px;">Stripe will also retry your current card on <strong>${t.retryDateLabel}</strong>. If you'd rather let that run, no action needed. If something's wrong, just reply to this email.</p>
  <p style="margin: 0 0 4px;">Talk soon,</p>
  <p style="margin: 0;">Naya</p>
  <p style="margin: 4px 0 0; color: #666; font-size: 13px;">theblackfemaleengineer.com</p>
</div>`;

  return { email: t.email, subject, text, html };
}

async function main() {
  const mode = process.argv[2];
  if (mode !== "--test" && mode !== "--send") {
    console.error("Usage: npx tsx scripts/send-past-due-email.ts [--test | --send]");
    process.exit(1);
  }

  const drafts = [];
  for (const t of TARGETS) drafts.push(await buildDraft(t));

  const resend = new Resend(process.env.RESEND_API_KEY);

  for (const d of drafts) {
    const to = mode === "--test" ? TEST_TO : d.email;
    const subject = mode === "--test" ? `[TEST for ${d.email}] ${d.subject}` : d.subject;
    try {
      const result = await resend.emails.send({
        from: "Naya <naya@theblackfemaleengineer.com>",
        replyTo: "theblackfemaleengineer@gmail.com",
        to,
        subject,
        html: d.html,
        text: d.text,
      });
      const id = (result as { data?: { id: string } }).data?.id;
      console.log(`  SENT -> ${to} (for ${d.email}) id=${id}`);
    } catch (err) {
      console.error(`  FAIL -> ${to}:`, err instanceof Error ? err.message : err);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n${mode === "--test" ? "TEST" : "LIVE"} send complete.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
