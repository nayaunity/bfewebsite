---
name: add-jobs
description: Add new job listings to the production database from job URLs. Use when the user provides job posting URLs and wants them added to the /jobs page.
argument-hint: [job-url-1] [job-url-2] ...
disable-model-invocation: true
allowed-tools: Bash, WebFetch, Read, Write, Edit, Glob, Grep
---

# Add Jobs to Production Database

Add job listings from the provided URLs: $ARGUMENTS

## Step 1: Fetch Job Details

For each URL, use WebFetch to extract:
- Job title
- Company name
- Location
- Job type (Full-time, Internship, Contract)
- Salary range (if available)
- Job description and requirements
- Application deadlines (if any)

## Step 2: Add Jobs to Production Database

**IMPORTANT:** This project uses a production Turso database. Always add jobs directly to production.

Use this exact pattern:

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
      postedAt: new Date(),
      applyUrl: 'https://full-application-url',
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

### Critical Requirements

- **Always set `postedAt: new Date()`** - Jobs without this appear at the bottom of the list
- **Use the full application URL** for `applyUrl`
- **Generate a unique `externalId`** like `company-jobid` (e.g., `nomura-1389`)

### Job Categories (pick one)

- `Software Engineering`
- `Data Science`
- `Product Management`
- `DevOps / SRE`
- `Design`

### Common Tags

- Level: `entry-level`, `senior`, `staff`, `new-grad`, `internship`
- Tech: `python`, `java`, `javascript`, `react`, `aws`, `machine-learning`
- Industry: `finance`, `fintech`, `healthcare`, `e-commerce`
- Program: `summer-2026`, `apprenticeship`

## Step 3: Create Job Detail Page (Ask User)

Ask the user if they want a dedicated detail page for any of the jobs.

If yes, create:
1. Directory: `src/app/jobs/{company-job-slug}/`
2. Files: `page.tsx` and `ReminderForm.tsx`

Use existing job pages as templates (e.g., `src/app/jobs/nomura-risk-technology-analyst/`).

Then update `src/app/jobs/JobBoard.tsx` to add URL mapping:

```typescript
const internalJobPages: Record<string, string> = {
  // Add mapping for URL pattern to internal page
  "unique-url-pattern": "/jobs/company-job-slug",
};
```

## Step 4: Deploy

```bash
vercel --prod
```

## Step 5: Report Results

Tell the user:
- Which jobs were added
- Their URLs on the job board
- Any detail pages created
