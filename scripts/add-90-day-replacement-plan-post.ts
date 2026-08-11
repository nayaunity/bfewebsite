import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: 'number',
});

const prisma = new PrismaClient({ adapter });

const content = `If your job disappeared tomorrow, do you know exactly how you'd generate income in the next 30 to 90 days?

Not "I'd start applying." Not "I have savings." Not "I'd figure it out."

I mean a written, dated, step-by-step system with an offer, a proof asset, a list of ten people to contact, and a first invoice.

Most ambitious women don't have that. They have a job and a hope. And in this market, hope is not a plan.

Here is the exact system I'd run. Day by day, tool by tool, prompt by prompt.

## Why "wait it out" stopped working

The old safety plan was: get laid off, collect severance, apply for three months, land somewhere similar. That math no longer holds.

Employers cited AI in roughly 87,700 U.S. job cuts in the first half of 2026 alone. That's about 22% of announced layoffs, and more than in all of 2025 (Challenger, Gray & Christmas data). Tech firms announced 139,156 cuts in H1 2026, up 83% year over year, with AI the number one cited reason for four consecutive months.

Meanwhile the other side of the market is loud. The share of skilled U.S. knowledge workers who freelance jumped from 28% to 38% in a single year, and freelancers doing AI work earn 34% more per hour than those who don't (Upwork Future Workforce Index 2026). AI-augmented professional services grew 72% in volume with earnings up 22%.

Read that again, because it's the whole thesis of this system: **the money isn't in knowing AI tools. It's in pointing AI at a problem you already understand.** Upwork calls that person an "AI Orchestrator." I call her employed on her own terms.

One more number that should make you build this before you need it: the average job search after a 2026 layoff runs about six months, while most severance covers three. The gap between those two numbers is where panic decisions get made. This plan closes the gap.

Soft life requires hard systems. Let's build the system.

## The system at a glance

Here are the five phases and what you should have at the end of each one:

**Phase 1: Map (Day 1 to 3).** Turn your existing skill into one AI-powered offer. You walk away with one sentence offer and one price.

**Phase 2: Build (Day 4 to 14).** Create proof of skill, not a portfolio of opinions. You walk away with one working asset a stranger can see.

**Phase 3: Position (Day 15 to 21).** Rewrite your story so the offer is obvious. You walk away with a profile, one-pager, and case study.

**Phase 4: Sell (Day 22 to 45).** Ten precise conversations, not a hundred sprays. You walk away with your first paying client or product sale.

**Phase 5: Compound (Day 46 to 90).** Turn one yes into a repeatable machine. You walk away with recurring revenue and a productized version.

**Rule for the whole thing:** you are not allowed to learn anything that doesn't ship. Every hour of AI "research" must produce an artifact.

## Phase 1: Map your skills to one AI-powered offer (Day 1 to 3)

Do not start with tools. Start with the expensive problem you already know how to solve.

**Step 1. Dump your inventory.** Open a doc and list every task you've been paid to do, every process you've fixed, every report you've built, every tool you've administered. Include the boring things. The boring things are the billable things.

**Step 2. Run the offer-mapping prompt.** Paste this into Claude or ChatGPT:

\`\`\`
You are a positioning strategist for a solo consultant. Here is my work history and a list of every task I've been paid to do: [PASTE]. Identify the three most expensive, recurring, unglamorous problems I am qualified to solve for small businesses or founders. For each, propose a done-for-you offer I could deliver in under two weeks using AI tools, a specific target buyer with budget, the business outcome in dollars or hours saved, and a starting price between $500 and $3,000. Rank them by how fast I could get a first paying client. Be blunt about which ones are too vague to sell.
\`\`\`

**Step 3. Pick one. Only one.** The winner is the offer where you'd be embarrassed by how obvious your advantage is.

Here's how it maps by background:

- **Marketing or ops:** Build simple automations that plug leaky revenue. Instagram DM to email list, form fill to CRM to follow-up sequence, review request after purchase. Zapier (https://bit.ly/4hzpinh) or Make for the plumbing, HubSpot or Airtable as the system of record, an AI step for classification and drafting. Sell it as a done-for-you install with a 30-day tune-up.

- **Writer or creator:** Turn one long asset into a month of distribution. ChatGPT or Claude for hooks, scripts, emails, and repurposing. Notion AI for the content calendar and brief library. Canva and CapCut for packaging. Sell it as a "content engine install." The system plus the first 30 pieces.

- **Analyst, finance, or PM:** Build the reporting a founder keeps asking for and nobody has time to make. AI-assisted spreadsheet models, a live dashboard, a weekly narrative summary the CEO can forward. Sell it as a monthly retainer, because reporting is never a one-time need.

- **Support, HR, or admin:** Build the internal knowledge base and the AI assistant that answers from it. Cut first-response time and onboarding time. Sell it as a documented system plus training for the team.

- **Engineer or technical:** Build the small internal tool or integration a non-technical team is currently doing by hand in a spreadsheet. Charge for the time you delete.

By end of Day 3 you should be able to finish this sentence with no hedging: **I help [specific buyer] get [specific outcome] in [timeframe] using [system], for [price].**

If you can't say it in one breath, it's not an offer. It's a vibe.

## Phase 2: Use AI to build proof of skill fast (Day 4 to 14)

Nobody buys your resume. They buy evidence that the thing works.

So in 7 to 10 working days, you build one real asset. Not a course. Not a "brand." One working thing.

**Build one of these:**

1. **A working automation.** A live Zapier (https://bit.ly/4hzpinh) or Make scenario that moves data between two tools and does something a human was doing manually. Record a 90-second Loom of it running.

2. **A system in a box.** A Notion or Airtable workspace with the process, templates, and AI prompts embedded, ready to hand over.

3. **A digital product.** A paid template, prompt library, or mini-toolkit priced $27 to $97 that proves you can package expertise.

4. **A spec build for a real company.** Pick a business you'd want as a client, build a small version of your offer for them unpaid and unasked, and send it. This converts faster than anything else on this list.

**The build sprint, day by day:**

- **Day 4 to 5: Scope it with AI.** Use this prompt:

\`\`\`
Act as a technical project manager. I want to build [ASSET] in 7 working days with only AI tools and no-code. Give me a day-by-day build plan, the exact tools, the riskiest step, and what to cut if I fall behind.
\`\`\`

- **Day 6 to 10: Build.** Use AI as your pair for the Zapier filter logic, the formula, the copy, the schema. When you get stuck, paste the error, not a paraphrase of the error.

- **Day 11 to 12: Test it on real, messy data.** Break it on purpose. Fix it. This is the step that separates a demo from a product.

- **Day 13: Document it.** Have AI turn your build notes into a one-page "how it works" and a short SOP the buyer could hand a teammate.

- **Day 14: Record the proof.** A 90-second screen recording: here's the problem, here's the before, here's it running, here's the result.

**The one metric that matters:** your asset must save or make a number. "Cuts lead follow-up from 2 days to 4 minutes." "Turns one podcast into 22 assets in an hour." "Recovers 15% of abandoned checkouts." No number, no sale.

## Phase 3: Let AI tighten your positioning and story (Day 15 to 21)

Now that you have proof, make the story around it airtight. This is where AI is genuinely underused.

- **Interrogate your own narrative.** Use an AI interview tool or just prompt:

\`\`\`
Interview me like a skeptical buyer. Ask me 15 hard questions about my offer, one at a time, and push back when my answer is vague.
\`\`\`

Answer out loud, record it, and you'll have your sales language.

- **Rewrite your assets around the outcome.** Prompt:

\`\`\`
Rewrite my LinkedIn headline, About section, and a one-page service page so a founder immediately understands the outcome I deliver. Lead with the business result, not my job titles. Keep it plain, no buzzwords, no "passionate about."
\`\`\`

- **Turn your build into a case study.** One page: the problem, what you built, the tools, the measurable result, and what it would cost to get the same thing. This one page does most of your selling.

- **Set one price and one payment link.** Stripe or Gumroad, five minutes. Friction is where momentum dies. If someone says yes on Day 23, you will not want to be building a checkout on Day 23.

## Phase 4: Use AI to get the client (Day 22 to 45)

Here's where most people fail: they post and pray. You're going to run ten precise conversations instead.

**Step 1. Build the list of ten.** Not a hundred. Ten businesses or founders who obviously, visibly need exactly what you built. They're hiring for the task, they're doing it badly in public, they just raised, or they run so lean they must be drowning. Use this prompt:

\`\`\`
Given my offer [X] and target buyer [Y], list the 12 observable signals that a company urgently needs this right now, and where I can see each signal in public.
\`\`\`

Then go find companies showing three or more signals.

**Step 2. Write ten custom messages. Not one template.** The prompt that works:

\`\`\`
Write a 90-word outreach message to [NAME], [ROLE] at [COMPANY]. Here's specific evidence they have this problem: [PASTE what you observed]. Here's what I built and its measured result: [PASTE]. Open with the observation about their business, not about me. Offer to send the 90-second demo. No compliments, no "hope this finds you well," no attachments, one question at the end. Plain language, sixth-grade reading level.
\`\`\`

Then edit it yourself. AI drafts, you make it human. The one line AI can't write is the one that proves you actually looked.

**Step 3. Work the channels in order.** Warm network first. Former colleagues, past managers, the group chat, your own audience. Then adjacent networks. Then cold. Then marketplaces like Upwork as a floor, not a strategy, because that's where AI-adjacent demand is already priced and searching for you.

**Step 4. Follow up three times.** Day 3, Day 8, Day 15, each with something new. A result, a resource, a shorter version of the offer. Most first sales live in follow-up two.

**Step 5. Make the yes easy.** Offer a small paid pilot. One automation, one system, one month, at $500 to $1,500 rather than a $5,000 engagement. A small yes today beats a big maybe next quarter.

**The Day 45 target: one paying client or one product sale.** Not ten. One. Because one paying customer changes what you know, what you can charge, and who you are in the market. That's your replacement seed.

## Phase 5: Compound the seed (Day 46 to 90)

One client is proof. A system is freedom. In the second half, you turn the seed into a machine.

- **Ask for the referral immediately after delivery,** while the result is fresh, and ask for it specifically: "Who else do you know with this exact problem?"

- **Convert one-time work into a retainer.** Every system you install needs monitoring, tuning, and reporting. Price it monthly at 20 to 30% of the build.

- **Productize the delivery.** Same intake form, same build checklist, same handoff doc, same AI prompts. Cut your delivery time in half and your effective rate doubles.

- **Sell the small version.** Package the thing you built as a $47 to $197 template or toolkit so the buyers who can't afford done-for-you still convert. This is your leverage layer.

- **Raise your price on client three.** Then again on client five.

- **Write the numbers down weekly.** Revenue, pipeline, delivery hours, effective hourly rate. Run your income like a startup, because it is one.

By Day 90 the goal isn't a replaced salary. It's a validated income line you control, with a clear path to scale it. That is a fundamentally different kind of safe.

## The tool stack (keep it boring)

- **Thinking, writing, positioning:** Claude or ChatGPT
- **Systems, docs, client-facing workspaces:** Notion
- **Automation plumbing:** Zapier (https://bit.ly/4hzpinh) or Make
- **CRM and follow-up:** HubSpot free tier or Airtable
- **Research and market signals:** Perplexity
- **Packaging and content:** Canva, CapCut
- **Getting paid:** Stripe or Gumroad

Seven tools. If you're evaluating an eighth before you've sent your ten messages, that's procrastination wearing a productivity costume.

## The four ways this plan fails

1. **You build before you pick a buyer.** You end up with something clever nobody asked for. Buyer first, always.

2. **You learn instead of ship.** Tutorials feel like progress and cost you the same 90 days. Cap learning at what the current build requires.

3. **You go broad instead of specific.** "I do AI automation" gets ignored. "I install the DM-to-email system that stops Instagram leads from disappearing" gets a reply.

4. **You quit at message seven.** Ten messages with no reply is normal. Ten messages, three follow-ups each, is a pipeline.

## Start today, not on the day you get the email

The point of this system is not to escape your job tomorrow. The point is that you never have to negotiate from fear again.

Run Phase 1 tonight. The inventory dump and the offer prompt take 40 minutes. Then give the build ten working days of early mornings. By the time anyone in a conference room decides your role is "redundant," you'll already have a second income line with your name on it.

If your safety plan is "hope my job is safe," you are exposed. Build the plan while you still have the paycheck funding it.`;

async function main() {
  const existing = await prisma.blogPost.findUnique({
    where: { slug: 'the-90-day-replacement-plan' },
  });

  if (existing) {
    console.log('Post already exists, updating...');
    await prisma.blogPost.update({
      where: { slug: 'the-90-day-replacement-plan' },
      data: {
        title: 'The 90-Day Replacement Plan: How I\'d Use AI to Replace My 9-5 If I Lost It Tomorrow',
        excerpt: 'A step-by-step system to go from layoff to paying client in 90 days using AI tools you already know. Five phases, real prompts, no fluff.',
        content,
        author: 'Nyaradzo',
        category: 'Career',
        tags: JSON.stringify(['AI', 'freelancing', 'career', 'side hustle', 'consulting', 'layoff']),
        featured: true,
      },
    });
    console.log('Updated: the-90-day-replacement-plan');
  } else {
    const post = await prisma.blogPost.create({
      data: {
        slug: 'the-90-day-replacement-plan',
        title: 'The 90-Day Replacement Plan: How I\'d Use AI to Replace My 9-5 If I Lost It Tomorrow',
        excerpt: 'A step-by-step system to go from layoff to paying client in 90 days using AI tools you already know. Five phases, real prompts, no fluff.',
        content,
        author: 'Nyaradzo',
        category: 'Career',
        tags: JSON.stringify(['AI', 'freelancing', 'career', 'side hustle', 'consulting', 'layoff']),
        featured: true,
      },
    });
    console.log('Created:', post.slug);
  }
}

main().finally(() => prisma.$disconnect());
