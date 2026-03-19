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

## Page Analytics Tracking

**IMPORTANT**: Whenever you create a new page (`page.tsx`), you MUST add analytics tracking so it appears in the admin panel. Follow the full instructions in `.claude/skills/add-page-tracking/SKILL.md`. Quick summary:

1. Add `<PagePresenceTracker page="<slug>" />` from `@/components/PagePresenceTracker`
2. Create a `PageViewTracker.tsx` client component that POSTs to `/api/blog/view` with the page slug and title
3. Add both components to the page JSX
4. Filter the slug out of blog analytics queries in `src/app/admin/analytics/page.tsx`
5. Add dedicated queries + UI section to the admin analytics page
6. Optionally add a quick-stat card to the admin dashboard (`src/app/admin/page.tsx`)

Do NOT skip this step. Every new page must be trackable from `/admin/analytics`.

## Theme & Styling

All new pages, components, and assets **must** follow the site's theme system. Never use hardcoded colors or inline styles for colors/backgrounds/borders.

- **Use CSS variables** for all colors: `var(--background)`, `var(--foreground)`, `var(--card-bg)`, `var(--card-border)`, `var(--gray-50)`, `var(--gray-100)`, `var(--gray-200)`, `var(--gray-600)`, `var(--gray-800)`, accent variables like `var(--accent-blue-bg)`, etc.
- **Use Tailwind classes** for layout, spacing, and typography rather than inline styles.
- **Primary accent**: `#ef562a` (orange) for CTAs, highlights, active states, and hover effects.
- **Secondary accent**: `#ffe500` (yellow) for badges, CTAs on dark backgrounds.
- **Headings**: Use `font-serif` class (Playfair Display). Body text inherits Inter.
- **Cards**: `bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl`
- **Dark mode**: The site supports light/dark via `data-theme` attribute on `<html>`. CSS variables automatically switch. Never hardcode light-only colors like `#ffffff` or `#111827`.
- **Page structure**: Navigation + hero section + content sections + Footer. Hero uses serif headings with orange italic accent span.

See `src/app/globals.css` for the full variable list.

## Deployment

**IMPORTANT**: NEVER commit, push, merge, or deploy unless the user explicitly asks you to. Do not chain these actions together automatically. Wait for explicit instructions for each step.

**Shortcut**: If the user says just **"deploy"**, that means the full chain: commit all changes, push, merge to main (if not already on main), push main, deploy with `vercel --prod`, then switch back to the working branch.

When merging to main or pushing to main, always switch back to the previous working branch immediately after. Do not stay on main.

Deploy to production with Vercel:
```bash
vercel --prod
```
