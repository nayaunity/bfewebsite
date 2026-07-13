import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
  intMode: 'number',
});

const prisma = new PrismaClient({ adapter });

const BUTTON = '[[Try Codex|https://chatgpt.com/codex/]]';

async function main() {
  const post = await prisma.blogPost.findUnique({
    where: { slug: '10-heartbeat-prompts-codex' },
  });
  if (!post) {
    console.log('Post not found');
    return;
  }

  if (post.content.includes(BUTTON)) {
    console.log('Buttons already present. No change.');
    return;
  }

  const topAnchor =
    'You drop the prompt in, say continue, and come back an hour later to a log of completed work.';
  const bottomAnchor =
    'Start with one. Run it for a week. See how much of your day you get back.';

  if (!post.content.includes(topAnchor) || !post.content.includes(bottomAnchor)) {
    console.error('Anchor text missing. Aborting.');
    process.exit(1);
  }

  const updated = post.content
    .replace(topAnchor, `${topAnchor}\n\n${BUTTON}`)
    .replace(bottomAnchor, `${bottomAnchor}\n\n${BUTTON}`);

  const buttonCount = (updated.match(/\[\[Try Codex\|/g) || []).length;
  console.log('Button occurrences after update:', buttonCount);
  console.log('Length before:', post.content.length, 'after:', updated.length);

  if (buttonCount !== 2) {
    console.error('Expected 2 button markers, got', buttonCount);
    process.exit(1);
  }

  await prisma.blogPost.update({
    where: { slug: '10-heartbeat-prompts-codex' },
    data: { content: updated },
  });

  console.log('Updated prod post with CTA buttons.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
