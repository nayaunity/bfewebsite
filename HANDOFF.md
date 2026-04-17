# Session Handoff — April 14–17, 2026

## Current State

### Branches
- **main** — production code, deployed to Vercel. Head: `6014245` (daily report date filter fix).
- **seven-day-trial** — current working branch (Apr 17). Implements the freemium-to-trial switch (see section 16). Not yet merged or deployed.
- **cap-conversion-drip** — prior working branch. All commits merged to main.
- **auto-apply-saas** — Railway worker deploys from this branch. Head: `f7edd9a` (fast-forwarded to main on Apr 16).
- **apply-engine-fixes** — feature branch from Apr 15, 6 commits. Kept around for reference.
- **resume-builder** — the resume builder feature (not yet deployed). Head: `6e0fe3a`.
- **applications** — prior working branch, at `b43d7ac` (behind main).

### Infrastructure
- **Vercel** — frontend (www.theblackfemaleengineer.com). Latest prod deploy: `bfewebsite-2qae4egz1` (Apr 16, daily report fix).
- **Railway** — worker (browse-loop + apply-engine). **Now runs xvfb-wrapped headed Chromium**, not headless. Dockerfile installs `tini` + `xvfb` + full Chromium binary. Memory budget ~+300MB, well within 8GB.
- **Turso** — production database. Tables added across recent sessions: `AdminAlert`, `ScrapeRun`, `CompanyCooldown`, `StuckField`, `IntegrationRun`, `CapConversionDigest`. New columns on `User`: `resumeBuilderUsed`, `workLocations`, `conversionEmailSentAt`. Pushed via raw SQL (Prisma CLI can't push to Turso directly).
- **Browserbase** — account created Apr 15 (free tier). Project ID `ef5472ad-c1fd-4d03-a3dc-23af1c7e1247`. API key pasted in chat -> **TREAT AS COMPROMISED, ROTATE**. Free-tier A/B showed zero lift -- see section 11.
- **Stripe** — LIVE mode. Starter $29/mo, Pro $59/mo. **Starter now ships with a 7-day free trial** via `subscription_data.trial_period_days: 7` on Checkout, set in `/api/stripe/checkout` (only when `tier === "starter"`; Pro has no trial). Card collected up front, $0 today, auto-charges day 8 unless cancel. Coupon `STARTER50` and per-user `CAP_<userid>_*` coupons still exist for the legacy cap-conversion drip path through `/api/stripe/convert`.
- **Resend** — same as before, no inbox for naya@.
- **Anthropic API** — Now has preflight credit-balance probe before every apply session (no more silent quota burn during outages).

### Cron Schedule (Vercel)
| Schedule (UTC) | Time (MT) | Endpoint | Purpose |
|---|---|---|---|
| `0 9 * * *` | 3:00am | `/api/cron/scrape-autoapply` | Scrape auto-apply jobs |
| `10 9 * * *` | 3:10am | `/api/cron/scrape-jobs` | Scrape job boards |
| `30 9 * * *` | 3:30am | `/api/cron/daily-apply` | Match jobs + queue sessions |
| `0 13 * * *` | 7:00am | `/api/cron/cap-conversion-digest` | Cap-hit conversion email digest |
| `30 13 * * *` | 7:30am | `/api/cron/paying-user-report` | Daily paying-user experience report |
| `0 14 * * *` | 8:00am | `/api/cron/free-tier-sunset-warning` | 3-day heads-up email for free users about to hit the trial-or-pay wall |

### Key Env Variables
- `ANTHROPIC_API_KEY` — Vercel + Railway. **Auto-reload should be enabled** (root cause of the Apr 3/7/11 outages).
- `BLOB_READ_WRITE_TOKEN` — Railway (also used for failure-screenshot uploads now).
- `CRON_SECRET` — Vercel only. Value: `MsAFcIEsovz54kO7pEzgzH16cy1R42q1JZMPpgkhuGk=`
- `STRIPE_WEBHOOK_SECRET` — Vercel.
- `ALERT_SECRET` — Vercel + Railway, same value `CcUdDGb8IUPwH3TSncQLgnjsEmTQRREhm+uNnctL7/k=`. Worker -> Next.js alert hand-off.
- `ALERT_ENDPOINT_URL` — Railway only: `https://www.theblackfemaleengineer.com/api/alerts/credit-exhausted`
- `HEADLESS=false` — Railway only, set by Dockerfile. Worker launches headed Chromium under xvfb.
- `USE_BROWSERBASE` — Railway only, unset by default. Flip to `true` to route Playwright through Browserbase CDP. **Currently unset** -- free-tier A/B showed zero Ashby lift.
- `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` — Railway only. Not yet set in Railway env (would need to be if `USE_BROWSERBASE` flipped).
- `BROWSERBASE_USE_PROXIES` — Railway only. `true` enables residential proxies (paid tier). Unset/false for free tier.
- `BROWSERBASE_ROLLOUT_PCT` — Railway only. `0-100` hashes `userId` mod 100; enables BB for that % of sessions. For cohort A/B.
- `DRY_RUN` — When `true`, applyToJob fills the form but stops before submit. Used by the integration suite only.

---

## What Was Done This Session (April 15-17)

### 16. Freemium -> 7-Day Free Trial (Apr 17, branch `seven-day-trial`, NOT YET DEPLOYED)
**Motivated by:** ~450 signups, ~119 onboarded, only 4 paying. The permanent 5-app free tier was training users to expect free indefinitely and wasting the highest-intent moment (right after onboarding). Switched to a card-required Stripe trial to lift trial-to-paid conversion toward the 30-50% range typical of card-required SaaS trials.

**Decisions locked with Naya:**
- Card required up front via Stripe `trial_period_days: 7`. Stripe auto-charges $29 on day 8 unless canceled.
- Trial gives Starter tier (100 apps/mo). Pro upsell happens later in-app.
- Existing free users finish their current month at the 5-app cap, then hit a hard "trial-or-pay" wall on their next monthly reset. Per-user heads-up email 3 days before each user's individual reset.

**Schema (Prisma + Turso ALTER):**
- `User.freeTierEndsAt DateTime?` - moment a free user gets blocked. NULL means "no wall yet" (back-compat for legacy rows during migration window).
- `User.freeTierSunsetEmailAt DateTime?` - dedup for the 3-day heads-up email.

**Apply gate:**
- `src/lib/subscription.ts canApply()` returns `{ allowed: false, reason: "trial-required" }` when `tier === "free" && freeTierEndsAt <= now`. Wall takes precedence over the monthly cap.
- `src/app/api/auto-apply/browse/route.ts` surfaces the trial-required error string.
- `worker/src/browse-loop.ts` mirrors the gate: free users past the wall get logged and skipped before any apply attempt.

**Stripe:**
- `src/app/api/stripe/checkout/route.ts` adds `subscription_data: { trial_period_days: 7 }` and `payment_method_collection: "always"` for `tier === "starter"`. Pro keeps direct subscribe. The existing `customer.subscription.updated` webhook handles the `trialing -> active` transition with no code change (writes `subscriptionStatus = subscription.status`).

**New signups:**
- `src/app/api/auth/signup/route.ts` and `src/lib/auth.ts` `createUser` event both set `freeTierEndsAt = now` so the wall is on immediately for every new account.

**Existing-user sunset:**
- New `src/lib/free-tier-sunset.ts` builds the per-user 3-day warning email draft.
- New cron `/api/cron/free-tier-sunset-warning` (daily 8am MT, `0 14 * * *` UTC) finds users where `freeTierEndsAt` is within 3 days, sends the email, stamps `freeTierSunsetEmailAt`.
- `src/lib/cap-conversion.ts findCapConversionCandidates()` skips users within 7 days of the wall (or who already got the sunset email) to avoid sending the cap-conversion + sunset emails back to back.

**UI:**
- New `src/components/TrialRequiredBanner.tsx` - amber "ends in N days" or red "tier ended" banner with "Start 7-day trial" button (POSTs to `/api/stripe/checkout`).
- Mounted on `src/app/profile/applications/ApplicationsDashboard.tsx` and `src/app/profile/page.tsx` (only when `tier === "free" && freeTierEndsAt` set).
- Deep link `/profile/applications?startTrial=1` auto-fires the trial checkout via a one-shot useEffect in `ApplicationsDashboard`. Strips the param after firing.
- `src/app/auto-apply/next-steps/NextStepsClient.tsx` - the post-onboarding "Plan Awareness Card" replaced with a single "Start 7-day trial" CTA.
- `src/app/pricing/page.tsx` + `PricingCards.tsx` - dropped Free tier card entirely. Starter is the headline trial card. Logged-out CTA bounces through `/auth/signin?callbackUrl=/profile/applications?startTrial=1`. New "How does the 7-day free trial work?" FAQ.
- `src/components/UsageMeter.tsx` - removed free-tier-specific copy paths (free users now see TrialRequiredBanner instead). Starter -> Pro upsell at 80%+ retained.

**Backfill (NOT YET RUN ON TURSO):**
- `scripts/backfill-free-tier-ends-at.ts` - one-time, dry-run-by-default. Sets `freeTierEndsAt = first day of calendar month following monthlyAppResetAt` for every free-tier user. Skips admins/contributors/test, and any user with `currentPeriodEnd` in the future.

**Verification done locally:**
- `npm run build` passes (route map shows `/api/cron/free-tier-sunset-warning`).
- Worker `tsc --noEmit` passes.
- Pricing page rendered visually, free tier card gone, Starter shows "7-day free trial, $0 today", FAQ updated.
- Apply-gate logic spot-checked against two seeded test users (warning + blocked states), correct behavior.

**Remaining manual steps before deploy (Naya's call):**
1. Run Turso ALTER for `freeTierEndsAt` and `freeTierSunsetEmailAt` columns.
2. Dry-run `scripts/backfill-free-tier-ends-at.ts` against Turso, review counts, then `--apply`.
3. Visually review the sunset email draft (Naya wants to see it before the cron fires).
4. End-to-end Stripe trial flow with a test-mode card before flipping to LIVE.
5. Deploy. Cron auto-registers from `vercel.json`.

### 13. Cap-Conversion Email Drip (Apr 16)
**Motivated by:** 5 users hit the 5-app free cap after the original conversion email went out. Manual identification + send was tedious. Naya wanted it automated with approval.

**Shipped:**
- **Conversion email skill** (`.claude/skills/conversion-email-cap/SKILL.md`) -- documents the full manual flow: identify capped users, build personalized drafts (firstName normalization, top-2 applied companies, 3 role-matched jobs with 4-pass fallback), test-send, live-send. Includes pre-send verification checklist and coupon lifecycle docs.
- **Automated daily drip:**
  - `src/lib/cap-conversion.ts` -- shared draft builder + candidate finder + per-user Stripe coupon creator.
  - `/api/cron/cap-conversion-digest` (daily 7am MT) -- finds users whose 5th applied BrowseDiscovery was in the last 24h, creates a `CapConversionDigest` row with 24h-expiry token, emails Naya a summary with "Preview & approve" link.
  - `/admin/cap-conversion/[token]` -- admin-gated approval page renders full HTML preview of each draft. "Send all N" button creates a fresh per-user 72h Stripe coupon (`CAP_<userid>_<timestamp>`, `max_redemptions: 1`), sends via Resend, marks `User.conversionEmailSentAt` for permanent dedup.
  - `/api/admin/cap-conversion/send` -- idempotent send endpoint, admin-authed.
  - Schema: `User.conversionEmailSentAt DateTime?`, `CapConversionDigest` table.
- **Manual send of 5 late-upgrade emails** (sharayu699, samayo.dev, rranjan07th, msadiknur, adepitandavid) via `scripts/send-late-upgrade-email.ts`. All 5 backfilled with `conversionEmailSentAt`.
- **Expired coupon fix:** `crczQBPX` expired Apr 13. Created `STARTER50` (50% off, once, 72h, max 100). Updated script + skill.
- **CTA above the fold:** Restructured email layout -- hook + price + button first, role list below.

**Key file:** `scripts/send-late-upgrade-email.ts` -- standalone script for ad-hoc manual sends. Uses the same template + job-matching logic.

### 14. Daily Paying-User Experience Report (Apr 16)
**Motivated by:** Naya was manually investigating each paying user's sessions. Wanted a morning email summarizing everything.

**Shipped:**
- `src/lib/paying-user-report.ts` -- queries last 24h sessions for starter/pro users, compiles per-user breakdown with every company applied to, failures, stuck fields, flags.
- `/api/cron/paying-user-report` (daily 7:30am MT) -- builds report, emails to theblackfemaleengineer@gmail.com.
- Report sections: Overview (totals, success rate), User Detail (per-user with every applied/failed company+title), Top Failure Companies, Top Stuck Fields, Flags (zero-success users, session errors, approaching cap).
- **BrowseDiscovery datetime bug:** `createdAt` stored in non-ISO format (`"2026-04-17 00:47:55"` vs `"2026-04-17T00:47:55.000Z"`). Prisma `{ gte: date }` comparison fails silently. Fixed by dropping redundant `createdAt` filter on discoveries -- session-scoping already limits to last 24h.

### 15. Onboarding Dropoff Email (Apr 16)
- Identified 328 email-verified users who never completed onboarding (70% drop-off rate).
- Drafted + sent persuasive nudge email via `scripts/send-onboarding-dropoff-email.ts`.
- Copy: "We have 5,000+ open engineering, PM, and design roles... None of them go out until you finish your onboarding." Subject: "5,000+ jobs we can apply to for you (once you finish setup)". Signature: "Talk soon, Naya".

### 12. Error visibility fix -- route worker errors to /admin/errors, sanitize user surfaces (Apr 16)
**Motivated by:** Investigation of Daniel Cooke (3rd paid sub, signed up + upgraded same hour) -- his BrowseSession ended with raw `errorMessage: "Session timed out -- please try again"` written by the worker watchdog. Naya's rule: errors are operator signal, never user signal.

**Shipped to prod Apr 16 (commit `7f5daa4`, deploy `bfewebsite-fdc7t6mv3`):**
- **`src/lib/error-display.ts` (new).** `friendlyError(raw)` extracted from dashboard, expanded matchers (anti-bot/cloudflare/captcha, "Required field", "Session timed out"), warmer fallback ("Couldn't complete this one -- we'll retry").
- **`src/lib/log-error.ts` (new).** Server-side `logServerError()` -- Prisma write into ErrorLog with synthetic endpoint `worker:<kind>`, method `WORKER`. Wired into `batch-apply.ts` for per-job + run-level failures.
- **`worker/src/error-log.ts` (new).** Worker-side `logWorkerError()` -- libsql raw INSERT into ErrorLog. Same endpoint convention. Swallows its own failures so logging can't break the loop.
- **Worker wiring in `browse-loop.ts`:** watchdog timeout, `markSessionFailed`, `markSessionPaused`, failed `createDiscovery`, failed/anti-bot `updateDiscoveryStatus`. Routine skips (cap, cooldown, location) intentionally NOT logged -- operator noise.
- **Worker wiring in `db.ts`:** `markFailed` (apply queue) now also writes to ErrorLog with userId+jobId lookup.
- **User-facing leak fix.** `ApplicationsDashboard.tsx` dropped `title={app.errorMessage}` raw-text tooltip. `/api/auto-apply/browse/[sessionId]` now wraps both session and per-discovery `errorMessage` in `friendlyError()` before returning. Code-comment guardrail near `todayActivity` in `page.tsx`.

**Result:** All worker errors (timeouts, stuck forms, anti-bot blocks, paused-on-credit) now land in `/admin/errors` under namespaced `worker:browse-session:*` / `worker:browse-discovery:*` / `worker:apply-queue:*` endpoints.

### 11. Apply engine fixes -- Phase 1+2+4 shipped, Browserbase A/B run
**Motivated by:** Two user investigations (Habeebat Adeyemo, Morin Fagbodun) showed the cohort-wide failure pattern concretely. Baseline re-measured: **28.2% overall, 41.4% Greenhouse, 0.4% Ashby (2/492).** OpenAI alone: 228 attempts, 0 applies in 30d.

**Shipped to prod Apr 15:**
- **City/workLocations onboarding fix.** `src/components/OnboardingSync.tsx:61` was writing the wizard's preferred-work-city to `User.city` (residence). Added new `User.workLocations` JSON column. `scripts/repair-city-location.ts` ran on prod: **85 users backfilled, 29 had corrupted residence city cleared** (e.g., city=SF, state=Indiana).
- **URL pattern exclusion.** New `EXCLUDED_URL_PATTERNS` in `src/lib/auto-apply/job-matcher.ts` with `isUrlExcluded()` helper. Seeded with Stripe intern/new-grad regex. New read-only admin page `/admin/apply-exclusions` shows active patterns + zero-success-in-30d company candidates.
- **Common gates library.** `worker/src/common-gates.ts` -- `fillCommonGates`, `ashbyIdentityFill`, `leverIdentityFill`. Pre-pass runs BEFORE the Claude loop for non-Greenhouse paths.
- **Stuck-cascade bailout.** `apply-engine.ts` -- if `skippedFields.length >= 3`, return `stuck-field-cascade` early rather than burning 25 more Claude steps.
- **Browserbase wire-up.** `getBrowser()` swaps to `chromium.connectOverCDP(session.connectUrl)` when `USE_BROWSERBASE=true`.
- **DRY_RUN mode.** Three submit points honor `DRY_RUN=true`.
- **Testing infrastructure.** Fixture suite + 30-URL integration suite + canary script.
- **Hard-blocked Ashby cluster.** OpenAI, Ramp, Notion, Perplexity, Linear, ElevenLabs excluded from matcher until residential proxies are enabled.

**A/B results:** Phase 2 lifts Greenhouse from 41% to 90%. Browserbase free tier = zero lift on Ashby.

### 1-10. (Earlier items unchanged from prior handoff)

---

## Known Issues

### BrowseDiscovery datetime format -- WORKAROUND IN PLACE
`BrowseDiscovery.createdAt` is stored as `"YYYY-MM-DD HH:MM:SS"` (SQLite default) instead of ISO 8601. Prisma `{ gte: date }` comparisons fail silently. Workaround: filter by `sessionId` (which has ISO dates on BrowseSession) instead of `createdAt` on discoveries. A bulk format repair (similar to `scripts/repair-datetime-format.ts` for User) would fix this permanently.

### Greenhouse react-select -- RESOLVED (pending prod measurement)
Phase 2 `common-gates.ts` + `greenhouseDeterministicFill` now clear 90% of Greenhouse URLs.

### Ashby spam-flag -- NOT FIXED IN CODE
Cooldown mitigates cascading failures. Submit-time flag requires residential IPs. **Only paid Browserbase with `BROWSERBASE_USE_PROXIES=true` will move this.** Ashby cluster hard-blocked from matcher until proxies enabled.

### Onboarding 68% drop-off -- NUDGE EMAIL SENT
328 users emailed Apr 16 via `scripts/send-onboarding-dropoff-email.ts`. Root cause investigation (instrumentation) still pending.

### Stripe expired coupon pattern -- DOCUMENTED
`crczQBPX` expired Apr 13 without anyone noticing until a user clicked the dead button. **Now documented in the conversion-email-cap skill** with a pre-send verification checklist. Per-user coupons from the automated drip are scoped to 1 redemption + 72h expiry each, so global expiry can't silently break multiple emails.

### Manual jobs older than 60 days -- NOT FIXED
304 inactive manual jobs from before the restore script's cutoff date.

### City/workLocations bug -- RESOLVED
Fixed + migrated 85 affected users Apr 15.

---

## Next Steps (Prioritized)

### 1. Decide on paid Browserbase ($99/mo Scale tier for residential proxies)
Greenhouse is now 90% (up from 41%). Ashby remains 0%. Only paid BB proxies move this.

### 2. Onboarding drop-off investigation
27 of 40 weekend signups bounced before entering first name. Nudge email sent but root cause unknown. Instrument post-email-verification path with `PagePresenceTracker`.

### 3. International user handling
4 of 13 weekend onboarded users are international. Matcher hard-rejects US jobs for them.

### 4. Resume builder deployment
Branch `resume-builder` ready but not merged. Fork card in post-onboarding flow + pdfmake generation.

### 5. Railway build retry
Latest Railway build failed with transient Ubuntu mirror error (`Cannot initiate the connection to archive.ubuntu.com`). Just retry in the Railway dashboard.

### 6. BrowseDiscovery datetime format repair
Run a bulk fix similar to `scripts/repair-datetime-format.ts` on BrowseDiscovery table. Convert all `"YYYY-MM-DD HH:MM:SS"` to ISO 8601. Prevents future Prisma date-comparison bugs.

---

## User Stats (as of Apr 16 evening)
- **~450 total signups** (estimated)
- **~119 onboarded users** (the autoApplyEnabled backfill list)
- **~8,800 active jobs** in catalog
- **4 paying subscribers** -- Brian McLaren ($14.50), Anika Ahmed ($29), Daniel Cooke ($29), Knight Kimosop ($29) -- all Starter tier
- **5 late-upgrade emails sent** (sharayu699, samayo.dev, rranjan07th, msadiknur, adepitandavid) -- $14.50 promo with STARTER50 coupon
- **328 onboarding-dropoff emails sent**
- **17 cap-conversion candidates identified** for automated drip (digest sent to Naya for approval)
- **Cohort success rate (post-Phase 2): ~64%** (paying users, last 24h per daily report)

## Admin Users
- **Nyaradzo (Naya)** -- `admin` (full access)
- **Sarah Comlan** (`Sarah.comlan@gmail.com`) -- `operations`

## Admin Pages
- `/admin` -- main dashboard, shows AdminAlert red banner at top
- `/admin/errors` -- central error log, includes worker errors under `worker:*` endpoints
- `/admin/scrape-runs` -- last 7 days of scrape executions
- `/admin/stuck-fields` -- top failure clusters
- `/admin/apply-exclusions` -- URL patterns excluded by the matcher
- `/admin/integration-runs` -- integration suite run history
- `/admin/cap-conversion/[token]` -- cap-hit conversion email approval page (linked from daily digest email)
- `/admin/auto-apply` -- auto-apply session overview

## Automated Emails
| Email | Trigger | Recipients |
|---|---|---|
| Cap-conversion digest | Daily 7am MT cron | theblackfemaleengineer@gmail.com (approval link) |
| Paying-user report | Daily 7:30am MT cron | theblackfemaleengineer@gmail.com |
| Cap-conversion send | Admin clicks "Send all" on approval page | Capped free users (per-user 72h coupon) |

## Diagnostic Resources
- Worker startup log: search Railway deploy logs for `"event":"browser_binary"` to verify Chromium binary path
- Failure screenshots: every stuck/timeout failure uploads a full-page PNG to Vercel Blob
- One-off scripts: `scripts/apply-for-user.ts <userId>`, `scripts/send-late-upgrade-email.ts [--test|--send]`, `scripts/send-onboarding-dropoff-email.ts`, `scripts/repair-city-location.ts`, `scripts/repair-datetime-format.ts`, `scripts/canary.ts`
- Integration test user: `1d16e543-db6e-497b-b78b-28fbf0a30626` (role=`test`)
- Integration suite: `cd worker && npm test` (fixture) + `npm run test:integration` (real URLs)

## Technical Debt
- `worker/data/target-companies.json` and `scripts/target-companies.json` must stay in sync
- `.env.vercel-prod` file exists locally -- contains prod secrets, don't commit
- Per-app timeout 12 min x max 25 agent steps x 2 concurrent sessions can saturate Railway memory
- The xvfb wrapper means worker must be killed via tini for clean shutdown
- `BrowseDiscovery.createdAt` non-ISO format -- workaround in place, bulk repair pending
- `rebrowser-playwright` skipped (tops out at v1.52, we're on v1.58)
