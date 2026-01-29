# Add Jobs

Add new job listings to the production database and optionally create dedicated job detail pages.

## Input

The user will provide one or more job URLs. For example:
- `https://company.greenhouse.io/job/12345`
- `https://careers.company.com/job/analyst`

## Steps

### 1. Fetch Job Details

For each URL provided, use WebFetch to extract:
- Job title
- Company name
- Location
- Job type (Full-time, Internship, Contract, etc.)
- Salary range (if available)
- Job description and requirements
- Any application deadlines

### 2. Add Jobs to Production Database

Use this pattern to add jobs directly to the **production Turso database** (not local SQLite):

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
      externalId: 'company-unique-id',      // e.g., 'nomura-1389'
      company: 'Company Name',
      companySlug: 'company-name',           // lowercase, hyphenated
      title: 'Job Title',
      location: 'City, State',
      type: 'Full-time',                     // or 'Internship', 'Contract'
      remote: false,                         // true if remote
      salary: '\$XX,XXX - \$XX,XXX',         // optional
      postedAt: new Date(),                  // IMPORTANT: Always set this!
      applyUrl: 'https://full-application-url',
      category: 'Software Engineering',      // Options: Software Engineering, Data Science, Product Management, DevOps / SRE, Design
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

**IMPORTANT:** Always set `postedAt: new Date()` - jobs without this field will appear at the bottom of the list!

### 3. Create Job Detail Page (Optional)

If the user wants a dedicated page for the job, create:

1. A new directory: `src/app/jobs/{company-job-slug}/`
2. Two files:
   - `page.tsx` - The job detail page (use existing pages like `nomura-risk-technology-analyst` as a template)
   - `ReminderForm.tsx` - Email signup form for reminders

3. Update `src/app/jobs/JobBoard.tsx` to map the external URL to the internal page:

```typescript
// Add to internalJobPages mapping
const internalJobPages: Record<string, string> = {
  // ... existing mappings
  "unique-url-pattern": "/jobs/company-job-slug",
};
```

### 4. Deploy

After adding jobs (and optionally creating pages):

```bash
vercel --prod
```

## Job Categories

Use one of these categories:
- `Software Engineering`
- `Data Science`
- `Product Management`
- `DevOps / SRE`
- `Design`

## Example Tags

- For internships: `internship`, `summer-2026`, `new-grad`
- For tech stack: `python`, `java`, `javascript`, `react`, `aws`
- For industry: `finance`, `fintech`, `healthcare`, `e-commerce`
- For level: `entry-level`, `senior`, `staff`

## Checklist

- [ ] Fetched job details from provided URLs
- [ ] Added jobs to production database with `postedAt` set
- [ ] Created job detail pages (if requested)
- [ ] Updated JobBoard.tsx with internal page mappings (if pages created)
- [ ] Deployed to production
- [ ] Informed user of the job URLs/pages created
