# Building an Auto-Apply System with Claude Code + Playwright MCP

## What We Built

A fully autonomous job application system that browses company career pages, finds relevant jobs, selects the right resume for each role, fills out application forms with pre-written answers, and submits — all hands-free. One command: `/auto-apply`.

---

## The Journey

### Phase 1: The API Approach (What Didn't Work)

We started by trying to use the **Greenhouse ATS API** to programmatically submit applications. The system:

- Scraped jobs from 10 Greenhouse companies (Pinterest, Airbnb, Stripe, Coinbase, etc.) using their public API
- Stored jobs in a database with dedup via `externalId + companySlug`
- Built a profile system where users could enter their name, phone, resume, work authorization answers
- Attempted to POST applications directly to `https://boards-api.greenhouse.io/v1/boards/{boardToken}/jobs/{jobId}`

**Why it failed:** The Greenhouse *read* API is public, but the *submit* API requires an API key that only the company's recruiters have. We got HTTP 401 on every submission attempt.

**What we kept:** The database models, profile system, application tracking, and admin dashboard — all of this infrastructure carried forward.

### Phase 2: The Browser Automation Approach (What Worked)

Inspired by tools like [JobPilot](https://github.com/suxrobgm/jobpilot) and [ApplyPilot](https://github.com/Pickle-Pixel/ApplyPilot), we pivoted to **Playwright MCP** — which lets Claude Code drive a real browser. Instead of calling APIs, Claude navigates to the actual application page, reads the form, fills it in, uploads the resume, and clicks submit. Just like a human would.

---

## Architecture

```
/auto-apply Stripe
      │
      ▼
┌─────────────────────┐
│  Load Profile       │  npx tsx scripts/auto-apply-data.ts
│  (name, email,      │  → profile JSON from database
│   phone, work auth) │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Load Resumes       │  npx tsx scripts/match-resume.ts
│  (4 role-specific   │  → lists all resumes + their status
│   PDFs)             │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Load Answers       │  cat job-assets/application-answers.json
│  (role-specific     │  → pre-written answers for common questions
│   Q&A)              │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  For Each Company:  │  Read from scripts/target-companies.json
│                     │
│  1. Navigate to     │  Playwright MCP → browser_navigate
│     careers page    │
│                     │
│  2. Search/filter   │  Playwright MCP → browser_click, browser_type
│     for relevant    │
│     jobs            │
│                     │
│  3. For each job:   │
│     a. Dedup check  │  npx tsx scripts/check-already-applied.ts
│     b. Match resume │  npx tsx scripts/match-resume.ts "<title>"
│     c. Fill form    │  Playwright MCP → browser_click, browser_type
│     d. Upload PDF   │  Playwright MCP → browser_upload_file
│     e. Submit       │  Playwright MCP → browser_click
│     f. Record       │  npx tsx scripts/auto-apply-record-external.ts
└─────────────────────┘
```

---

## Setup

### 1. Install Playwright MCP

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

### 2. Auto-Allow Permissions

Add to `.claude/settings.local.json` under `permissions.allow`:

```json
"mcp__playwright__*"
```

This prevents Claude from asking for approval on every browser action.

### 3. Place Your Resumes

Drop PDF files into `job-assets/resumes/`:

```
job-assets/resumes/
├── N.Bere-AI-Engineer.pdf          ← SWE + AI/ML roles
├── N.Bere-Content-Creator.pdf      ← content, marketing roles
├── N.Bere-Developer-Advocate.pdf   ← devrel, evangelism roles
└── N.Bere-Storyteller.pdf          ← creative, product, PM roles
```

### 4. Configure Your Profile

Go to `/profile` on your site and fill in:
- First name, last name, phone
- US state, country of residence
- Work authorization (Yes/No)
- Sponsorship needed (Yes/No)

### 5. Run It

```bash
claude
/auto-apply                          # All 20 companies
/auto-apply Stripe, Anthropic       # Specific companies
/auto-apply --add "Ramp" "https://ramp.com/careers"  # Add a company
```

Use `--dangerously-skip-permissions` for fully autonomous operation:

```bash
claude --dangerously-skip-permissions
/auto-apply
```

---

## Key Files

### Scripts (in `scripts/`)

| File | Purpose |
|------|---------|
| `auto-apply-data.ts` | Loads user profile + eligible Greenhouse jobs from database |
| `match-resume.ts` | Matches a job title to the best resume using keyword scoring |
| `check-already-applied.ts` | Checks if a company+title combo was already applied to |
| `extract-job-links.ts` | Parses large Playwright snapshots to extract job links |
| `auto-apply-record.ts` | Records application result for database jobs |
| `auto-apply-record-external.ts` | Records application result for browser-discovered jobs |

### Configuration (in `job-assets/`)

| File | Purpose |
|------|---------|
| `resumes.json` | Maps resume PDFs to role types via keyword matching |
| `application-answers.json` | Pre-written answers to common application questions |
| `resumes/` | Directory containing the actual resume PDFs |

### Other

| File | Purpose |
|------|---------|
| `scripts/target-companies.json` | List of 20 companies with career page URLs |
| `.claude/skills/auto-apply/SKILL.md` | The skill instructions Claude follows |

---

## Resume Matching System

Each resume has keywords tied to role types. When Claude finds a job, it runs `match-resume.ts` with the job title. The script scores each resume by how many keywords match (longer/more specific keywords score higher).

**Current configuration:**

| Resume | Matches These Roles |
|--------|-------------------|
| AI Engineer | Software engineer, backend, frontend, full stack, AI, ML, data science, DevOps, SRE, cloud, mobile, security |
| Developer Advocate | DevRel, developer relations, technical evangelist, community engineer, solutions architect, technical writer |
| Content Creator | Content strategist, social media, copywriter, video producer, marketing manager, brand manager |
| Storyteller | Producer, creative director, narrative designer, product manager, program manager, curriculum designer |

Jobs that don't match any resume are **skipped entirely** — no fallback, no wrong-resume applications.

---

## Application Answers

Pre-written answers live in `job-assets/application-answers.json`, organized by:

### Personal Info
Name, email, phone, location, LinkedIn, work authorization, start date, salary expectations.

### Self-Identification
- Disability: No
- Veteran: No
- Hispanic/Latino: No
- Race: Black or African American
- Gender: Female

### Salary Rules
- Free-text fields: "Open to discussion based on total compensation and scope of the role."
- Numeric required + job shows a range: Enter the HIGH end
- Numeric required + no range: SWE/AI $200K, DevRel $185K, Content $160K, Storyteller/PM $170K
- Range fields: $150K–$200K

### Role-Specific Q&A (4 sets)

Each resume type has tailored answers for:
- Why this company?
- Why this role?
- Tell me about yourself
- Greatest strength
- Greatest weakness
- Why are you leaving?
- Technical challenge / portfolio highlight / community example / brand philosophy

All answers are 2-4 sentences, written in first person, grounded in real experience and metrics (250K community, 100M+ impressions, RAG pipelines at AfroTech, CTO of a startup, DreamWorks, Comcast).

### General Q&A (shared across all roles)
- Management style
- Conflict resolution
- How do you learn?
- Diversity & inclusion
- Where do you see yourself in 5 years?
- What makes you unique?
- How do you handle failure?
- How do you stay current?

---

## Deduplication

Three layers prevent re-applying:

1. **Database check before applying:** `check-already-applied.ts` looks up company + job title. If status is `submitted` or `pending`, skip.
2. **URL-based dedup on recording:** `auto-apply-record-external.ts` generates a deterministic `externalId` from the job URL. The database has a unique constraint on `externalId + companySlug`.
3. **Greenhouse jobs:** `auto-apply-data.ts` filters out jobs already in the `JobApplication` table before returning eligible jobs.

---

## Target Companies (20)

Anthropic, OpenAI, Meta, Google, Apple, Microsoft, Netflix, Stripe, Figma, Gamma, Notion, Vercel, Coinbase, Airbnb, Pinterest, Databricks, Robinhood, Lyft, Dropbox, Salesforce.

Edit `scripts/target-companies.json` to add, remove, or change companies. Each entry needs:

```json
{
  "name": "Company Name",
  "careersUrl": "https://careers.example.com",
  "notes": "Optional notes"
}
```

---

## Database Models

### JobApplication
Tracks every application attempt:
- `userId`, `jobId`, `company`, `companySlug`, `jobTitle`
- `status`: submitted, failed, skipped, pending
- `errorMessage`: Why it failed/was skipped
- `submittedAt`, `createdAt`
- Unique constraint on `userId + jobId`

### AutoApplyRun
Tracks batch runs:
- `userId`, `status`, `totalJobs`, `submitted`, `skipped`, `failed`
- `startedAt`, `completedAt`

### User (extended fields)
- `firstName`, `lastName`, `phone`
- `usState`, `workAuthorized`, `needsSponsorship`, `countryOfResidence`
- `autoApplyEnabled`, `resumeUrl`, `resumeName`

---

## Web UI

### Profile Page (`/profile`)
- Resume upload (Vercel Blob storage)
- Auto-apply profile form: name, phone, state, country, work auth, sponsorship
- "Apply Now" button for manual trigger
- Link to application history

### Applications Dashboard (`/profile/applications`)
- Stats cards: total, submitted, skipped, failed
- Filterable list of all applications
- "Apply to New Jobs" button

### Admin Page (`/admin/auto-apply`)
- Overview of all auto-apply activity across users
- Applications by company
- Recent run history with success/failure counts
- Opted-in user count

---

## Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Greenhouse API requires auth for submissions | Pivoted to Playwright browser automation |
| Career pages exceed Playwright's token limit | Created `extract-job-links.ts` to parse saved snapshots |
| Inline Python scripts trigger security prompts | Banned inline scripts in skill; use only pre-built TypeScript helpers |
| Same job could be applied to twice | Triple-layer dedup: company+title check, URL-based ID, database constraint |
| Different roles need different resumes | Keyword-based resume matching with no fallback (skip if no match) |
| Custom ATS questions vary per job | Question matcher with text patterns + profile field mapping |
| Country name variations (USA vs United States) | Alias mapping in question matcher |
| Salary questions need nuanced handling | Rules engine: vague when possible, high end when numeric required |

---

## What Makes This Different

Most auto-apply tools are either:
- **API-only** (limited to one ATS, need auth keys)
- **Generic** (one resume for everything, template answers)

This system is:
- **Browser-based** — works on any career page, any ATS, any form
- **Resume-aware** — picks the right resume for each role
- **Answer-aware** — tailored responses per role type, adapted per company
- **Tracked** — every application recorded in a database with full history
- **Deduped** — won't apply to the same job twice
- **Extensible** — add companies by editing a JSON file, add resumes by dropping a PDF

---

## Tech Stack

- **Claude Code** — orchestrator, reads pages, fills forms, makes decisions
- **Playwright MCP** — browser automation (navigate, click, type, upload)
- **Next.js 14** — web UI for profile management and application tracking
- **Prisma + SQLite/Turso** — database for jobs, applications, user profiles
- **TypeScript** — all helper scripts
- **Vercel** — hosting, cron jobs for daily scraping
