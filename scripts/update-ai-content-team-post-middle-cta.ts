import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number',
});

const prisma = new PrismaClient({ adapter });

const SKOOL_URL = 'https://www.skool.com/disgustingly-paid/about';

const OLD_MIDDLE = `If you find this valuable but want it all done for you, join Disgustingly Paid. My community got each of these six bots built and handed to them a month ago, ready to plug straight into their own tools. Join here: ${SKOOL_URL}`;

const NEW_MIDDLE = `If you're feeling overwhelmed, consider joining Disgustingly Paid. We jump on calls three times a week, which I run. I show the tutorials and show and share the plugins and tools themselves, so you don't have to spend more than a few minutes setting up. Join here: ${SKOOL_URL}`;

async function main() {
  const existing = await prisma.blogPost.findUnique({
    where: { slug: 'ai-content-team-setup-guide' },
  });

  if (!existing) {
    throw new Error('Post not found');
  }

  if (!existing.content.includes(OLD_MIDDLE)) {
    throw new Error('Expected middle CTA text not found in current content');
  }

  const content = existing.content.split(OLD_MIDDLE).join(NEW_MIDDLE);

  const post = await prisma.blogPost.update({
    where: { slug: 'ai-content-team-setup-guide' },
    data: { content },
  });
  console.log('Updated:', post.slug);
}

main().finally(() => prisma.$disconnect());
