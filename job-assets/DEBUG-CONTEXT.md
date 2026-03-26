# Auto-Apply Debug Context — March 25, 2026

## System Overview

The auto-apply SaaS lets users select a target role + companies, then a Railway worker browses career pages with Playwright and applies to matching jobs automatically.

**Architecture:**
1. User clicks "Start Applying" on website → creates `BrowseSession` in Turso DB
2. Railway worker polls for sessions every 30s
3. Worker uses Playwright + stealth context to browse career pages
4. Claude Haiku identifies matching jobs from page links (replaces old regex matching)
5. Claude Haiku drives the apply process — analyzes each page snapshot and decides next action (click, fill, upload, etc.)
6. Results stored in `BrowseDiscovery` table, shown in real-time on frontend

**Branch:** `auto-apply-saas` (merged to `main` and deployed)

## Current Status: Job Discovery Works, Application Submission Fails

### What Works
- BrowseSession creation + polling ✅
- Stealth browser context (random UAs, patched navigator.webdriver, anti-detection launch args) ✅
- Career page loading with `networkidle` for SPAs ✅
- Claude Haiku job discovery — sends all page links to Claude, gets back matching jobs with clean titles ✅
- Meta: finds 9 matching jobs (AI Production Engineer, Business Engineer, Research Engineer, etc.) ✅
- Microsoft: finds 32 matching jobs ✅
- Frontend shows real-time progress, debug logs, per-job error details ✅
- Stuck detection (bail after 4 same-URL actions instead of looping 12 times) ✅
- Subscription tier enforcement (Starter: 50 apps/month) ✅
- Stripe checkout works (webhook was fixed earlier in session) ✅

### What Fails: Application Submission (THE MAIN ISSUE)

All discovered jobs fail at the **apply step**. The Claude agent loop navigates to the job page and reaches the application form, but **can't interact with form elements**.

**Error pattern for Meta (all 9 jobs):**
```
Stuck: page not changing after multiple actions | Steps: Step 5: analyzing page →
Claude: fill — Country field is empty and must be filled before proceeding
```

**Error pattern for Microsoft (all 32 jobs):**
```
Stuck: page not changing after multiple actions
```

Claude correctly identifies what needs to happen ("fill First name", "fill Country", "upload resume") but the Playwright actions don't change the page state.

### Root Cause Analysis

The apply engine (`worker/src/apply-engine.ts`) uses a Claude agent loop:
1. Take page snapshot (visible text + interactive elements with real CSS selectors)
2. Send to Claude Haiku → get next action (click/fill/upload/check/select/done/error)
3. Execute action via Playwright with 5 fallback strategies
4. Repeat until done or stuck (max 12 steps, bail after 4 same-URL)

**The problem is at step 3 — executing the action.** Despite having 5 fallback strategies for `fill()`:
1. Standard `page.fill(selector, value)`
2. Click → Ctrl+A → `keyboard.type()` character by character
3. Locator click → type
4. `getByLabel()` → type
5. JavaScript direct value set + event dispatch

...all 5 fail on Meta's React form components. The page snapshot now includes real CSS selectors extracted from the DOM (id, name, aria-label, placeholder, nth-of-type), and Claude is instructed to use them exactly. But the interactions still don't work.

**Possible reasons:**
- Meta's inputs are custom React components with synthetic event handling — standard DOM events may not trigger React state updates
- The form might require React-specific event dispatching (e.g., `ReactDOM.findDOMNode` or `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set`)
- The application form might require Meta authentication (cookies/session) that the headless browser doesn't have
- The form might be inside a Shadow DOM or web component boundary
- Playwright's headless mode on Railway might be missing something that headed mode provides

**Debugging approach that hasn't been tried yet:**
- Run `cd worker && npm run browse` locally with `HEADLESS=false` to see the browser visually and inspect what's happening
- Take a screenshot at each step and inspect the actual DOM in a real browser
- Try the React-specific value setter: `Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value)` followed by `input.dispatchEvent(new Event('input', { bubbles: true }))`

## Key Files

| File | Purpose |
|------|---------|
| `worker/src/apply-engine.ts` | **THE FILE TO FIX** — Claude agent loop + form interaction with 5 fallback strategies |
| `worker/src/career-browser.ts` | Job discovery using Claude Haiku (works well) |
| `worker/src/browse-loop.ts` | Session orchestration (polls DB, iterates companies, applies to each job) |
| `worker/src/browse-worker.ts` | Standalone local worker entry point (`npm run browse`) |
| `worker/src/index.ts` | Railway worker main (polls ApplyQueue + BrowseSession) |
| `worker/src/db.ts` | Turso database operations |
| `src/components/BrowseApplyForm.tsx` | Frontend UI (role selector, company checklist, real-time progress) |
| `src/app/api/auto-apply/browse/route.ts` | API: create browse session |
| `src/app/api/auto-apply/browse/[sessionId]/route.ts` | API: poll session progress |
| `src/lib/resume-matcher.ts` | Resume matching (legacy fallback + single resume fallback) |
| `scripts/target-companies.json` | 20 company career page URLs |
| `worker/data/target-companies.json` | Copy for Docker build context |
| `prisma/schema.prisma` | BrowseSession + BrowseDiscovery models |
| `job-assets/application-answers.json` | Pre-filled application answers by role |

## Earlier Fixes Completed in This Session

1. **Hydration error** — Fixed `formatDate` timezone mismatch (added `timeZone: "UTC"`)
2. **Resume upload** — Fixed disabled file input blocking clicks in ResumeManager
3. **Stripe webhook** — Fixed silent `break` → now logs and returns 400
4. **Resume matcher** — Added legacy resumeUrl fallback + single-resume fallback
5. **ApplicationsDashboard** — Fixed summary field names, updated confirm dialog text
6. **User subscription** — Manually updated to Starter tier (webhook fired before fix was deployed)
7. **Target role UI** — Changed from text input to 4 selectable role cards
8. **Cloudflare detection** — Stealth context + 10s wait for challenges
9. **Job discovery** — Replaced regex matching with Claude Haiku API calls
10. **Page loading** — Switched to `networkidle` for SPA rendering

## Infrastructure

- **Vercel** — hosts Next.js app (deployed via `vercel --prod`)
- **Turso** — production database (libsql), shared between Vercel and Railway
- **Stripe** — subscription billing (test mode, user on Starter tier)
- **Railway** — hosts Playwright worker ("bfewebsite" service in "angelic-endurance" project)
- **Vercel Blob** — stores uploaded resume PDFs
- **Anthropic API** — Claude Haiku for job matching and apply agent loop

## Environment Variables

**Railway:** `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `ANTHROPIC_API_KEY`
**Vercel:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `BLOB_READ_WRITE_TOKEN`, plus DB vars
**Local worker (.env):** `DATABASE_URL`, `DATABASE_AUTH_TOKEN` (from .env.production)

## Useful Commands

**Clear stuck sessions:**
```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
npx tsx -e "
import { createClient } from '@libsql/client';
const db = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN });
await db.execute('UPDATE BrowseSession SET status = \"failed\", errorMessage = \"Cleared\", completedAt = datetime(\"now\") WHERE status IN (\"queued\", \"processing\")');
console.log('Cleared');
"
```

**Run worker locally (visible browser):**
```bash
cd worker && npm run browse
```

**Deploy:** `vercel --prod` (Vercel) — Railway auto-deploys from `main` push
