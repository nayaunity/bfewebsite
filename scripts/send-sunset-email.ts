/**
 * Sunset notification emails for all active/trialing/past_due subscribers.
 * Tells users the auto-apply product is being sunset and their subscription
 * will not renew.
 *
 * Phase 1: test-send all drafts to theblackfemaleengineer@gmail.com
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | head -1 | sed 's/^DATABASE_URL=//' | tr -d '"') \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | head -1 | sed 's/^DATABASE_AUTH_TOKEN=//' | tr -d '"') \
 *   RESEND_API_KEY=$(grep "^RESEND_API_KEY=" .env.production | head -1 | sed 's/^RESEND_API_KEY=//' | tr -d '"') \
 *   npx tsx scripts/send-sunset-email.ts --test
 *
 * Phase 2: after approval, send to real recipients
 *   DATABASE_URL=$(grep DATABASE_URL .env.production | head -1 | sed 's/^DATABASE_URL=//' | tr -d '"') \
 *   DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | head -1 | sed 's/^DATABASE_AUTH_TOKEN=//' | tr -d '"') \
 *   RESEND_API_KEY=$(grep "^RESEND_API_KEY=" .env.production | head -1 | sed 's/^RESEND_API_KEY=//' | tr -d '"') \
 *   npx tsx scripts/send-sunset-email.ts --send
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

const TEST_TO = "theblackfemaleengineer@gmail.com";

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(d: Date | null): string {
  if (!d) return "your next renewal date";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type Subscriber = {
  id: string;
  email: string;
  firstName: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
};

function buildDraft(user: Subscriber) {
  const rawFirst = (user.firstName || "there").trim().split(/\s+/)[0];
  const firstName = capitalize(rawFirst);

  const subject = "an update about BFE auto-apply";

  let statusParagraph: string;
  let statusParagraphHtml: string;

  if (user.subscriptionStatus === "trialing") {
    statusParagraph =
      `You're currently on a free trial. Your trial will be canceled and you will not be charged. No action is needed on your end.`;
    statusParagraphHtml = statusParagraph;
  } else if (user.subscriptionStatus === "past_due") {
    statusParagraph =
      `Your subscription had a pending payment. That has been canceled and no further charges will be attempted. You do not owe anything.`;
    statusParagraphHtml = statusParagraph;
  } else {
    const endDate = formatDate(user.currentPeriodEnd);
    statusParagraph =
      `Your ${capitalize(user.subscriptionTier)} plan will remain active through ${endDate}. After that, your subscription will not renew and you will not be charged again.`;
    statusParagraphHtml =
      `Your ${capitalize(user.subscriptionTier)} plan will remain active through <strong>${endDate}</strong>. After that, your subscription will not renew and you will not be charged again.`;
  }

  const text = `Hi ${firstName},

I'm writing to let you know that I've made the difficult decision to pause the BFE auto-apply service for now.

${statusParagraph}

I want to say thank you for trusting me with something as personal as your job search. Building this for you has been one of the most meaningful things I've done, and every application we sent out together mattered to me.

This isn't the end of theBFE. The job board, blog, and community resources will stay up. I'm stepping back from auto-apply to focus on what comes next, and I'll share more when the time is right.

If you have any questions or just want to talk, reply to this email. I read every one.

Talk soon,
Naya
theblackfemaleengineer.com`;

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 560px;">
  <p style="font-size: 20px; font-weight: 700; margin: 0 0 18px;">the<span style="color: #ef562a;">BFE</span></p>
  <p style="margin: 0 0 12px;">Hi ${firstName},</p>
  <p style="margin: 0 0 14px;">I'm writing to let you know that I've made the difficult decision to pause the BFE auto-apply service for now.</p>
  <p style="margin: 0 0 14px;">${statusParagraphHtml}</p>
  <p style="margin: 0 0 14px;">I want to say thank you for trusting me with something as personal as your job search. Building this for you has been one of the most meaningful things I've done, and every application we sent out together mattered to me.</p>
  <p style="margin: 0 0 14px;">This isn't the end of theBFE. The job board, blog, and community resources will stay up. I'm stepping back from auto-apply to focus on what comes next, and I'll share more when the time is right.</p>
  <p style="margin: 0 0 14px;">If you have any questions or just want to talk, reply to this email. I read every one.</p>
  <p style="margin: 0 0 4px;">Talk soon,</p>
  <p style="margin: 0;">Naya</p>
  <p style="margin: 4px 0 0; color: #666; font-size: 13px;">theblackfemaleengineer.com</p>
</div>`;

  return { email: user.email, subject, text, html };
}

async function main() {
  const mode = process.argv[2];
  if (mode !== "--test" && mode !== "--send") {
    console.error("Usage: npx tsx scripts/send-sunset-email.ts [--test | --send]");
    process.exit(1);
  }

  const subscribers = await prisma.user.findMany({
    where: {
      subscriptionStatus: { in: ["active", "trialing", "past_due"] },
      role: { notIn: ["admin", "contributor", "test"] },
      email: { not: "portfoliotest@test.com" },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
    },
  });

  console.log(`Found ${subscribers.length} subscribers to notify:\n`);
  for (const s of subscribers) {
    console.log(`  ${s.email} — ${s.subscriptionTier}/${s.subscriptionStatus} (period ends: ${s.currentPeriodEnd ? formatDate(s.currentPeriodEnd) : "n/a"})`);
  }
  console.log();

  if (subscribers.length === 0) {
    console.log("No subscribers to email. Exiting.");
    return;
  }

  const drafts = subscribers.map((s) => buildDraft(s));
  const resend = new Resend(process.env.RESEND_API_KEY);

  let sent = 0;
  let failed = 0;

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
      sent++;
    } catch (err) {
      console.error(`  FAIL -> ${to}:`, err instanceof Error ? err.message : err);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n${mode === "--test" ? "TEST" : "LIVE"} send complete. ${sent} sent, ${failed} failed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
