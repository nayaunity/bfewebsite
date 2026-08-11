import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: 'number',
});

const prisma = new PrismaClient({ adapter });

const content = `You came here from the video, so you already know the setup: I run my life like a company. $60K a month, ~97% gross margin, ~$92K in expenses January to now. Contractors, education, software, travel, gym, brand upkeep. All of it on one P&L, because my skills and my lifestyle are assets, not indulgences.

Here's the part I couldn't fit in a caption: **the prompt I use to decide where the next dollar goes.**

## Why this works

Most people ask "can I afford this?" The better question is "what does this return?"

Some things return money. Some return time. Some return skill, which returns money later, with interest. The problem is almost nobody sits down and calculates which is which. So they cancel the $30 tool that saves four hours a week and keep the $200 bundle they haven't opened since March.

And your next investment is probably smaller than you think. DoorDash once a week to buy back an hour. The Pro plan of the AI tool you already use daily. $150 to an editor so you post four times a week instead of once. A $20 decision with a 10x return beats a $2,000 decision with a 0x return, every time.

This prompt finds yours. It works whether you're making $0 or $60K a month. It just gives you different answers.

## The prompt

Paste this into ChatGPT, Claude, or Perplexity.

\`\`\`
LIFE AS A STARTUP: CFO/COO AUDIT

Act as my CFO and COO for my one-person startup: me.

I'm an ambitious person who wants to use AI to build skills, income, and freedom. I might be a working professional, a new freelancer, or a full-time creator. Treat my skills, time, calendar, team, health, and lifestyle as assets on a balance sheet, not as guilty pleasures.

Your job:

1. Build a simple "Life as a Startup" P&L from my answers.
2. Tell me which low-, medium-, and high-cost next investments will give me the highest return in money, time, or skill growth.

How to run this session:

Ask me your questions in 4 short rounds, max 5 questions per round. Wait for my answers before moving on. Never ask me for a number I'd have to go dig for. Give me ranges to pick from, or estimate and tell me you estimated. If I skip something, assume a reasonable default and flag it.

Round 1 - Revenue: where money comes in now, how much per month, how stable it is, and what my ceiling would be if nothing changed.

Round 2 - Cost of delivery: what I spend to actually produce and deliver the thing I get paid for (tools, supplies, gear, platform fees, materials).

Round 3 - Operating expenses: contractors and help, education, software and subscriptions, advertising, travel.

Round 4 - Personal assets and constraints: health and fitness, appearance and brand upkeep, how many usable hours a week I actually have, what my current cash cushion is, and my risk tolerance (conservative / balanced / aggressive).

Then produce this, in order:

1. My P&L
A clean table: Revenue, then Cost of Delivery, then Gross Profit + gross margin %, then Operating Expenses (itemized), then Personal/Brand Investment, then Total Expenses, then Net. Annualize it. Use my real numbers where I gave them, clearly marked estimates where I didn't.

2. Three diagnostic numbers
Gross margin % and whether it's healthy for my model.
Effective hourly rate: revenue divided by hours actually worked.
Runway: months I could operate if income stopped today.
Tell me plainly which of the three is my weakest link, because that dictates everything else.

3. Spend classification
Sort every expense I named into one of four buckets, with one line of reasoning each:
Asset: compounds, returns more than it costs (keep, consider doubling)
Utility: necessary, non-compounding (optimize the price down)
Leak: paid for, barely used (cut this month)
Vanity: bought for how it feels or looks, not what it returns (be honest with me here)

4. My next investment, three tiers
For each tier, give me one specific recommendation, not a category, an actual thing I could buy or hire this week:
Low cost (under $50/month): buy back time or remove a small friction point
Medium cost ($50 to $500/month): buy leverage. A tool, a subscription upgrade, or a few hours of help
High cost ($500+/month or a one-time bet): buy capacity or access. A contractor, a program, a room I need to be in
For each one, state: what it is, what it costs, what it returns (hours saved, revenue unlocked, or skill gained), how long until it pays for itself, and the single metric I should watch to know if it worked.

5. What to stop paying for
Name the one or two expenses I should cancel or renegotiate right now, and what that money should be redirected into instead.

6. My 30-day CFO plan
A week-by-week sequence: what I buy, what I cut, what I test, and the one number I check every Friday. End with the one decision that would move my net income most over the next 90 days.

Rules of engagement:
Be direct and specific. No generic advice like "invest in yourself." Use my actual numbers in every recommendation. If my spending doesn't match my stated goals, say so clearly and tell me why. If I don't have enough revenue yet to justify a high-cost tier, say that too and tell me exactly what revenue number unlocks it. Assume I will act on what you say this week.
\`\`\`

## Three things before you run it

**Answer honestly, not aspirationally.** If you work 12 hours a week on your business, say 12. Inflated numbers get you flattering advice instead of useful advice.

**Sit with the "Vanity" column.** That's the one that stings. And it's where your first investment dollar comes from.

**Actually run the 30-day plan.** The output isn't the point. The Friday number is the point.

You don't need $60K a month to think like this. You need one honest spreadsheet and one good decision.

Run the audit. Find your next investment. Then go make it.`;

async function main() {
  const existing = await prisma.blogPost.findUnique({
    where: { slug: 'life-as-a-startup-my-actual-pnl' },
  });

  if (existing) {
    console.log('Post already exists, updating...');
    await prisma.blogPost.update({
      where: { slug: 'life-as-a-startup-my-actual-pnl' },
      data: {
        title: "I Run My Life Like a Startup. Here's My Actual P&L",
        excerpt: 'The exact AI prompt I use to run a CFO audit on my own life. It builds your personal P&L, classifies every expense, and tells you where your next dollar should go.',
        content,
        author: 'Nyaradzo',
        category: 'Finance',
        tags: JSON.stringify(['AI', 'finance', 'productivity', 'prompts', 'freelancing', 'money']),
        featured: false,
      },
    });
    console.log('Updated: life-as-a-startup-prompt');
  } else {
    const post = await prisma.blogPost.create({
      data: {
        slug: 'life-as-a-startup-prompt',
        title: "I Run My Life Like a Startup. Here's My Actual P&L",
        excerpt: 'The exact AI prompt I use to run a CFO audit on my own life. It builds your personal P&L, classifies every expense, and tells you where your next dollar should go.',
        content,
        author: 'Nyaradzo',
        category: 'Finance',
        tags: JSON.stringify(['AI', 'finance', 'productivity', 'prompts', 'freelancing', 'money']),
        featured: false,
      },
    });
    console.log('Created:', post.slug);
  }
}

main().finally(() => prisma.$disconnect());
