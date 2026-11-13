import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number',
});

const prisma = new PrismaClient({ adapter });

const OLD_URL = 'https://www.skool.com/startup-life-os-7440/about';
const NEW_URL = 'https://www.skool.com/disgustingly-paid/about';
const CTA_BLOCK = `[[Join Disgustingly Paid on Skool|${NEW_URL}]]`;

const APPLY = process.argv.includes('--apply');

function hasAnySkoolLink(content: string) {
  return content.includes('skool.com/disgustingly-paid') || content.includes(OLD_URL);
}

function startsWithCta(content: string) {
  return content.trimStart().startsWith(CTA_BLOCK);
}

function endsWithCta(content: string) {
  return content.trimEnd().endsWith(CTA_BLOCK);
}

async function main() {
  const posts = await prisma.blogPost.findMany({
    select: { id: true, slug: true, content: true },
    orderBy: { slug: 'asc' },
  });

  let staleLinkFixed = 0;
  let topAdded = 0;
  let bottomAdded = 0;
  let unchanged = 0;

  const samples: { slug: string; changes: string[] }[] = [];

  for (const post of posts) {
    let content = post.content;
    const changes: string[] = [];

    if (content.includes(OLD_URL)) {
      content = content.split(OLD_URL).join(NEW_URL);
      changes.push('fixed stale skool link');
      staleLinkFixed++;
    }

    const alreadyHadLink = hasAnySkoolLink(post.content);

    if (!startsWithCta(content)) {
      content = `${CTA_BLOCK}\n\n${content}`;
      changes.push('added top CTA');
      topAdded++;
    }

    if (!alreadyHadLink && !endsWithCta(content)) {
      content = `${content}\n\n${CTA_BLOCK}`;
      changes.push('added bottom CTA');
      bottomAdded++;
    }

    if (changes.length === 0) {
      unchanged++;
      continue;
    }

    if (samples.length < 5) {
      samples.push({ slug: post.slug, changes });
    }

    if (APPLY) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { content },
      });
    }
  }

  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Total posts: ${posts.length}`);
  console.log(`Stale link fixed: ${staleLinkFixed}`);
  console.log(`Top CTA added: ${topAdded}`);
  console.log(`Bottom CTA added: ${bottomAdded}`);
  console.log(`Unchanged (already had both): ${unchanged}`);
  console.log('Sample changes:');
  for (const s of samples) {
    console.log(`  - ${s.slug}: ${s.changes.join(', ')}`);
  }
}

main().finally(() => prisma.$disconnect());
