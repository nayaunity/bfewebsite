# Session Handoff — April 14–15, 2026

## Current State

### Branches
- **main** — production code, deployed to Vercel
- **applications** — current working branch (all in sync with main)
- **auto-apply-saas** — Railway worker deploys from this branch (all in sync with main)

All three branches are at commit `6ae2219` (Phase 2 xvfb headed Chromium).

### Infrastructure
- **Vercel** — frontend (www.theblackfemaleengineer.com). Latest prod deploy: `bfewebsite-nl8kefnkg`.
- **Railway** — worker (browse-loop + apply-engine). **Now runs xvfb-wrapped headed Chromium**, not headless. Dockerfile installs `tini` + `xvfb` + full Chromium binary. Memory budget ~+300MB, well within 8GB.
- **Turso** — production database. **New tables this session**: `AdminAlert`, `ScrapeRun`, `CompanyCooldown`, `StuckField`. Pushed via raw SQL (Prisma CLI can't push to Turso directly).
- **Stripe** — LIVE mode. Starter $29/mo, Pro $59/mo. **Discounted Starter $14.50** also live (conversion email coupon). Subscriptions now reliably activate via webhook + sync-by-session fallback.
- **Resend** — same as before, no inbox for naya@.
- **Anthropic API** — Now has preflight credit-balance probe before every apply session (no more silent quota burn during outages).

### Key Env Variables
- `ANTHROPIC_API_KEY` — Vercel + Railway. **Auto-reload should be enabled** (root cause of the Apr 3/7/11 outages).
- `BLOB_READ_WRITE_TOKEN` — Railway (also used for failure-screenshot uploads now).
- `CRON_SECRET` — Vercel only. Value: `MsAFcIEsovz54kO7pEzgzH16cy1R42q1JZMPpgkhuGk=`
- `STRIPE_WEBHOOK_SECRET` — Vercel.
- `ALERT_SECRET` — Vercel + Railway, same value `CcUdDGb8IUPwH3TSncQLgnjsEmTQRREhm+uNnctL7/k=`. Worker → Next.js alert hand-off.
- `ALERT_ENDPOINT_URL` — Railway only: `https://www.theblackfemaleengineer.com/api/alerts/credit-exhausted`
- `HEADLESS=false` — Railway only, set by Dockerfile. Worker launches headed Chromium under xvfb.

---

## What Was Done This Session (April 13–14)

### 1. Stripe webhook silent-failure fix (Brian + Anika)
Both paid subscribers were stuck on `subscriptionTier: free` because `checkout.session.completed` webhook silently failed. Real root cause: Stripe SDK API version `2026-02-25.clover` moved `current_period_end` off the subscription root onto its item — webhook was writing `null`/`NaN`. Plus the conversion-email flow's `/profile?subscription=success` redirect dropped the query string when unauthenticated users got bounced to signin, breaking the StripeSync fallback.

- New `activateSubscription()` + `tierFromPriceId()` helpers in `src/lib/subscription.ts` — single source of truth, reads `current_period_end` from both root and item.
- New `/api/stripe/sync-by-session?session_id=...` — unauthenticated fallback.
- New `/subscription/success` page — landing page for conversion-email users that runs sync server-side.
- New `/api/admin/stripe/reconcile` — lists Stripe↔DB drift, `?fix=1` repairs.
- `invoice.payment_succeeded` handler added (catch-all for renewals).
- **Brian + Anika manually restored** to Starter active.

### 2. Daily scrape pipeline overhaul
The nightly cron was silently losing data: `scrapeAllCompanies` had unscoped 24h-deactivation cleanup that wiped admin-added manual jobs (856 of 859 manual jobs were inactive when this session started) and any company that didn't fully scrape. Plus zero observability — no way to tell if a cron actually ran.

- Scoped cleanup: capture `runStartTime`, track `successfulSlugs[]`, only deactivate jobs in scraped companies, exclude `source: "manual"` permanently.
- Parallelized `scrapeAllCompanies` into batch-of-5 (was sequential).
- Per-company 45s timeout via `withTimeout` helper.
- New `ScrapeRun` table — every cron writes one row with status/duration/companies/jobs.
- New admin page `/admin/scrape-runs` with last-7-days table + red banner if last run >30h old.
- Self-heal: each cron auto-closes prior `running` rows >15min old.
- **552 manual jobs restored** via `scripts/restore-manual-jobs.ts` (one-off).
- Verified end-to-end: latest run was 55/55 companies, 7,535 saved, 167 deactivated, status=success.

### 3. Anthropic credit guardrails + retroactive refund
**268 apply attempts** over 10 days (Apr 3, 7, 11) failed with "credit balance is too low" because the API key ran out 3 separate times. Every failure burned the user's monthly quota.

- Worker preflight: 1-token Anthropic probe before opening Playwright. If credits exhausted, mark session `paused` (new status), no `BrowseDiscovery` rows created, no quota charged.
- Per-job defense in depth: catches mid-session credit errors, marks discovery `skipped` (not `failed`), pauses session, fires alert.
- New `AdminAlert` table + 1-hour dedup. Worker POSTs to `/api/alerts/credit-exhausted` with shared `ALERT_SECRET`.
- Admin dashboard banner shows unresolved alerts at the top of `/admin`.
- `scripts/refund-credit-failures.ts` ran with `--apply`: **80 quota units restored across 22 users**. 268 discoveries relabeled from `failed` → `skipped` with `[refunded — API outage]` prefix.

### 4. autoApplyEnabled regression fix
**119 users** completed onboarding without `autoApplyEnabled` ever being set to true. Bug went back to at least Apr 1. Onboarding completion handler `/api/profile/onboarding/route.ts` was setting `onboardingCompletedAt` but never the auto-apply flag.

- Fix: `/api/profile/onboarding/route.ts` now sets `autoApplyEnabled: true` alongside `onboardingCompletedAt`.
- Defense in depth: `src/components/OnboardingSync.tsx` PATCH also includes the flag.
- **Backfill executed**: 119 users updated, 0 remaining with onboarding-complete-but-flag-off.

### 5. Apply engine investigation — Greenhouse react-select on Railway
The biggest user-visible problem. Multi-day investigation, multiple deploys, did NOT reach a clean win.

**Diagnostic findings:**
- Cohort success rate: **29.8%** (551 applied / 1,852 attempts in 14 days, across 89 distinct users)
- 53% of failures are form-interaction (stuck-page, dropdown unresponsive, max-steps, timeout)
- 57% of failures hit Greenhouse, 34% hit Ashby
- Local Playwright tests pass; Railway Playwright fails on the same code + same URL
- Page renders normally on Railway (screenshots prove no anti-bot block)
- Issue is Linux Chromium event-pipeline differences from macOS

**Code changes deployed (all live on Railway):**
- `selectStaticDropdown` rewritten with primary keyboard pattern (focus → type → wait for menu → click option) instead of toggle clicks. This is the pattern `react-select-event` uses internally.
- `combobox.evaluate(el => el.focus())` instead of `combobox.focus()` — bypasses Playwright actionability waits.
- `findOption` does exact → starts-with-word-boundary → fuzzy → frame-wide (fixed "United States" → "United States Minor Outlying Islands" bug).
- 6 toggle-click strategies as fallback (S1 wrapper-locked, S2 following, S3 self, S4 ancestor, S5 mouse-coords, S6 dispatchEvent).
- `force: true` final fallback that skips stable + receives-events checks.
- `channel: 'chromium'` to opt out of `chromium-headless-shell` (default since Playwright 1.49).
- Full Chromium binary installed via Dockerfile `npx playwright install chromium`. Verified loaded on Railway: `isHeadlessShell: false`, executable at `/ms-playwright/chromium-1208/chrome-linux64/`.
- CSS animation killer via `addStyleTag` after every navigation. Plus `emulateMedia({ reducedMotion: 'reduce' })`.
- Additional launch flags: `--disable-gpu`, `--disable-software-rasterizer`, `--disable-renderer-backgrounding`, `--disable-background-timer-throttling`, `--force-color-profile=srgb`.
- Per-app timeout bumped 8 → 12 min.
- Partial step trace recovered on timeout (was discarded by Promise.race).
- Failure screenshots uploaded to Vercel Blob, URL stored in `BrowseDiscovery.errorMessage`.
- **Phase 2 xvfb headed mode** — Dockerfile installs xvfb, runs node under `xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24 -noreset"`. `HEADLESS=false` env. tini for signal handling.

**Verification result (Apr 14 22:20 MDT, 4-job cross-ATS batch with xvfb live):**
- Chime — failed at 12 min, BUT keyboard pattern is now opening dropdowns (`S2 following-toggle ok` appears for the first time). Stuck on the OPTION click, not the toggle.
- LaunchDarkly — same as before (all 6 strategies time out)
- Pinterest — different failure: stuck on Resume/CV "Attach" button, file picker doesn't trigger
- Perplexity — clean skip via cooldown (anti-bot system working as designed, no quota burn)

**Net: 0/4 applied, but two real improvements** (Chime opens dropdowns now; Perplexity skip is correct behavior). The remaining gap is react-select's brief stable-window not being hit reliably even with xvfb. **In-code fixes are exhausted.** Next decision below.

### 6. Anti-bot company cooldown
- New `CompanyCooldown` table, 24h cooldown set on Ashby spam-flag detection.
- Subsequent queued jobs at the same company short-circuit with `status="skipped"` (no quota charge) instead of each one burning a failed apply.
- Verified working on OpenAI (1 spam flag → 24h cooldown → next OpenAI job auto-skipped) and Perplexity.

### 7. StuckField telemetry + admin page
- New `StuckField` table — every categorized failure (could-not-open-dropdown, stuck-page, max-steps, timeout, spam-flag, other) writes a row.
- Admin page `/admin/stuck-fields` ranks top (company, failureType) pairs over the last 7 days.
- Currently populated; will sharpen the next-fix priority list within a few days of organic traffic.

### 8. Friendly user-facing error labels
- `src/app/profile/applications/ApplicationsDashboard.tsx` — translates raw error text into user-friendly labels: "Form didn't respond", "Company blocked our submission, retrying later", "Briefly paused — service has resumed", etc.
- Skipped statuses now render in muted gray (not red) so cooldown-skipped jobs don't look like failures.

### 9. Onboarding diagnostic (NOT fixed yet)
Weekend cohort audit (Apr 10 onwards):
- **40 signups, 13 completed onboarding (33%), 0 paid conversions**
- **27 of 40 (68%) verified email but never even entered their first name** — `firstName/lastName` are still null on their User row
- 100% email verification rate, then massive bounce
- Drop happens between email verification and step 1 of the wizard
- HANDOFF was previously claiming 100% completion on quiz steps; this weekend disproves that

This is the single biggest funnel leak. Not yet investigated; recommended as the next major work item (see Next Steps).

### 10. Brian (specific user) work
- Walked Brian's setup as Starter ($14.50 discounted) end-to-end after his Stripe webhook failure
- Manually fixed his account, then built the systemic fix
- New script `scripts/apply-for-user.ts` that mirrors `/api/auto-apply/start` for any single user (admin one-off). Used heavily for diagnostics. Deduplication updated to allow re-queueing failed URLs (only excludes currently `applied` or `applying`).

---

## Known Issues

### Apply engine on Railway — UNRESOLVED
**Greenhouse react-select forms still fail at ~70% rate on Railway** despite all code-level fixes shipped this session. Confirmed not Cloudflare-CDN-specific (also affects Chime, LaunchDarkly, Pinterest). Confirmed not headless-shell (`isHeadlessShell: false` in startup logs). Even Phase 2 xvfb only partially helped.

Next decision is between:
- **Free path**: accept current state, focus on bigger leverage (onboarding 68% drop-off)
- **Paid path**: Browserbase (~$40/mo). Connects via `chromium.connectOverCDP(BROWSERBASE_URL)`, one-line worker change. Real Chrome on residential IPs, designed for exactly this problem. Free trial available.

### Ashby spam-flag (mitigated but not solved)
Anti-bot rejects ~10% of Ashby submissions. Cooldown system stops cascading failures (one spam flag → company cooldown → other queued jobs at that company auto-skip). Permanent fix needs residential IP — also solved by Browserbase.

### Onboarding 68% drop-off
27 of 40 weekend signups bounced before entering first name. Need diagnostic instrumentation on the post-verification redirect path before we can fix.

### Stripe intern/new grad forms
Still 88 cohort failures, all 8-min timeouts. Could exclude these specific URLs by pattern.

### Manual jobs older than 60 days
304 inactive manual jobs from before the restore script's cutoff date. Not restored automatically — would need admin review.

---

## Next Steps (Prioritized)

### 1. Decision: pay for Browserbase OR move to onboarding (HIGHEST PRIORITY)
The auto-apply infrastructure is at a fork. Either:
- **A.** Sign up for Browserbase free tier, wire it up (1 hour), verify it fixes Greenhouse + Ashby, commit ~$40/mo. Brings success rate from 30% → likely 60-80%.
- **B.** Accept current 30% rate, redirect effort to onboarding drop-off (68% leak — bigger absolute impact than any apply-side fix).
- **C.** Both in parallel. Recommended by Claude this session.

### 2. Onboarding drop-off investigation (independent of #1)
Instrument the post-email-verification path with `PagePresenceTracker`. Identify which URL the 27 weekend ghosts last loaded. Either fix the redirect (bug) or simplify the first onboarding step (UX).

### 3. International user handling
4 of 13 weekend onboarded users are international (Nigeria, Ghana, UK, Kenya). Matcher hard-rejects US jobs for them. Either gate them out at signup OR add international-first ATS support.

### 4. Stripe intern/new-grad URL exclusion
88 cohort failures all on Stripe forms with 8-min timeouts. Exclude by URL pattern in the matcher.

### 5. Per-ATS deterministic adapters
Currently we use Claude for every form action. Per-ATS adapters for Greenhouse/Ashby/Lever/Workday with hard-coded selectors for `firstName`, `email`, `linkedinUrl`, `resumeUpload` etc. would cut AI round-trips 60-80% and solve the 25-step cap problem at root. Multi-day refactor.

### 6. Resume tailoring keyword validation
Post-tailoring deterministic check. Compare injected keywords against original resume + applicant skills. Strip any keyword not in either source. Carryover from previous handoff.

---

## User Stats (as of Apr 14 evening)
- **~450 total signups** (estimated)
- **~119 onboarded users** (the autoApplyEnabled backfill list)
- **~8,800 active jobs** in catalog (Greenhouse + Lever + Ashby, scoped cleanup keeps the number stable)
- **2 paid subscribers** — Anika Ahmed ($29/mo Starter), Brian McLaren ($14.50/mo discounted Starter)
- **Cohort success rate: 29.8%** (551 applied / 1,852 attempts, last 14 days, 89 distinct users)
- **Brian's quota**: 20/100 used this month (Starter tier)

## Admin Users
- **Nyaradzo (Naya)** — `admin` (full access)
- **Sarah Comlan** (`Sarah.comlan@gmail.com`) — `operations`

## Admin Pages (new this session)
- `/admin` — main dashboard, now shows AdminAlert red banner at top
- `/admin/scrape-runs` — last 7 days of scrape executions, status, durations, jobs saved/deactivated
- `/admin/stuck-fields` — top failure clusters across users in the last 7 days
- `/admin/alerts/[id]/resolve` — POST endpoint, "Mark resolved" button on alerts

## Diagnostic Resources
- Worker startup log: search Railway deploy logs for `"event":"browser_binary"` to verify Chromium binary path + `headlessEnv` + `display`
- Worker egress IP: search for `"event":"egress_ip"`
- Failure screenshots: every stuck/timeout failure uploads a full-page PNG to Vercel Blob, URL embedded in `BrowseDiscovery.errorMessage` after `snapshot:`
- One-off scripts: `scripts/apply-for-user.ts <userId>` for admin re-queue, `scripts/refund-credit-failures.ts` for credit refunds, `scripts/restore-manual-jobs.ts` for manual-job restore

## Technical Debt
- `worker/data/target-companies.json` and `scripts/target-companies.json` must stay in sync
- `.env.vercel-prod` file exists locally — contains prod secrets, don't commit
- Per-app timeout 12 min × max 25 agent steps × 2 concurrent sessions can saturate Railway memory if Browserbase isn't adopted
- The xvfb wrapper means worker must be killed via tini for clean shutdown — verify Railway's SIGTERM handling on next deploy
- `rebrowser-playwright` skipped because it tops out at v1.52 and we're on v1.58 to match Docker base. Revisit if rebrowser catches up.
