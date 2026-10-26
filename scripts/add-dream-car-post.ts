import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number',
});

const prisma = new PrismaClient({ adapter });

const content = `Here are the 5 most unhinged things I do, the rule behind all of them, and the AI prompt you can use to run the same audit on your own life.

When people find out what my business makes, they assume my life looks a certain way. Luxury car. Weekly nail appointments. A closet full of brand new everything.

It doesn't.

Not because I'm trying to be frugal. I run my life like a startup, and every startup has one resource it can't get more of: time.

So here's what I actually do, and why.

## 1. I sold my dream car

I haven't had a car in over 5 years.

I finally got the car of my dreams. Then I did the math. Taking an Uber costs me less than owning a car once you add up the payment, insurance, parking, and maintenance.

And here's the part nobody talks about. When you drive, your hands and eyes are busy. When someone else drives, the backseat becomes an office.

I edit content, answer emails, and send deliverables on the way to wherever I'm going. That commute used to be dead time. Now it's some of my most productive time.

## 2. I wear press-on nails

Or I just rock the bare look.

I used to love getting my nails done. Then one day it hit me. Every appointment meant 2 hours sitting still and $200+ out of my account.

That was a complete waste of time for me.

Hot take: the day I get my nails done for fun is the day I have $30 million in the bank.

## 3. I do my own facials, shaving, and waxing

Being camera ready is part of the job, so I'm not giving up beauty treatments.

What I gave up was commuting somewhere just to sit still and pay for it. I do all of it at home, on my schedule, while I listen to a podcast or think through a problem.

Do you see the pattern yet?

## 4. 80% of my clothes are secondhand

I love fashion. I just don't love new clothes.

As I've gotten older, I've noticed that new clothes keep getting worse in quality and less unique. Nothing makes me happier than finding a sturdy pair of jeans and a top with real character at a secondhand store.

It costs less, it lasts longer, and nobody else is wearing my outfit.

## 5. The twist: where I DO spend

Here's where people get confused. Because this isn't a post about cutting everything.

This is the first time in my life I've had a 1 bedroom apartment.

I've lived with roommates more than I've lived alone. When I finally lived alone, it was in a studio. Having a whole door between me and my bed is new to me.

And I chose to spend money on it on purpose. Where you live shapes how you think, how you rest, and how you work. Growing my space was an investment in growing my mind.

I cut what wastes my time so I can pay for what grows me.

## The rule behind all of it

I don't cut costs. I cut idle hours.

Once you know what an hour of your time is worth, you can't unsee it.

At $60K a month, my time is worth about $350 an hour. So that "quick" nail appointment wasn't $200. It was:

- $200 for the service
- + 2 hours of my time at $350/hour
- = a $900 appointment

Every recurring expense in my life gets judged by that math. Some things I cut. Some things I do myself because it's faster at home. Some things I outsource because someone else can do them better and quicker than me. And some things, like my apartment, I happily pay more for because they give me something back.

You don't need to make $60K a month to use this. You just need to know your number.

## Run your own time audit with AI

This is the exact kind of thinking I use AI for. Not to do my life for me, but to show me the math I've been ignoring.

Copy this prompt into ChatGPT, Claude, or your AI tool of choice. It will ask you a few questions first, then build your audit.

\`\`\`
You are my personal operations advisor. I run my life like a startup,
and time is my scarcest resource.

Before you give me any advice, ask me these questions one at a time
and wait for my answer before asking the next:

1. What is my current monthly income, or my monthly income goal if
   I want to plan for the future?
2. How many hours do I work in a typical month?
3. What are my recurring expenses, errands, and appointments?
   (Include how much each costs and how long each one takes.)
4. What are 1 to 3 things in my life that genuinely make me happier,
   healthier, or better at my work, regardless of cost?

Once you have my answers:

Step 1: Calculate my hourly rate (monthly income divided by monthly
work hours). Show your work.

Step 2: Build a table with these columns:
- Expense or errand
- Money cost per month
- Time cost per month (hours)
- Time cost in dollars (hours x my hourly rate)
- True monthly cost (money + time cost)
- Recommendation: CUT, DIY, OUTSOURCE, or INVEST

Use these definitions:
- CUT: It costs more than it gives me back. Stop doing it.
- DIY: Doing it myself at home is faster or cheaper than going
  somewhere for it.
- OUTSOURCE: Someone else can do it faster or better, and paying
  them frees up time I can use elsewhere.
- INVEST: It costs money, but it clearly makes my life, health,
  or work better. Keep it.

Step 3: Rank the items by how many hours I'd get back each month
if I followed your recommendations.

Step 4: Tell me the total hours and the total true cost I could
reclaim each month.

Step 5: Pick the ONE change I should make this week that gives me
the biggest return.

Rules:
- Be honest. If something I love is worth keeping, say so. This
  is not about cutting everything.
- Do not recommend anything that puts my safety, health, or
  relationships at risk just to save money or time.
- If my hourly rate is low right now, point out that some DIY
  choices may make more sense than outsourcing.
- Keep the final answer short enough to read on my phone.
\`\`\`

## What to do next

Run the prompt, then pick one thing. Not five. One.

Cancel the thing you keep paying for out of habit. Move the errand you hate to the backseat. Or finally spend money on the one thing that actually makes your life better.

That's how you start running your life like a startup.`;

async function main() {
  const post = await prisma.blogPost.create({
    data: {
      slug: 'i-make-60k-a-month-and-still-sold-my-dream-car',
      title: 'I Make $60K a Month and I Still Sold My Dream Car',
      excerpt: "I don't cut costs. I cut idle hours. The real math behind the 5 things I stopped paying for, and the one thing I happily pay more for on purpose.",
      content,
      author: 'Nyaradzo',
      category: 'Finance',
      tags: JSON.stringify(['Finance', 'Productivity', 'Time Management', 'AI']),
      featured: false,
    },
  });
  console.log('Created:', post.slug);
}

main().finally(() => prisma.$disconnect());
