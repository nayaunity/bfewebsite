# Claude Code Project Instructions

## Database Architecture

This project uses **two separate databases**:

- **Local development**: SQLite file at `./dev.db` (configured in `.env` as `DATABASE_URL="file:./dev.db"`)
- **Production**: Turso (libsql) database (configured in `.env.production`)

**IMPORTANT**: These are completely separate databases. Data added locally does NOT sync to production.

## Adding Blog Posts

When adding a new blog post, you MUST add it to the **production Turso database** directly, not the local database.

Use this pattern:

```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number'
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const post = await prisma.blogPost.create({
    data: {
      slug: 'your-post-slug',
      title: 'Your Post Title',
      excerpt: 'Short description...',
      content: \`Your markdown content here...\`,
      author: 'Nyaradzo',
      category: 'Tech',  // Options: Career, Tech, Life, Finance, Coding
      tags: JSON.stringify(['tag1', 'tag2']),
      featured: false,
    },
  });
  console.log('Created:', post.slug);
}

main().finally(() => prisma.\$disconnect());
"
```

## Blog Content Format

The blog renderer supports:
- `## Headings` and `### Subheadings`
- `**bold text**`
- `- Bullet lists` and `1. Numbered lists`
- Plain URLs (automatically converted to clickable links)
- Markdown links `[text](url)`
- Code blocks with triple backticks

## Adding Jobs

Use the `/add-jobs` skill to add new job listings. See `.claude/skills/add-jobs/SKILL.md` for full instructions.

**Quick reference for adding jobs to production:**

```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number'
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const job = await prisma.job.create({
    data: {
      externalId: 'company-unique-id',
      company: 'Company Name',
      companySlug: 'company-name',
      title: 'Job Title',
      location: 'City, State',
      type: 'Full-time',
      remote: false,
      salary: '\$XX,XXX - \$XX,XXX',
      postedAt: new Date(),  // IMPORTANT: Always set this!
      applyUrl: 'https://application-url',
      category: 'Software Engineering',
      tags: JSON.stringify(['tag1', 'tag2']),
      source: 'manual',
      isActive: true,
    },
  });
  console.log('Created:', job.title);
}

main().finally(() => prisma.\$disconnect());
"
```

**IMPORTANT:** Always set `postedAt: new Date()` when creating jobs. Jobs without `postedAt` appear at the bottom of the list since jobs are sorted by `postedAt` descending.

### Creating Job Detail Pages

To create a dedicated page for a job:

1. Create directory: `src/app/jobs/{company-job-slug}/`
2. Add `page.tsx` and `ReminderForm.tsx` (use existing job pages as templates)
3. Update `src/app/jobs/JobBoard.tsx` to add the URL-to-page mapping in `internalJobPages`

### Job Categories

- `Software Engineering`
- `Data Science`
- `Product Management`
- `DevOps / SRE`
- `Design`

## Deployment

Deploy to production with Vercel:
```bash
vercel --prod
```
