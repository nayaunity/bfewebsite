---
name: add-companies
description: Add new companies to the auto-apply system and job board. Handles API verification, config updates, job scraping, and Playwright application testing. Use when the user wants to add companies, expand the company list, or test new companies for auto-apply.
argument-hint: [company-name-1] [company-name-2] ... or "batch" to add a pre-defined batch
disable-model-invocation: true
allowed-tools: Bash, WebFetch, Read, Write, Edit, Glob, Grep
---

# Add Companies to Auto-Apply System

Add new companies to the auto-apply job board: $ARGUMENTS

## Overview

This skill handles the full pipeline: verify the company's ATS API works, add it to the config, scrape its jobs into production, and Playwright-test an actual application. Companies that pass get kept; fixable failures get iterated on; structural failures get blocked.

## Step 1: Identify the Company's ATS Platform

For each company the user wants to add, determine which ATS platform it uses. Check these sources first:

1. **Already documented:** Check `worker/data/target-companies.json` and `src/data/dei-companies.json` for existing entries with ATS configs
2. **Web search:** Look up the company's careers page to identify the ATS

### Supported ATS Platforms

| Platform | How to identify | Config needed |
|----------|----------------|---------------|
| **Greenhouse** | URL contains `greenhouse.io` or `job-boards.greenhouse.io` | `boardToken` (usually company slug) |
| **Lever** | URL contains `jobs.lever.co` | `companySlug` |
| **Workday** | URL contains `myworkdayjobs.com` | `baseUrl`, `company`, `siteName` |
| **Ashby** | URL contains `jobs.ashbyhq.com` | `boardSlug` |

If the company uses a **custom career portal** (none of the above), it is NOT supported. Tell the user and skip it.

**Ashby note:** Ashby companies can be scraped for the job board, but ALL Ashby companies are blocked from auto-apply due to anti-bot protection. Still worth adding for job board display.

## Step 2: Verify the ATS API

Before adding anything, verify the API endpoint returns jobs. This prevents repeating the May 6 batch failure where 9/10 companies were blocked.

### Greenhouse verification

```bash
curl -s "https://boards-api.greenhouse.io/v1/boards/{boardToken}/jobs" | python3 -c "
import json,sys
d=json.load(sys.stdin)
jobs=d.get('jobs',[])
print(f'Jobs: {len(jobs)}')
if jobs:
    u=jobs[0].get('absolute_url','')
    native='greenhouse.io' in u
    print(f'Sample URL: {u}')
    print(f'Native ATS URL: {native}')
    if not native: print('WARNING: Custom portal detected. Auto-apply will likely fail.')
"
```

**CRITICAL:** If `absolute_url` does NOT contain `greenhouse.io`, the company wraps Greenhouse in a custom portal. Auto-apply will fail. Add to the job board config but also add to `BLOCKED_COMPANIES` in `src/lib/auto-apply/job-matcher.ts`.

### Lever verification

```bash
curl -s "https://api.lever.co/v0/postings/{companySlug}?mode=json" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(f'Jobs: {len(d)}')
if d:
    u=d[0].get('hostedUrl','')
    native='lever.co' in u
    print(f'Sample URL: {u}')
    print(f'Native ATS URL: {native}')
    if not native: print('WARNING: Custom portal detected. Auto-apply will likely fail.')
"
```

### Workday verification

```bash
curl -s -X POST "https://{baseUrl}/wday/cxs/{company}/{siteName}/jobs" \
  -H "Content-Type: application/json" \
  -d '{"appliedFacets":{},"limit":1,"offset":0,"searchText":""}' | python3 -c "
import json,sys
d=json.load(sys.stdin)
jobs=d.get('jobPostings',[])
print(f'Jobs: {d.get(\"total\",0)} total, {len(jobs)} returned')
"
```

For Workday, the `siteName` is the hardest to find. Inspect the company's career page URL: `https://{company}.wd{N}.myworkdayjobs.com/en-US/{siteName}`. The path segment after `/en-US/` is the `siteName`.

### Ashby verification

```bash
curl -s "https://api.ashbyhq.com/posting-api/job-board/{boardSlug}" | python3 -c "
import json,sys
d=json.load(sys.stdin)
jobs=d.get('jobs',[])
print(f'Jobs: {len(jobs)}')
"
```

### Check for duplicates

Before adding, verify the slug is not already in the config:

```bash
python3 -c "
import json
with open('src/data/auto-apply-companies.json') as f:
    data = json.load(f)
slugs = [c['slug'] for c in data]
NEW = ['slug1', 'slug2']  # replace with actual slugs
for s in NEW:
    if s in slugs: print(f'DUPLICATE: {s} already exists')
    else: print(f'OK: {s} is new')
"
```

## Step 3: Add to `auto-apply-companies.json`

Add verified companies to `src/data/auto-apply-companies.json`. Use the correct format for each ATS type:

### Greenhouse entry

```json
{
  "name": "Company Name",
  "slug": "companyslug",
  "careersUrl": "https://job-boards.greenhouse.io/companyslug",
  "industry": "Technology",
  "atsType": "greenhouse",
  "atsConfig": {
    "boardToken": "companyslug"
  }
}
```

### Lever entry

```json
{
  "name": "Company Name",
  "slug": "companyslug",
  "careersUrl": "https://jobs.lever.co/companyslug",
  "industry": "Technology",
  "atsType": "lever",
  "atsConfig": {
    "companySlug": "companyslug"
  }
}
```

### Workday entry

```json
{
  "name": "Company Name",
  "slug": "companyslug",
  "careersUrl": "https://company.wd5.myworkdayjobs.com",
  "industry": "Technology",
  "atsType": "workday",
  "atsConfig": {
    "baseUrl": "https://company.wd5.myworkdayjobs.com",
    "company": "company",
    "siteName": "ExternalSite"
  }
}
```

### Ashby entry

```json
{
  "name": "Company Name",
  "slug": "companyslug",
  "careersUrl": "https://jobs.ashbyhq.com/companyslug",
  "industry": "Technology",
  "atsType": "ashby",
  "atsConfig": {
    "boardSlug": "companyslug"
  }
}
```

### Industry values (pick one)

- `Technology`
- `Fintech`
- `Financial Services`
- `Healthcare`
- `EdTech`
- `Defense Tech`
- `Aerospace & Defense`
- `Retail`
- `Consumer Goods`
- `Energy`
- `Professional Services`
- `Gaming`

## Step 4: Scrape Jobs into Production

Update `scripts/scrape-new-companies.ts` with the new companies in the `NEW_COMPANIES` array, then run:

```bash
DATABASE_URL=$(grep "^DATABASE_URL=" .env.production | head -1 | sed 's/^DATABASE_URL=//' | tr -d '"') \
DATABASE_AUTH_TOKEN=$(grep "^DATABASE_AUTH_TOKEN=" .env.production | head -1 | sed 's/^DATABASE_AUTH_TOKEN=//' | tr -d '"') \
npx tsx scripts/scrape-new-companies.ts
```

The script handles Greenhouse, Lever, and Workday scraping. For each company it:
- Fetches jobs from the API
- Upserts into the `Job` table with `source: "auto-apply"`
- Computes region from location
- Reports count of jobs found and saved

If adding a company type not covered by the script (e.g., Ashby), add the scraping logic following the existing patterns.

## Step 5: Playwright Application Testing (Per-Company, Iterative)

**This is the most important step.** Every new company must be tested with a real Playwright application attempt. Do NOT batch-test. Test each company individually, observe failures, fix handlers if possible, block if not.

### 5a. Create a test session

Update `scripts/test-new-companies.ts` with the new company slugs in the `NEW_SLUGS` array, then run:

```bash
DATABASE_URL=$(grep "^DATABASE_URL=" .env.production | head -1 | sed 's/^DATABASE_URL=//' | tr -d '"') \
DATABASE_AUTH_TOKEN=$(grep "^DATABASE_AUTH_TOKEN=" .env.production | head -1 | sed 's/^DATABASE_AUTH_TOKEN=//' | tr -d '"') \
npx tsx scripts/test-new-companies.ts
```

This creates a `BrowseSession` using the admin test account (`theblackfemaleengineer@gmail.com`) with one job per new company. The Railway worker picks it up automatically.

### 5b. Monitor results

```bash
DATABASE_URL=$(grep "^DATABASE_URL=" .env.production | head -1 | sed 's/^DATABASE_URL=//' | tr -d '"') \
DATABASE_AUTH_TOKEN=$(grep "^DATABASE_AUTH_TOKEN=" .env.production | head -1 | sed 's/^DATABASE_AUTH_TOKEN=//' | tr -d '"') \
npx tsx scripts/check-test-results.ts {sessionId}
```

### 5c. Interpret results and iterate

For each company, the result will be one of:

| Result | Action |
|--------|--------|
| **`applied`** | Company passes. Keep it in the config. |
| **`failed` (fixable)** | Form field not filled, dropdown not selected, date picker issue, new field type. Fix the handler in `worker/src/apply-engine.ts` or the ATS-specific handler, then re-test. |
| **`failed` (structural)** | Custom portal redirect, login wall, anti-bot block, unreachable iframe, cookie consent blocking form. Add to `BLOCKED_COMPANIES`. |
| **`skipped`** | No matching job found. Try with a different job. |

### 5d. Block failed companies

For companies with structural failures, add their slug to `BLOCKED_COMPANIES` in `src/lib/auto-apply/job-matcher.ts`:

```typescript
const BLOCKED_COMPANIES = new Set([
  // ... existing entries ...
  "newcompany",    // Reason for blocking (date)
]);
```

The company's jobs still appear on the job board for manual applications.

### 5e. Fix and re-test

For fixable failures:
1. Read the error message from `check-test-results.ts`
2. Identify the handler issue (usually in `worker/src/apply-engine.ts`, `worker/src/workday/auth.ts`, or `worker/src/verification.ts`)
3. Fix the handler code
4. Re-run the test for that specific company
5. Repeat until it passes or is determined to be structural

**Handler fixes benefit ALL companies on that ATS platform.** A new dropdown pattern fixed for one Greenhouse company helps every Greenhouse company.

### What to watch for during each test

- **Email verification**: Does the company send a code? Does `worker/src/verification.ts` extract it? (Supports 6-digit, 8-char codes)
- **Account creation**: Does Workday auth flow handle sign-up? (`worker/src/workday/auth.ts`)
- **Form fields**: All required fields filled? Any new field types?
- **Redirects**: Does the apply URL stay on the native ATS domain?
- **Anti-bot**: Does the page load normally or show a challenge/CAPTCHA?
- **Timeouts**: Does the page load within 30s?

## Step 6: Report Results

Print a summary table:

| Company | ATS | Jobs Scraped | Playwright Test | Status |
|---------|-----|-------------|----------------|--------|
| Example | greenhouse | 42 | applied | PASS |
| Example2 | lever | 15 | failed (login wall) | BLOCKED |

Tell the user:
- How many companies were added and are working
- How many were blocked (and why)
- Any handler fixes made that benefit other companies
- Total new jobs added to the board

## Important Rules

- **Always verify the API first** before adding to the config
- **Always Playwright-test** before considering a company "working"
- **Iterate on fixable failures** instead of immediately blocking
- **Never skip the duplicate check** - the config already has a duplicate Discord entry
- **Use `sed` not `cut`** for extracting env vars from `.env.production` (values may contain `=`)
- **Ashby companies** are auto-apply blocked but still worth adding for the job board
- **Do not deploy** unless the user explicitly asks
