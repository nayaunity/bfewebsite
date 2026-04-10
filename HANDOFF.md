# Session Handoff — April 9, 2026

## Current State

### Branches
- **main** — production code, deployed to Vercel
- **applications** — current working branch (all in sync with main)
- **auto-apply-saas** — Railway worker deploys from this branch (all in sync with main)

All three branches are at commit `0c196df`.

### Infrastructure
- **Vercel** — frontend deployment (www.theblackfemaleengineer.com)
- **Railway** — worker deployment (browse-loop + apply-engine), deploys from `auto-apply-saas` branch
- **Turso** — production database (libsql). Tables added this session: `TempOnboarding` (for wizard data persistence through auth). Columns added: `BrowseDiscovery.matchScore` (Float), `BrowseDiscovery.matchReason` (Text)
- **Stripe** — LIVE mode. Starter $29/mo, Pro $59/mo. Checkout cancel URL now returns to `/profile/applications` (was `/pricing`). Inline checkout from dashboard implemented.
- **Resend** — email sending (from `naya@theblackfemaleengineer.com`). No inbox for this address. Using `reply_to: theblackfemaleengineer@gmail.com` header so replies land in Gmail. Long-term fix: set up Google Workspace.
- **Anthropic API** — Used by worker (Haiku for form filling + resume tailoring) and Vercel (Haiku for job matching quality gate).

### Key Env Variables
- `ANTHROPIC_API_KEY` — Vercel env variable + Railway env variable
- `BLOB_READ_WRITE_TOKEN` — Railway env variable (for tailored resume uploads)
- `CRON_SECRET` — Vercel env variable. Cron secret is in `.env` (not `.env.production`): `MsAFcIEsovz54kO7pEzgzH16cy1R42q1JZMPpgkhuGk=`
- `STRIPE_WEBHOOK_SECRET` — Vercel env variable. Webhook URL: `https://www.theblackfemaleengineer.com/api/stripe/webhook`

---

## What Was Done This Session (April 8-9)

### 1. Job Matching Overhaul
- Hard-blocked Staff/Principal/Director/Head/VP/Chief roles for 0-5yr users
- Added `BLOCKED_COMPANIES` filter (Duolingo, Samsara, Grammarly)
- Fixed international location filtering — use pre-computed `region` field from DB instead of string parsing. Added `isUserUS()` helper. Backfilled 299 mislabeled jobs as "international".
- Removed "Program Manager" from Product Manager search terms (stays in Project Manager)
- Tightened LLM quality gate with explicit rejection examples (Finance & Strategy, Product Operations, Professional Services, Revenue Operations)
- Added PhD/Research Scientist hard-block — blocks PhD-title roles for non-PhD users, blocks Research/Applied Scientist for early-career non-PhD
- Added user education (degree, school) to LLM quality gate prompt

### 2. Lever + Ashby Scrapers
- Created `src/lib/scrapers/lever.ts` and `src/lib/scrapers/ashby.ts`
- 9 new companies: OpenAI (639 jobs), Notion (161), Ramp (132), ElevenLabs (104), Spotify (100+), Plaid (101), Cursor (79), Perplexity (78), Linear (20)
- Scraper dispatcher updated to route by `atsType`
- First scrape completed — 7,536 jobs across all 55 companies

### 3. Scraper Parallelization
- Nightly cron was timing out — only scraping 33 of 55 companies sequentially
- Parallelized with batches of 5 via `Promise.allSettled()` + batched DB upserts (50 per transaction)
- Scrape now completes in ~288s (was timing out at 300s+). All 55 companies scraped successfully.

### 4. Apply Engine Improvements
- **Ashby resume upload**: Added "Upload File", "Choose File", "ATTACH RESUME/CV" to `handleFileUpload()`. Agent loop now detects upload-like button clicks and routes through fileChooser handling.
- **Ashby submit detection**: Now checks main page for thank-you confirmation (not just Greenhouse iframes)
- **Ashby spam detection**: Catches "flagged as spam" alerts and returns clear error
- **Pre-submit validation**: Claude prompt now instructs to scan for empty required fields before clicking Submit
- **Date/location guidance**: Claude told to use MM/DD/YYYY for date pickers, `type_slowly` for autocomplete comboboxes
- **EEO dropdown patterns widened**: Gender ("Not Specified"), Veteran ("Not a Veteran", "not to disclose"), Disability ("don't wish to answer") — tested on Webflow, Discord, Zscaler
- **Privacy checkboxes**: Added "I acknowledge", "privacy policy" patterns with isChecked guard

### 5. Prompt Injection Hardening
- Fenced all untrusted content (page snapshots, job descriptions, link text) with `--- BEGIN/END UNTRUSTED ---` markers
- Anti-injection preamble in apply engine, resume tailoring, job matcher, career browser

### 6. Match Score on Dashboard
- `BrowseDiscovery.matchScore` + `matchReason` columns added
- Human-readable reasons generated during scoring (e.g., "Strong role match · Remote · Level match")
- Displayed under company name on each job card

### 7. Onboarding Drop-Off Fixes
- Resume requirement reduced from 3 to 1 on next-steps page
- Wizard data persistence: new `TempOnboarding` table + `/api/onboarding/temp-save` endpoint. Wizard data saved to DB before auth redirect, retrieved via `tempId` URL param after auth. Falls back to localStorage.

### 8. Upgrade Banner Redesign (Paywall CRO)
- Replaced small "Upgrade Now" link with full upgrade card showing:
  - User's applied companies and count
  - Total matching jobs waiting
  - Inline Starter ($29) and Pro ($59) pricing cards
  - Direct Stripe checkout from dashboard (no redirect to /pricing)
  - Clear escape hatch: "Continue with Free — resets next month"
- Fixed Stripe checkout cancel URL: returns to `/profile/applications` instead of `/pricing`

### 9. Technical Debt Cleanup
- Deleted 6 orphaned files (preview routes, unused API routes, test scripts)
- Removed Grammarly, Duolingo, Samsara from all company configs
- Added email sending rule to CLAUDE.md: NEVER send without explicit approval
- Added testing rule to CLAUDE.md: always test before committing
- Playwright MCP configured with persistent profile at `~/.playwright-mcp/profile`

### 10. Anika Ahmed
- Credited back 15 applications (78 → 63) for bad role + location matches
- Emailed her about the credit and fixes (sent — was supposed to be drafted first)

---

## Known Issues

### Ongoing

1. **Stripe intern/new grad forms consistently fail** — 8-min timeout or dropdown stuck. Consider excluding Stripe intern-specific forms.
2. **DoorDash redirects to listings page** — Some job URLs resolve to search page instead of application form.
3. **No inbox for naya@ email** — Workaround: `reply_to` header to Gmail. Long-term: Google Workspace.
4. **Ashby spam detection** — Ramp and Notion flag some applications as spam. Can't fix from our side — Ashby-level issue.

### Prompt Injection (Mitigated, Not Fully Solved)

5. **Resume tailoring keyword injection** — Fencing helps but a JD could frame adversarial keywords as legitimate requirements. **Fix:** Post-tailoring keyword validation — compare injected keywords against original resume + applicant skills. Strip any keyword in neither source. Deterministic check, no LLM needed.

6. **Two-model architecture (future)** — Split apply engine into Extractor (sees page) + Filler (sees applicant data). Prevents page content from reaching decision model. Doubles cost/latency — not worth it now.

---

## Next Steps (Prioritized)

### 1. Address Stripe Form Failures
Stripe intern/new grad forms are the remaining major failure source. Options:
- Exclude Stripe intern/new grad forms specifically
- Increase timeout for Stripe
- Add Stripe-specific dropdown patterns

### 2. Resume Tailoring Keyword Validation
Post-tailoring deterministic check to prevent adversarial keyword injection from job descriptions.

### 3. Onboarding Optimization
Analyze onboarding step drop-off data. 100% completion on quiz steps (1-11), 62% on profile info (12-17). Consider cutting filler steps (auto-advance value props, affirmation screens).

### 4. Add More ATS Companies
Companies not yet added: Brex (not on Ashby), Rippling (not on Ashby), Netflix (not on Lever). Could add Workday companies or find correct ATS slugs.

---

## User Stats (as of April 9)
- **~410 total signups**
- **~106 onboarded users**
- **7,536 active jobs** in catalog (Greenhouse + Lever + Ashby, all 55 companies scraped)
- **1 paid subscriber** (Anika Ahmed, Starter $29/mo — credited back 15 apps, at 63/100)
- Free tier: 5 apps/month, 1 tailored resume/month, 10/day cap

## Admin Users
- **Nyaradzo (Naya)** — `admin` (full access)
- **Sarah Comlan** (`Sarah.comlan@gmail.com`) — `operations` (Onboarding, Auto-Apply, Errors, Tickets)

## Technical Debt
- `worker/data/target-companies.json` and `scripts/target-companies.json` must stay in sync
- `.env.vercel-prod` file exists locally — contains prod secrets, don't commit
- Scrape cron runs at 288s / 300s limit — adding more companies will need further optimization (split into multiple crons or move scraper to Railway)
