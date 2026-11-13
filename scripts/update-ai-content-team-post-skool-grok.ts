import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number',
});

const prisma = new PrismaClient({ adapter });

const GROK_UTM_URL =
  'https://x.ai/bot?utm_source=naya-bere&utm_medium=creator&utm_campaign=evergreen_oct2026&utm_content=instagram_post1';
const SKOOL_URL = 'https://www.skool.com/disgustingly-paid/about';

const OLD_GROK_LINK = `[Grok Bot](https://x.ai/bot)`;
const NEW_GROK_LINK = `[Grok Bot](${GROK_UTM_URL})`;

const OLD_INTRO_END = `A lot of you asked how. So here's the whole system: every bot, every connection, every starter prompt, and the lessons that took my videos from "okay" to "this is great."`;

const NEW_INTRO_END = `${OLD_INTRO_END}

My Disgustingly Paid members got this a month before anyone else, and they didn't just get the write-up. They got the actual bots already built, one for each role below:

- Sterling, the lead
- Scout, the footage scout
- Scribe, the script writer
- Vicky, the voice
- Curt, the editor
- QA, the checker

If you'd rather start from a working team than build one from scratch, join us: ${SKOOL_URL}`;

const OLD_MIDDLE_ANCHOR = `## Part 5: The Handoff, From Idea to Finished Video`;

const NEW_MIDDLE_ANCHOR = `If you find this valuable but want it all done for you, join Disgustingly Paid. My community got each of these six bots built and handed to them a month ago, ready to plug straight into their own tools. Join here: ${SKOOL_URL}

## Part 5: The Handoff, From Idea to Finished Video`;

const OLD_CLOSING = `If you build yours, come hang out with us in [Disgustingly Paid](${SKOOL_URL}) on Skool. That's where we work through this stuff together every week. I want to see what you build.`;

const NEW_CLOSING = `${OLD_CLOSING}

Worth knowing: Disgustingly Paid members had this whole build, bots and all, a month before this post went up. If you want the next one early, plus the bots instead of just the instructions, join here: ${SKOOL_URL}`;

async function main() {
  const existing = await prisma.blogPost.findUnique({
    where: { slug: 'ai-content-team-setup-guide' },
  });

  if (!existing) {
    throw new Error('Post not found');
  }

  let content = existing.content;

  for (const [label, oldStr] of [
    ['grok link', OLD_GROK_LINK],
    ['intro', OLD_INTRO_END],
    ['middle anchor', OLD_MIDDLE_ANCHOR],
    ['closing', OLD_CLOSING],
  ] as const) {
    if (!content.includes(oldStr)) {
      throw new Error(`Expected string for "${label}" not found in current content`);
    }
  }

  content = content.split(OLD_GROK_LINK).join(NEW_GROK_LINK);
  content = content.split(OLD_INTRO_END).join(NEW_INTRO_END);
  content = content.split(OLD_MIDDLE_ANCHOR).join(NEW_MIDDLE_ANCHOR);
  content = content.split(OLD_CLOSING).join(NEW_CLOSING);

  const post = await prisma.blogPost.update({
    where: { slug: 'ai-content-team-setup-guide' },
    data: { content },
  });
  console.log('Updated:', post.slug);
}

main().finally(() => prisma.$disconnect());
