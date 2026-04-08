# Session Handoff — April 8, 2026 (Early Morning)

## Current State

### Branches
- **main** — production code, deployed to Vercel
- **applications** — current working branch (job matching fix not yet committed/deployed)
- **auto-apply-saas** — Railway worker deploys from this branch (needs the matching fix merged too)

### Infrastructure
- **Vercel** — frontend deployment (www.theblackfemaleengineer.com)
- **Railway** — worker deployment (browse-loop + apply-engine), deploys from `auto-apply-saas` branch
- **Turso** — production database (libsql)
- **Stripe** — LIVE mode. Starter $29/mo, Pro $59/mo. Webhook fixed (was 307 redirecting, now points to www)
- **Resend** — email sending (from `naya@theblackfemaleengineer.com`). No inbox for this address. Using `reply_to: theblackfemaleengineer@gmail.com` header so replies land in Gmail. Long-term fix: set up Google Workspace.
- **Anthropic API** — Used by worker (Haiku for form filling + resume tailoring) and Vercel (Haiku for job matching quality gate). Switched from Sonnet to Haiku for form filling to cut costs ~10x.

### Key Env Variables
- `ANTHROPIC_API_KEY` — Vercel env variable + Railway env variable
- `BLOB_READ_WRITE_TOKEN` — Railway env variable (for tailored resume uploads)
- `CRON_SECRET` — Vercel env variable
- `STRIPE_WEBHOOK_SECRET` — Vercel env variable. Webhook URL: `https://www.theblackfemaleengineer.com/api/stripe/webhook`

---

## What Was Done This Session

### 1. Anika Ahmed Consumer Profile & Resume Overhaul

Anika Ahmed is our first paying user (Starter $29/mo). Investigated her full profile, onboarding data, and platform activity.

**Resume rewrite**: Her original resume framed her as a "Salesforce Business Analyst." Rewrote it as a PM resume — new summary, PM-framed titles, outcome-focused bullets, restructured skills section, CSPO promoted. Initially uploaded without metrics, then Anika completed the resume quiz and we updated with her real numbers: 4,000+ users, 90% agent accuracy, 5 LLMs benchmarked, 13 pipeline deals, 40% onboarding reduction, 5 integrated systems, 12-person team, 30+ releases. Final resume uploaded as `Anika.Ahmed.ProductManager.pdf` (naming convention: `first.last.[ROLE]`).

**Resume quiz**: Built a 10-question conversational quiz at `/profile/resume-quiz` to collect the specific metrics needed for her resume (team size, user count, release cadence, etc.). Quiz saves answers to `applicationAnswers.resumeQuiz` JSON field. CTA banner on her applications dashboard (scoped to her email only). Admin page at `/admin/resume-quiz` to view submitted responses. Emailed Anika prompting her to complete it.

**Targeted PM applications**: Queried 121 location-fit PM jobs for her profile. Created a browse session with 20 best-fit roles across Stripe, Twilio, Affirm, Scale AI, Attentive, and Marqeta. All using the new PM base resume with per-application tailoring. Session ran successfully — confirmed tailored resumes generated for each application (unique PDFs in blob storage). Emailed Anika with her new resume PDF link, application update, and asked what drove her to subscribe.

**Emails sent to Anika this session:**
1. Resume quiz prompt (asking her to complete the 10 questions)
2. Resume ready + application update + subscriber feedback ask (with reply-to set to Gmail)

**Files created:**
- `src/app/profile/resume-quiz/page.tsx` + `ResumeQuiz.tsx` — quiz page
- `src/app/api/profile/resume-quiz/route.ts` — quiz API
- `src/app/admin/resume-quiz/page.tsx` — admin view
- `src/app/preview/dashboard/page.tsx` + `src/app/preview/resume-quiz/page.tsx` — auth-free dev previews (delete before deploy)

**Files modified:**
- `src/app/profile/applications/ApplicationsDashboard.tsx` — added `showResumeQuiz` prop with yellow CTA
- `src/app/profile/applications/page.tsx` — gates CTA to `anika.ahmed04@gmail.com`
- `src/app/admin/components/AdminSidebar.tsx` — added Resume Quiz nav item

### 2. Job Matching Tightened (Code Changed, NOT Yet Deployed to Worker)

Investigated new users' application results and found widespread bad matching: entry-level frontend users getting Senior Staff roles, DevOps users getting PM roles, etc.

**4 fixes applied locally:**

1. **LLM quality gate prompt** (`src/lib/auto-apply/job-matcher.ts`): Replaced "Be generous with role matching" with strict rules and explicit NO examples
2. **Fallback trap removed** (`src/lib/auto-apply/job-matcher.ts`): If LLM approves 0 jobs, returns empty array instead of all candidates
3. **Word-boundary matching** (`worker/src/career-browser.ts`): Both `discoverJobsFromCatalog` and `discoverViaGreenhouseAPI` now use `\b` regex instead of `.includes()`
4. **Claude link analysis** (`worker/src/career-browser.ts`): Changed "Match broadly" to "Match precisely" with exclusion examples

**Status: Changes are on `applications` branch but NOT committed/deployed.** The Vercel deploy only covers fix 1 and 2. Fixes 3 and 4 are in the worker code which deploys from `auto-apply-saas` via Railway. Need to commit, merge to both main and auto-apply-saas, push, and redeploy Railway.

### 3. User Credit-Backs for Bad Matches

Ran the new LLM quality gate against all recent users' applied jobs to identify bad matches. Found 33 bad applications across 16 users. Decremented their `monthlyAppCount` accordingly. Emailed all 16 users explaining the issue, the fix, and the credit-back.

### 4. New User Investigation (57 users since yesterday afternoon)

Detailed walkthrough of every engaged user's experience with the tool. Key findings documented below in Known Issues.

---

## Known Issues

### Critical

1. **Anthropic API credits ran out** — Caused 100% failure rate for ~7 users during the outage window. 100+ applications failed with "credit balance too low." Credits have been restored but need monitoring.

2. **Job matching still allows seniority mismatches for entry-level users** — The seniority filter gives Senior/Staff roles a score of 0.1 for 0-2 year users but never hard-blocks them (-1). With only 49 entry-level SWE jobs in the catalog vs 1,100+ Senior/Staff jobs, Senior roles dominate the candidate pool by volume. The 0.18 score difference is not enough to keep them out.

3. **Entry-level job supply is critically low** — Only 49 entry-level SWE jobs (33 intern, 14 new grad, 2 junior) out of 1,957 total SWE jobs (2.5%). Many entry-level users have almost nothing appropriate to apply to. Expanding catalog via Lever + Ashby APIs (see Next Steps) would help significantly.

### Ongoing

4. **Figma dropdown failures** — "page state unchanged" on experience/sponsorship dropdowns. Affects nearly every user hitting Figma forms.
5. **Stripe forms timeout at 8 min** — Intern/New Grad/PhD forms consistently fail.
6. **Duolingo requires ATS login** — 100% failure on all Duolingo jobs. Should be excluded.
7. **DoorDash redirects to listings page** — Some job URLs resolve to search page instead of application form.
8. **Discord forms — Haiku gets stuck in agent loop** — Deterministic handler fills dropdowns correctly, but Claude agent loop gets stuck after.
9. **Samsara forms consistently fail** — Empty iframes, form not loading. Consider excluding.
10. **No inbox for naya@ email** — `naya@theblackfemaleengineer.com` can send but not receive. Workaround: `reply_to` header set to Gmail. Long-term: set up Google Workspace.

---

## Next Steps (Prioritized)

### 1. Deploy Job Matching Fixes to Worker (Urgent)
The 4 matching fixes are applied locally but not deployed to Railway. Need to:
- Commit changes on `applications`
- Push and merge to `main` + `auto-apply-saas`
- Redeploy Railway worker

### 2. Harden Seniority Filter for Entry-Level Users
Currently Staff/Principal/Director roles pass with score 0.1 for 0-year users. Should hard-block (`-1`) Staff, Principal, Director, and Head roles for users with 0-2 years experience.

### 3. Expand Job Catalog — Lever + Ashby Scraping (Medium)
The catalog is 95% Greenhouse. Adding Lever and Ashby would dramatically increase entry-level supply.

**Lever API:** `https://api.lever.co/v0/postings/{company}?limit=100`
**Ashby API:** `https://api.ashbyhq.com/posting-api/job-board/{company}`

**Companies to add:**
- **Ashby**: Notion, Linear, Vercel, Ramp, Brex, Plaid, Rippling, Scale AI, Perplexity, Cursor, OpenAI, ElevenLabs
- **Lever**: Netflix, others

### 4. Match Score on Dashboard (Small)
Show users why each job was matched with a 1-5 score and one-line reason. Schema change needed on `BrowseDiscovery`.

### 5. Exclude Broken ATS Companies
- Duolingo (requires login)
- Samsara (empty iframes)
- Grammarly (job board deactivated)

### 6. Onboarding Optimization
Once step tracking has enough data, analyze drop-off points and cut/merge low-value steps (currently 25).

---

## User Stats (as of April 8 morning)
- **~380 total signups** (57 new since yesterday afternoon)
- **~85 onboarded users**
- **6,186 active jobs** in catalog (all Greenhouse, source: auto-apply)
- **1 paid subscriber** (Anika Ahmed, Starter $29/mo) — completed resume quiz, new PM resume uploaded, 20 targeted PM apps sent, awaiting her reply on what drove subscription
- **49 entry-level SWE jobs** in catalog (2.5% of SWE jobs) — critical supply gap for intern/new grad users
- Free tier: 5 apps/month, 1 tailored resume/month, 10/day cap
- **16 users credited back** 33 applications due to bad matching (emails sent)

## Admin Users
- **Nyaradzo (Naya)** — `admin` (full access)
- **Sarah Comlan** (`Sarah.comlan@gmail.com`) — `operations` (Onboarding, Auto-Apply, Errors, Tickets)

## Technical Debt
- `src/app/preview/dashboard/page.tsx` and `src/app/preview/resume-quiz/page.tsx` — auth-free dev preview routes, delete before production cleanup
- `src/components/BrowseApplyForm.tsx` — orphaned, unused
- `src/app/api/auth/login/route.ts` — unused
- `src/app/api/cron/auto-apply/route.ts` — legacy, removed from vercel.json but file exists
- `worker/data/target-companies.json` and `scripts/target-companies.json` must stay in sync
- `.env.vercel-prod` file exists locally — contains prod secrets, don't commit. Anthropic API key in this file has a trailing `\n` character that causes auth failures if used raw.
- `worker/src/test-quick.ts` — temporary test script, can be deleted
- Grammarly entry in `worker/src/test-companies.ts` — job board is dead, remove
