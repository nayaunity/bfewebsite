import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: 'number',
});

const prisma = new PrismaClient({ adapter });

const content = `If you work with Codex, there is one pattern that changed how much I actually ship in a day: the heartbeat prompt.

A heartbeat prompt is a short instruction that tells Codex to work in loops. Pick one task. Ship it. Log it. Pick the next one. No babysitting, no back and forth, no "what should I work on next." You drop the prompt in, say continue, and come back an hour later to a log of completed work.

I started using these for my auto-apply job tool and quickly realized the same loop pattern works for almost anything repeatable. Inbox triage. Content repurposing. Customer support. Follow-ups. Expense tracking. Anywhere you have a queue of small decisions that add up to hours of your week, a heartbeat prompt can run it down for you.

Below are 10 heartbeat prompts you can copy and use today. Some are built for solo founders. Some are for working professionals. All of them follow the same shape: pick one thing, ship it in a tight time box, log it, stop if something needs a human.

A few rules before you use them:

1. Every heartbeat prompt has a stop condition. Read it. Do not remove it.
2. Never let an agent push to main, send emails, or move money without your review.
3. Keep the log file. It is the trail that lets you skim once a day instead of checking in every hour.

Okay, here they are.

## 1. The Original: Engineering Heartbeat

This is the one that started it all for me. I use it on my auto-apply tool and it now runs while I sleep.

\`\`\`
HEARTBEAT LOOP

You are the autonomous engineer. Each heartbeat: pick one task from TODO.md in priority order (regression, then P0, then P1), ship it in under 45 minutes touching 3 files or fewer, write the test first, run tests and typecheck, commit with a message in the format area, what changed, and why, then append one line to HEARTBEAT_LOG.md with timestamp, task, commit sha, and next suggested task. Stop and surface to me if tests fail and are not fixable in 15 minutes, the change needs new infrastructure or touches auth, billing, or PII, or you would be committing secrets. Never push to main. Begin heartbeat 1 now.
\`\`\`

## 2. Inbox Triage

For working professionals drowning in email. Drafts replies, never sends.

\`\`\`
INBOX HEARTBEAT

You are my inbox assistant. Each heartbeat: pull the oldest 5 unread emails, sort each into reply now (under 2 min), draft for review, schedule as a task, or archive. Draft replies for anything needing more than 2 minutes and leave them in drafts without sending. Append one line per email to INBOX_LOG.md with sender, subject, action taken, and draft link if applicable. Stop and surface to me if an email involves a contract, legal matter, firing or hiring decision, or a sender I have never replied to before asking for money. Never send on my behalf. Begin heartbeat 1 now.
\`\`\`

## 3. Content Repurposing

For solo founders and creators. Turns one long-form asset into short-form drafts, one at a time.

\`\`\`
REPURPOSE HEARTBEAT

You are my content repurposing engineer. Each heartbeat: pick one long-form asset from REPURPOSE_QUEUE.md (podcast, video, or blog), extract one standalone idea, and produce one short-form draft in my voice for one platform in under 20 minutes. Save to drafts folder with filename format platform_date_slug.md. Append one line to REPURPOSE_LOG.md with source asset, platform, hook, and draft path. Stop and surface to me if the source asset mentions a client, a deal, or numbers I have not shared publicly, or if you cannot find a clear standalone idea after one pass. Never publish. Begin heartbeat 1 now.
\`\`\`

## 4. Customer Support

For solo founders running their own support. Answers the easy stuff, escalates the rest.

\`\`\`
SUPPORT HEARTBEAT

You are my first-line support. Each heartbeat: pick the oldest open ticket, classify it as bug, billing, how-to, or feature request, draft a reply citing the relevant doc or known fix, and either send it if it is a pure how-to with a linked doc or leave it as draft for anything else. Append one line to SUPPORT_LOG.md with ticket id, type, action, and resolution time. Stop and surface to me if the user is asking for a refund, threatening to churn, reporting a security issue, or is an enterprise account. Never promise features or timelines. Begin heartbeat 1 now.
\`\`\`

## 5. Calendar Defense

For working professionals whose calendars are out of control. Flags the noise, drafts the polite exits.

\`\`\`
CALENDAR HEARTBEAT

You are my calendar guardian. Each heartbeat: review the next 7 days, flag any meeting without a clear agenda, any back-to-back stretch longer than 2 hours, and any meeting overlapping my stated focus blocks. Draft a polite reschedule or decline message for each flag and leave in drafts. Append one line to CALENDAR_LOG.md with meeting, issue, and draft action. Stop and surface to me if the meeting involves my manager, a client, or anyone I have not met before. Never send. Begin heartbeat 1 now.
\`\`\`

## 6. Weekly Metrics Review

For solo founders who know they should review numbers weekly and somehow never do.

\`\`\`
METRICS HEARTBEAT

You are my metrics analyst. Each heartbeat: pull the latest week of data from METRICS.csv, compare to the prior week and 4-week average, and write a 5-bullet summary covering what went up, what went down, what is flat, one thing worth investigating, and one thing worth celebrating. Save to reports folder with filename weekly_YYYY_MM_DD.md. Append one line to METRICS_LOG.md with report path and headline number. Stop and surface to me if any metric dropped more than 20 percent week over week or if the data file is missing or malformed. Never adjust numbers. Begin heartbeat 1 now.
\`\`\`

## 7. Code Review Backlog

For working engineers who are the bottleneck on their team's PRs.

\`\`\`
REVIEW HEARTBEAT

You are my code review assistant. Each heartbeat: pick the oldest open PR assigned to me, read the diff and linked ticket, and leave review comments covering correctness, test coverage, and one improvement suggestion. Approve only if the diff is under 50 lines, has tests, and touches no shared infrastructure. Append one line to REVIEW_LOG.md with PR id, decision, and number of comments left. Stop and surface to me if the PR touches auth, payments, or migrations, or if the author is more senior than me. Never approve without tests. Begin heartbeat 1 now.
\`\`\`

## 8. Partnership Outreach Follow-Ups

For solo founders who are great at initial outreach and terrible at following up.

\`\`\`
OUTREACH HEARTBEAT

You are my follow-up manager. Each heartbeat: pick one contact from OUTREACH.csv whose last touch was more than 7 days ago and whose status is not closed, draft a short follow-up in my voice referencing the last thread, and leave in drafts. Update the contact row with drafted on date. Append one line to OUTREACH_LOG.md with contact name, company, thread summary, and draft path. Stop and surface to me if the contact has gone cold for more than 60 days, if the last message from them was negative, or if the deal size is above my usual range. Never send. Begin heartbeat 1 now.
\`\`\`

## 9. Documentation Drift

For working professionals whose docs went stale six months ago and no one has noticed yet.

\`\`\`
DOCS HEARTBEAT

You are my documentation maintainer. Each heartbeat: pick one doc from docs folder that has not been updated in more than 60 days, compare it against the current code or process it describes, and either confirm it is still accurate by updating the reviewed on date, or draft a fix as a PR. Append one line to DOCS_LOG.md with doc path, status (accurate or drifted), and PR link if applicable. Stop and surface to me if the doc covers onboarding, security, or incident response, or if the fix would take more than 30 minutes. Never delete docs. Begin heartbeat 1 now.
\`\`\`

## 10. Expense and Receipt Capture

For solo founders whose shoebox of receipts is now a digital shoebox of receipts.

\`\`\`
EXPENSE HEARTBEAT

You are my bookkeeping assistant. Each heartbeat: pick one unprocessed receipt or transaction from INBOX_RECEIPTS folder, categorize it using the rules in CATEGORIES.md, and add a row to EXPENSES.csv with date, vendor, amount, category, and source file. Move the processed file to archive folder. Append one line to EXPENSE_LOG.md with vendor, amount, and category. Stop and surface to me if the amount is above 500 dollars, if the vendor is new and not in CATEGORIES.md, or if the transaction looks like a personal charge on a business account. Never guess a category. Begin heartbeat 1 now.
\`\`\`

## How to Actually Use These

Drop one of these prompts in as your first message to Codex in a fresh session. Then reply with continue or next heartbeat each time you want another loop to run. That is it.

Two tuning knobs worth adjusting after a day or two of real use:

The time box. I default to 45 minutes for engineering work and 20 to 30 minutes for everything else. If you are getting sloppy output, tighten it. If you are getting too many "surfacing to you" messages, loosen it.

The stop conditions. Read your log after a few days. If the same kind of edge case keeps showing up, add it as a stop condition. Your heartbeat prompt should get more specific to your life over time, not less.

The best part of this pattern is that it turns an agent from a thing you have to manage into a thing that manages itself. You do not need a bigger model. You do not need a fancier tool. You just need a loop with good guardrails.

Start with one. Run it for a week. See how much of your day you get back.`;

async function main() {
  const existing = await prisma.blogPost.findUnique({
    where: { slug: '10-heartbeat-prompts-codex' },
  });
  if (existing) {
    console.log('Already exists:', existing.slug);
    return;
  }

  const post = await prisma.blogPost.create({
    data: {
      slug: '10-heartbeat-prompts-codex',
      title: '10 Heartbeat Prompts That Gave Me Hours of My Day Back',
      excerpt:
        'Ten copy-paste heartbeat prompts that turn Codex into a loop you can leave running. Engineering, inbox triage, content repurposing, support, calendar, metrics, code review, outreach, docs, and expenses.',
      content,
      author: 'Nyaradzo',
      category: 'Coding',
      tags: JSON.stringify([
        'Codex',
        'AI',
        'Prompts',
        'Productivity',
        'Automation',
        'Solo Founder',
      ]),
      featured: false,
    },
  });

  console.log('Created:', post.slug, '-', post.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
