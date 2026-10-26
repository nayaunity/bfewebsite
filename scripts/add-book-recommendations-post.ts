import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number',
});

const prisma = new PrismaClient({ adapter });

const content = `I went from $170K to $700K+ in one year. Here are the 5 books responsible, plus the AI prompt I'd run with each one.

This isn't a "read more" list. These are the 5 books that actually changed how I think about money, time, and what I believe I'm allowed to have. Each one comes with a prompt you can copy into ChatGPT, Claude, or whatever AI tool you use, so the book doesn't just sit on your shelf. It goes to work on your actual life.

## 1. The Power of Your Subconscious Mind, by Joseph Murphy

**For the girl who says she wants to grow but secretly doesn't believe it will happen for her.**

This book shows how the beliefs you repeat every day quietly drive what you do, how you show up, and what you think you're allowed to have.

Read this when your doubt is louder than your strategy.

\`\`\`
Here are the beliefs I have about my growth, money, and visibility:
[paste]

Using the ideas from The Power of Your Subconscious Mind, find which
beliefs are holding me back, rewrite each one into a belief I can
actually stand behind, and give me a 21-day daily practice to
reinforce them.
\`\`\`

## 2. The Top Five Regrets of the Dying, by Bronnie Ware

**For the girl who keeps putting off the life she wants until "someday."**

Written by a palliative care nurse, this book shares what people regretted most at the end of their lives. The biggest one: not living a life true to themselves.

Read this when you need a reason to stop waiting and start posting.

\`\`\`
Here's what I'm spending my time on and what I keep saying I'll do
"one day":
[paste]

Using the lessons from The Top Five Regrets of the Dying, show me
where I'm living by other people's expectations and help me build a
90-day plan around what actually matters to me.
\`\`\`

## 3. $100M Offers, by Alex Hormozi

**For the girl who's building an audience but not building income.**

It teaches you how to create offers so good people feel stupid saying no, by increasing the value of the outcome and decreasing the time and effort it takes to get there.

Read this when your content is working but your offer isn't.

\`\`\`
Here's my audience, my skills, and what I currently sell (or want to
sell):
[paste]

Using the Value Equation from $100M Offers, rate my offer on each
part of the equation, then redesign it into a Grand Slam Offer with
bonuses, a guarantee, and a name.
\`\`\`

## 4. Breaking the Habit of Being Yourself, by Dr. Joe Dispenza

**For the girl who knows the next version of her wouldn't make the same choices she's making now.**

It breaks down how your habits, thoughts, and emotions keep you stuck as the same person, and how to start becoming someone new before the results show up.

Read this when you're ready to outgrow your old self.

\`\`\`
Here's who I am today and who I want to be in 1 year:
[describe both]

Using the ideas from Breaking the Habit of Being Yourself, list the
daily habits, thoughts, and decisions that separate those two
versions of me, and turn them into a 30-day identity shift plan.
\`\`\`

## 5. The Adweek Copywriting Handbook, by Joseph Sugarman

**For the girl whose content is good but nobody is stopping to watch it.**

It teaches you that the only job of your first line is to get people to read the second one. That one idea changes how you write hooks, captions, and sales pages.

Read this when your ideas are strong but your words aren't landing.

\`\`\`
Here are my last 10 hooks and captions plus how each one performed:
[paste]

Using the principles from The Adweek Copywriting Handbook, explain
why the top ones worked, rewrite the weak ones, and give me 10 new
hooks for my next posts.
\`\`\`

## How I actually used these

I didn't read all 5 back to back and hope something stuck. I read whichever one matched the problem I actually had that month: a belief I couldn't shake, an offer nobody bought, a caption nobody stopped for. Then I ran the prompt on my real numbers, my real captions, my real excuses.

That's the difference between reading a book and using one.

## The bottom line

None of these books made me money by themselves. They changed what I believed, what I offered, and how I said it. The income followed.

Start with whichever one matches the problem you have right now, not the one that sounds most impressive.`;

async function main() {
  const post = await prisma.blogPost.create({
    data: {
      slug: '5-books-that-took-me-from-170k-to-700k',
      title: 'I Went From $170K to $700K+ in One Year. Here Are the 5 Books Responsible.',
      excerpt:
        "These 5 books didn't make me money by themselves. They changed what I believed, what I offered, and how I said it. Each one comes with the exact AI prompt I'd use to put it to work.",
      content,
      author: 'Nyaradzo',
      category: 'Career',
      tags: JSON.stringify(['Books', 'Mindset', 'Money Mindset', 'AI']),
      featured: false,
    },
  });
  console.log('Created:', post.slug);
}

main().finally(() => prisma.$disconnect());
