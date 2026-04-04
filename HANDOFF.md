# Session Handoff — April 4, 2026

## Current State

### Branches
- **main** — production code, deployed to Vercel
- **applications** — current working branch (in sync with main)
- **auto-apply-saas** — Railway worker deploys from this branch. **Needs sync with latest main.**
- **profile** — old branch, can be deleted

### Infrastructure
- **Vercel** — frontend deployment (theblackfemaleengineer.com)
- **Railway** — worker deployment (browse-loop + apply-engine), deploys from `auto-apply-saas` branch
- **Turso** — production database (libsql)
- **Stripe** — LIVE mode. Starter $29/mo, Pro $59/mo
- **Resend** — email sending (magic links, transactional, application notifications)

---

## CRITICAL UNRESOLVED BUG: Auth Page Slow (13+ seconds)

### The Problem
The unified sign-in page (`/auth/signin`) takes **13+ seconds** after clicking "Continue" (email check step) before showing the password screen. This happens consistently for the user in both regular and incognito browsers.

### The Flow
1. User enters email → clicks "Continue"
2. Frontend POSTs to `/api/auth/check-email` to determine: new user / magic link user / has password
3. Based on response, shows the right next step (create account / set password / sign in)
4. **Step 2 is where the 13-second delay happens**

### What Was Tried (None Fixed It)
1. **Non-www → www redirect issue** — Discovered that `theblackfemaleengineer.com` 307-redirects to `www`, which could lose POST body. Added `src/middleware.ts` to redirect non-www → www at the Next.js level with a 301. **Didn't fix it.**

2. **Hardcoded absolute www URL** — Changed all fetch calls to POST directly to `https://www.theblackfemaleengineer.com/api/...` to skip redirects. **Created CORS issues instead (cross-origin from non-www to www).**

3. **Prefetch on typing** — Added background prefetch that fires 300ms after user stops typing, plus a warmup request on page load. If cached result exists, Continue uses it instantly. **Still 13+ seconds for the user.**

4. **Direct curl test** — API responds in **248ms cold, 342ms warm** from the command line. The server is fast. The delay is client-side.

### What Hasn't Been Tried
- **The delay might be Vercel's edge middleware** — The new `src/middleware.ts` runs on EVERY request (matcher: `/((?!_next/static|_next/image|favicon.ico).*)`) which could add latency on the edge before the function even starts.
- **Double redirect** — Vercel's built-in non-www redirect (307) + our middleware redirect (301) might be creating a redirect loop or double-hop.
- **Remove middleware entirely** — Go back to relative URLs and just let the 307 happen. The POST body IS preserved on 307 redirects per spec. The real issue might be something else entirely.
- **Edge runtime** — Move `/api/auth/check-email` to `export const runtime = "edge"` for near-zero cold starts.
- **Browser DevTools** — Need user to check Network tab to see actual request timing breakdown (DNS, TCP, SSL, TTFB, download).

### Key Files
- `src/middleware.ts` — Non-www → www redirect (may be causing issues)
- `src/app/auth/signin/page.tsx` — Unified auth form with prefetch logic
- `src/app/api/auth/check-email/route.ts` — Email status check endpoint
- `src/app/api/auth/signup/route.ts` — Account creation / password setting
- `src/app/api/auth/login/route.ts` — Created but unused (was going to be single-step login)

---

## What Was Done This Session

### Centralized Job Catalog
- **5,799 jobs scraped** from 40 companies via Greenhouse API, stored in `Job` table with `source: "auto-apply"`
- Full HTML descriptions, locations, tags stored per job
- `description` column added to Job model
- Grammarly removed (404), **Stripe removed** (too many form failures — iframe/verification issues)
- 494 Stripe jobs deactivated in DB
- 7-day TTL for auto-apply catalog jobs

### Automated Job Matching
- `src/lib/auto-apply/job-matcher.ts` — scores by role (50%), location/remote (30%), seniority (20%)
- Hard filters: foreign jobs excluded for US users, intern/new-grad filtered by experience
- Matches 3x more jobs than needed so failures don't waste user's app count
- Worker moves to next job on failure, stops when enough successful applications submitted

### Fast Path Worker
- `matchedJobs` field on BrowseSession — worker skips all discovery and applies directly to pre-matched URLs
- No Greenhouse API calls, no catalog queries, no Claude matching — just apply

### Cron Schedule (vercel.json, deployed)
- **3:00am MT** (9:00 UTC) — Scrape job catalog
- **3:10am MT** (9:10 UTC) — Public job board scraper
- **3:30am MT** (9:30 UTC) — Match users to jobs, create FAST sessions
- Legacy auto-apply cron removed
- **Crons ARE running** — confirmed scrape-autoapply ran at 9:03 UTC. daily-apply ran but found 0 users because it required `subscriptionStatus: 'active'`. **Fixed** — now includes all users regardless of tier.

### Live Test Results — 24 Successful Applications
| User | Applied | Companies |
|------|---------|-----------|
| Carly | 5 | DoorDash |
| Kendall | 5 | DoorDash, Anthropic |
| Zaki | 5 | Stripe |
| Jake | 4 | DoorDash |
| Heather | 2 | Zscaler |
| Nyaradzo | 1 | Zscaler |
| Damarcus | 1 | Stripe |
| Brittany | 1 | Anthropic |
| Joseph, Chidinma, Sarah, Langston | 0 | All Stripe — all failed |

### Notification Emails Sent
- 8 emails sent via Resend to users who got applications through
- From: `noreply@theblackfemaleengineer.com`, reply-to: `theblackfemaleengineer@gmail.com`
- Sign-off: "Talk soon, Naya"

### Applications Dashboard UI
- Manual company selection removed
- "Apply While You Sleep" section with usage bar + upgrade CTA
- **"Start Applying Now" button** — on-demand auto-apply via `/api/auto-apply/start`
- Failed applications hidden from users
- Today's Auto-Apply live feed

### Unified Auth Flow
- Single entry at `/auth/signin` — email first, then right next step
- `/auth/signup` redirects to `/auth/signin`
- `/api/auth/check-email` — checks email state (new / magic link / has password)
- **BUG: 13-second delay on this check — see above**

### Signup Changes
- Name fields removed from signup (collected during onboarding)
- API accepts email + password only, names optional

---

## User Stats
- **265 total users** (all free tier)
- **18** complete profiles (ready for matching)
- **24 applications** submitted this session
- **8 notification emails** sent

## DB Schema Changes This Session
- `Job.description` — TEXT column (full HTML job description)
- `BrowseSession.matchedJobs` — TEXT column (JSON array of pre-matched jobs for fast path)

## Files Created This Session
- `src/middleware.ts` — Non-www redirect (may need removal)
- `src/data/auto-apply-companies.json` — 40 companies for catalog scraper
- `src/lib/auto-apply/job-matcher.ts` — Job matching engine
- `src/app/api/cron/scrape-autoapply/route.ts` — Catalog scraper cron
- `src/app/api/cron/daily-apply/route.ts` — Automated daily apply cron
- `src/app/api/auto-apply/start/route.ts` — On-demand apply trigger
- `src/app/api/auth/check-email/route.ts` — Email status check
- `src/app/api/auth/login/route.ts` — Created but unused

## Technical Debt
- `worker/data/target-companies.json` and `scripts/target-companies.json` must stay in sync
- `auto-apply-saas` branch needs sync with main (last synced before auth changes)
- Dead code: `src/components/BrowseApplyForm.tsx`, `src/components/profile/ResumesSection.tsx`
- `src/app/api/auth/login/route.ts` — unused, can be deleted
- `src/app/api/cron/auto-apply/route.ts` — legacy, removed from vercel.json but file exists
