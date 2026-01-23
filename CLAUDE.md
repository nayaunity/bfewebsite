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

## Deployment

Deploy to production with Vercel:
```bash
vercel --prod
```
