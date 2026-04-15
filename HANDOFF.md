# Session Handoff — April 14–16, 2026

## Current State

### Branches
- **main** — production code, deployed to Vercel. Head: `d9a90f8` (apply-engine-fixes merged).
- **apply-engine-fixes** — most recent feature branch, 6 commits, merged to main + auto-apply-saas on Apr 15. Kept around for reference.
- **auto-apply-saas** — Railway worker deploys from this branch. Head: `d9a90f8`.
- **resume-builder** — the resume builder feature (not yet deployed). Head: `6e0fe3a`.
- **applications** — prior working branch, at `b43d7ac` (behind main — has the Airbnb→Anthropic pinned job swap).

### Infrastructure
- **Vercel** — frontend (www.theblackfemaleengineer.com). Latest prod deploy: `bfewebsite-g52ig8x0j` (Apr 15, apply-engine-fixes).
- **Railway** — worker (browse-loop + apply-engine). **Now runs xvfb-wrapped headed Chromium**, not headless. Dockerfile installs `tini` + `xvfb` + full Chromium binary. Memory budget ~+300MB, well within 8GB.
- **Turso** — production database. Tables added across recent sessions: `AdminAlert`, `ScrapeRun`, `CompanyCooldown`, `StuckField`, `IntegrationRun`. New columns on `User`: `resumeBuilderUsed`, `workLocations`. Pushed via raw SQL (Prisma CLI can't push to Turso directly).
- **Browserbase** — account created Apr 15 (free tier). Project ID `ef5472ad-c1fd-4d03-a3dc-23af1c7e1247`. API key pasted in chat → **TREAT AS COMPROMISED, ROTATE**. Free-tier A/B showed zero lift — see §11.
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
- `USE_BROWSERBASE` — Railway only, unset by default. Flip to `true` to route Playwright through Browserbase CDP. **Currently unset** — free-tier A/B showed zero Ashby lift.
- `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` — Railway only. Not yet set in Railway env (would need to be if `USE_BROWSERBASE` flipped).
- `BROWSERBASE_USE_PROXIES` — Railway only. `true` enables residential proxies (paid tier). Unset/false for free tier.
- `BROWSERBASE_ROLLOUT_PCT` — Railway only. `0-100` hashes `userId` mod 100; enables BB for that % of sessions. For cohort A/B.
- `DRY_RUN` — When `true`, applyToJob fills the form but stops before submit. Used by the integration suite only.

---

## What Was Done This Session (April 15–16)

### 11. Apply engine fixes — Phase 1+2+4 shipped, Browserbase A/B run
**Motivated by:** Two user investigations (Habeebat Adeyemo, Morin Fagbodun) showed the cohort-wide failure pattern concretely. Baseline re-measured: **28.2% overall, 41.4% Greenhouse, 0.4% Ashby (2/492).** OpenAI alone: 228 attempts, 0 applies in 30d.

**Shipped to prod Apr 15:**
- **City/workLocations onboarding fix.** `src/components/OnboardingSync.tsx:61` was writing the wizard's preferred-work-city to `User.city` (residence). Added new `User.workLocations` JSON column. `scripts/repair-city-location.ts` ran on prod: **85 users backfilled, 29 had corrupted residence city cleared** (e.g., city=SF, state=Indiana).
- **URL pattern exclusion.** New `EXCLUDED_URL_PATTERNS` in `src/lib/auto-apply/job-matcher.ts` with `isUrlExcluded()` helper. Seeded with Stripe intern/new-grad regex. New read-only admin page `/admin/apply-exclusions` shows active patterns + zero-success-in-30d company candidates.
- **Common gates library.** `worker/src/common-gates.ts` — `fillCommonGates`, `ashbyIdentityFill`, `leverIdentityFill`. Pre-pass runs BEFORE the Claude loop for non-Greenhouse paths. Handles work-auth, sponsorship, in-office acknowledgements, cert checkboxes, pronouns, race/veteran/disability decline, state of residence, previously-applied. Silent no-op on fields that aren't on the page. Unit-tested via vitest + Playwright fixtures (6 tests, ~1.5s runtime).
- **Stuck-cascade bailout.** `apply-engine.ts` — if `skippedFields.length >= 3`, return `stuck-field-cascade` early rather than burning 25 more Claude steps on a structurally broken form.
- **Browserbase wire-up.** `getBrowser()` at `worker/src/apply-engine.ts:182` swaps to `chromium.connectOverCDP(session.connectUrl)` when `USE_BROWSERBASE=true`. Session lifecycle: new BB session per `processNextBrowseSession()`, closed after. `browse-loop.ts:119` has a `BROWSERBASE_ROLLOUT_PCT` env-gated userId-hash A/B flag.
- **DRY_RUN mode.** Three submit points in `apply-engine.ts` honor `DRY_RUN=true` — fill everything, stop before the final submit click. Used only by the integration suite so test runs don't pollute real applicant history.
- **Testing infrastructure.** `worker/test/common-gates.test.ts` (fixture suite). `worker/test/integration/real-urls.ts` + `url-catalog.json` (30 curated URLs balanced across known-success / stuck-Greenhouse / spam-Ashby buckets). `scripts/canary.ts` reads latest `IntegrationRun` and exits non-zero below threshold. `/admin/integration-runs` dashboard.
- **Seeded test user** for integration suite: `1d16e543-db6e-497b-b78b-28fbf0a30626`, role=`test`, cloned from `theblackfemaleengineer@gmail.com`'s profile. Email `integration-test@apply.theblackfemaleengineer.com`.

**A/B results (Apr 15, local runs — dry-run mode, 30 URLs each):**

| | **Without Browserbase** | **With Browserbase (free tier, no proxies)** |
|---|---|---|
| Overall | 18/30 (60%) | 18/30 (60%) |
| Known-success bucket | 9/10 | 9/10 (same Linear Ashby loss) |
| Stuck-Greenhouse bucket | 8/10 | 8/10 |
| Spam-Ashby bucket | 0/10 | 0/10 |
| Wall-clock | 30.8 min | 48.0 min (+56% from BB session overhead) |

**Key insights from the A/B:**
1. **Phase 2 deterministic handlers alone lift Greenhouse from 41% → 90%.** Stuck-bucket URLs (Zscaler, Cloudflare x4, GitLab, Twilio, Anthropic) that previously all failed are now passing. This is a real, shipped lift — users are already getting it.
2. **Browserbase free tier is worthless for our problem.** Zero lift on Ashby, +56% latency. Don't enable.
3. **The Ashby fix lives in residential proxies, not Browserbase itself.** Paid Browserbase with `BROWSERBASE_USE_PROXIES=true` is the path. Scale tier = $99/mo. Without residential IPs, Ashby flags the submit in ~18s whether we're on Railway IPs or BB's datacenter IPs.

**Still failing (confirmed not fixable in code):**
- All 10 Ashby URLs: Ramp (1), OpenAI (9). Fast-fail (12-20s) at submit = reCAPTCHA Enterprise / IP-reputation rejection. Residential IPs required.
- Pinterest Greenhouse URL (fast-fail ~12-25s) — likely login/404, not stuck.
- Linear Ashby — was our one historical Ashby success; now failing the same way as the rest.

---

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

### Greenhouse react-select — RESOLVED (pending prod measurement)
Phase 2 `common-gates.ts` + the existing `greenhouseDeterministicFill` together now clear 90% of Greenhouse URLs in the integration suite (18/20). Deployed to prod Apr 15; measure the 48h baseline shift before declaring done.

### Ashby spam-flag — NOT FIXED IN CODE
Cooldown still mitigates cascading failures. The submit-time flag itself requires residential IPs. Our free-tier Browserbase A/B (Apr 15) confirmed: datacenter IPs (ours or BB's) both fail Ashby in 12-20s. **Only paid Browserbase with `BROWSERBASE_USE_PROXIES=true` will move this.** Currently 0.4% Ashby success rate persists until paid BB is enabled.

### Stripe intern/new grad forms — MITIGATED
`EXCLUDED_URL_PATTERNS` in `job-matcher.ts` now skips Stripe intern/new-grad/university URLs before the worker ever sees them. Previous 88 failures become 0 once prod data catches up.

### Onboarding 68% drop-off — NOT INVESTIGATED
27 of 40 weekend signups bounced before entering first name. Unchanged from prior session. Needs diagnostic instrumentation.

### Manual jobs older than 60 days — NOT FIXED
304 inactive manual jobs from before the restore script's cutoff date. Unchanged.

### City/workLocations bug — RESOLVED
`OnboardingSync.tsx` was writing wizard work-preference cities to the residence `city` field. Fixed + migrated 85 affected users Apr 15.

---

## Next Steps (Prioritized)

### 1. Decide on paid Browserbase ($99/mo Scale tier for residential proxies) — HIGHEST PRIORITY
Greenhouse is now 90% (up from 41%). Ashby remains 0%. Ashby is ~25% of daily apply traffic — moving it from 0% to even 30% lifts overall success another ~8pp. Only paid BB proxies move this. Decision point:
- **Yes, upgrade**: set `BROWSERBASE_API_KEY` / `BROWSERBASE_PROJECT_ID` / `BROWSERBASE_USE_PROXIES=true` on Railway, set `BROWSERBASE_ROLLOUT_PCT=20` for a 72h cohort A/B. If Ashby lifts to 30%+, cut over. Cost: $99/mo.
- **No**: accept current state. Expect overall success ~50% steady-state.

### 2. Wire up the nightly integration-suite cron (OPTIONAL, wait 48h)
Early-warning smoke alarm. Every night at 3 AM MT, run `worker/test/integration/real-urls.ts` with `DRY_RUN=true` against the 30-URL catalog, write an `IntegrationRun` row, alert if pass rate drops >10pp vs the prior night. Railway cron service (~$2-4/mo).

**Why wait 48h**: the Apr 15 deploy just shifted the baseline; the nightly suite needs a stable baseline to regress against. Wiring it tonight creates noisy signal. Implementation plan when we're ready:
- Create `worker/src/cron-integration.ts` that wraps `real-urls.ts` + alert-on-regression comparison query.
- Add Railway cron service (separate deploy target, same codebase, different start command).
- Env vars: same DB creds, `INTEGRATION_TEST_USER_ID=1d16e543-db6e-497b-b78b-28fbf0a30626`, `INTEGRATION_KIND=nightly`, `DRY_RUN=true`. Do NOT set `USE_BROWSERBASE=true` on the nightly (free tier = no lift, burns session minutes).
- Doc in CLAUDE.md: rotate 5 URLs in `url-catalog.json` monthly since job postings close.
- ~30 min of impl work.

### 3. Rotate the Browserbase API key — URGENT
Key was pasted in chat. Rotate in Browserbase dashboard → Settings → API Keys. Store new value only in Railway env.

### 4. Onboarding drop-off investigation (independent of #1)
Unchanged from prior. Instrument post-email-verification path with `PagePresenceTracker`. Identify which URL the weekend ghosts last loaded.

### 5. International user handling
Unchanged. 4 of 13 weekend onboarded users are international (Nigeria, Ghana, UK, Kenya). Matcher hard-rejects US jobs for them. Either gate at signup OR add international-first ATS support.

### 6. Per-ATS deterministic adapters (lower priority now)
`common-gates.ts` covered most of the value. Expanding to per-field ATS adapters (Workday, SmartRecruiters) is diminishing returns until we have data showing those ATSes matter.

### 7. Resume tailoring keyword validation
Unchanged. Post-tailoring deterministic check. Compare injected keywords against original resume + applicant skills. Strip any not in either source.

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

## User Stats (as of Apr 15 evening)
- **~450 total signups** (estimated)
- **~119 onboarded users** (the autoApplyEnabled backfill list)
- **~8,800 active jobs** in catalog (Greenhouse + Lever + Ashby, scoped cleanup keeps the number stable)
- **2 paid subscribers** — Anika Ahmed ($29/mo Starter), Brian McLaren ($14.50/mo discounted Starter)
- **Cohort success rate (pre-Phase 2): 28.2%** (561 applied / 1,988 attempts, last 14 days). Post-deploy measurement window: Apr 15 evening + 48h.
- **Per-ATS (pre-deploy):** Greenhouse 41.4%, Ashby 0.4% (2/492), Lever 0%, Other 29.4%.
- **Integration-suite current (dry-run):** 60% overall, Greenhouse 90%, Ashby 0%, stuck-bucket 80%.
- **Brian's quota**: 20/100 used this month (Starter tier)

## Admin Users
- **Nyaradzo (Naya)** — `admin` (full access)
- **Sarah Comlan** (`Sarah.comlan@gmail.com`) — `operations`

## Admin Pages
- `/admin` — main dashboard, shows AdminAlert red banner at top
- `/admin/scrape-runs` — last 7 days of scrape executions, status, durations, jobs saved/deactivated
- `/admin/stuck-fields` — top failure clusters across users in the last 7 days
- `/admin/alerts/[id]/resolve` — POST endpoint, "Mark resolved" button on alerts
- `/admin/apply-exclusions` (Apr 15) — URL patterns currently excluded by the matcher + zero-success-in-30d company candidates
- `/admin/integration-runs` (Apr 15) — last 7 days of nightly/canary/ad-hoc integration suite runs, per-URL breakdown of the most recent run

## Diagnostic Resources
- Worker startup log: search Railway deploy logs for `"event":"browser_binary"` to verify Chromium binary path + `headlessEnv` + `display`
- Worker egress IP: search for `"event":"egress_ip"`
- Failure screenshots: every stuck/timeout failure uploads a full-page PNG to Vercel Blob, URL embedded in `BrowseDiscovery.errorMessage` after `snapshot:`
- One-off scripts: `scripts/apply-for-user.ts <userId>` for admin re-queue, `scripts/refund-credit-failures.ts` for credit refunds, `scripts/restore-manual-jobs.ts` for manual-job restore, `scripts/repair-city-location.ts` for onboarding residence corruption, `scripts/seed-integration-test-user.ts <referenceUserId>` to refresh the integration test user, `scripts/canary.ts` for post-deploy canary check
- Integration test user: `1d16e543-db6e-497b-b78b-28fbf0a30626` (role=`test`, email `integration-test@apply.theblackfemaleengineer.com`)
- Integration suite: `cd worker && npm test` (fixture) + `npm run test:integration` (real URLs, requires env vars — see `worker/test/integration/real-urls.ts` header)

## Technical Debt
- `worker/data/target-companies.json` and `scripts/target-companies.json` must stay in sync
- `.env.vercel-prod` file exists locally — contains prod secrets, don't commit
- Per-app timeout 12 min × max 25 agent steps × 2 concurrent sessions can saturate Railway memory if Browserbase isn't adopted
- The xvfb wrapper means worker must be killed via tini for clean shutdown — verify Railway's SIGTERM handling on next deploy
- `rebrowser-playwright` skipped because it tops out at v1.52 and we're on v1.58 to match Docker base. Revisit if rebrowser catches up.
