import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number',
});

const prisma = new PrismaClient({ adapter });

const oldEnding = `Start with Step 1 today. It takes a few minutes, and it's the difference between an AI that pretends to be you and an AI that works for you.`;

const newEnding = `Start with Step 1 today. It takes a few minutes, and it's the difference between an AI that pretends to be you and an AI that works for you.

## Want More Systems Like This

This is the kind of system I break down every week inside Disgustingly Paid, my community for people building real income with AI. We go deeper than a blog post: live workflows, prompt packs, and the exact setups I use to run my AI team.

[[Join Disgustingly Paid on Skool|https://www.skool.com/disgustingly-paid/about]]`;

async function main() {
  const existing = await prisma.blogPost.findUnique({
    where: { slug: 'give-your-ai-its-own-email-address' },
  });

  if (!existing) {
    throw new Error('Post not found');
  }

  if (!existing.content.includes(oldEnding)) {
    throw new Error('Expected ending not found in current content');
  }

  const content = existing.content.replace(oldEnding, newEnding);

  const post = await prisma.blogPost.update({
    where: { slug: 'give-your-ai-its-own-email-address' },
    data: { content },
  });
  console.log('Updated:', post.slug);
}

main().finally(() => prisma.$disconnect());
