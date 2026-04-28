# Session Handoff — April 14–27, 2026 (Apr 27: UTM tracking, resume quiz auto-retry, auto-apply progress stepper deployed. Workday expanded to 13 tenants but worker NOT yet deployed)

## Current State

### Branches
- **main** — production code, deployed to Vercel. Head: `cd2e36c` (Apr 27, auto-apply progress stepper + UTM tracking + resume quiz auto-retry deployed).
- **auto-apply-saas** — Railway worker deploys from this branch. Head: `cd2e36c` (in sync with main). **Apr 26 Workday worker changes still uncommitted** — see "Uncommitted as of Apr 27" below.
- **resume-first-onboarding** — Apr 19 branch, fully merged into main.
- **seven-day-trial** — Apr 17 working branch. Fully merged and deployed.
- **cap-conversion-drip** — prior working branch. All commits merged to main.
- **apply-engine-fixes** — feature branch from Apr 15, 6 commits. Kept around for reference.
- **resume-builder** — the resume builder feature (not yet deployed). Head: `6e0fe3a`.
- **applications** — prior working branch, at `b43d7ac` (behind main).

### Uncommitted as of end of Apr 27 session (working tree on `auto-apply-saas`)
Working-tree changes ready to commit (13 Workday tenants total, 8 new passing DRY_RUN smoke):
- `worker/src/workday/tenants.ts` — 26 tenants defined (5 validated + 21 pending). Per-tenant question rules for Walmart, Adobe, Salesforce, Capital One, Cisco. Generic question rules expanded (sanctions, government entity, relative employed).
- `worker/src/workday/wizard.ts` — heavily expanded cross-tenant wizard driver. Key changes since 5-tenant baseline:
  - `fillSearchableDropdown` helper for Workday's server-side autocomplete fields (school, field of study) with retry + shorter search term fallback
  - Phone Device Type discovery: tries `formField-phoneType`, `formField-phoneDeviceType`, then label-based discovery for any dropdown with "phone type/device type" in label text
  - Education fields: school/fieldOfStudy searchable dropdowns, degree dropdown, education date range (educationStartDate/End, from/to, startYear/endYear)
  - Skills tagger: types "Python", waits for autocomplete option, clicks or presses Enter
  - Citizenship multiselect on VD page: prefers "United States" option
  - Application Questions: context-aware text inputs (salary -> "70000", years experience -> "0", dates -> "05/2026")
  - Address Line 2 fill ("Apt 1") for tenants that require it
  - Name field fallback: `formField-legalName--firstName` -> `formField-firstName`
  - Remaining-text-inputs discovery on My Information page
- `worker/test/integration/smoke-companies.ts` — 20 new Workday tenants added to WORKDAY_ONLY_CANDIDATES, SMOKE_SINGLE support for individual tenant testing.
- `src/lib/scrapers/workday.ts` — two-pass scrape (default + intern search).
- `src/data/auto-apply-companies.json` — 8 new Workday tenants added (Netflix, Intel, Morgan Stanley, Target, Johnson & Johnson, GE Aerospace, GE Vernova, GE HealthCare). Total: 81 companies, 13 Workday.

### Infrastructure
- **Vercel** — frontend (www.theblackfemaleengineer.com). Latest prod deploy: Apr 27 `cd2e36c` (UTM tracking + resume quiz auto-retry + auto-apply progress stepper).
- **Railway** — worker (browse-loop + apply-engine). **Now runs xvfb-wrapped headed Chromium**, not headless. Dockerfile installs `tini` + `xvfb` + full Chromium binary. Memory budget ~+300MB, well within 8GB. **Note:** auto-apply-saas pushed many times Apr 18-19; deploy-induced session resets observed (worker keeps applying from in-memory matchedJobs after I cancel a session — see "Technical Debt").
- **Turso** — production database. Tables added across recent sessions: `AdminAlert`, `ScrapeRun`, `CompanyCooldown`, `StuckField`, `IntegrationRun`, `CapConversionDigest`, **`WorkdayCredential` (Apr 25)** for per-(user, tenant) Workday auto-apply credentials. New columns on `User`: `resumeBuilderUsed`, `workLocations`, `conversionEmailSentAt`, `freeTierEndsAt` (Apr 17), `freeTierSunsetEmailAt` (Apr 17), `detailsReviewedAt` (Apr 18), **`seekingInternship` + `preferenceBannerDismissedAt` (Apr 25)** for internship-only matching. New columns on `BrowseSession`: `lastHeartbeatAt` (Apr 18), **`seekingInternship` (Apr 25)**. New column on `TempOnboarding`: **`confirmedSeekingInternship` (Apr 25)**. Pushed via raw SQL (Prisma CLI can't push to Turso directly).
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
- `WORKDAY_CREDENTIAL_KEY` — **NEW Apr 25, INSTALLED IN PROD Apr 26.** 64-hex-char (32-byte) AES-256-GCM master key for encrypting Workday account passwords. Set on Vercel (Production scope, `--sensitive`) + Railway (worker service). Same value in both. **Prod-key SHA-256 fingerprint (first 12 chars): `9c3eec9d53f4`** — use to verify Vercel + Railway have the same value. **Treat like ALERT_SECRET — never rotate lightly** because rotation invalidates every `WorkdayCredential.passwordEncrypted` row. Local-dev key from the Apr 25 + Apr 26 Claude transcripts is COMPROMISED — never reuse for prod.

---

## What Was Done This Session (April 15-26)

### 35. Apr 27 — Auto-apply progress stepper: redesigned + deployed

**Goal:** User feedback said auto-apply felt like a black box. Added live progress feedback to the applications dashboard.

**What shipped (deployed to prod):**
- **New polling endpoint** `GET /api/auto-apply/progress` — lightweight route returning `status`, `totalCompanies`, `companiesDone`, `jobsFound`, `jobsApplied`, `jobsSkipped`, `startedAt` for today's session
- **Progress stepper UI** in `ApplicationsDashboard.tsx` — replaces the old discovery list with a 3-step stepper (scan, match, apply) that never shows specific job/company names (avoids looking bad when jobs fail)
- **Live polling** every 8s while session is active, auto-reloads page on completion
- **Brand-consistent design**: orange gradient progress bar, spinner on active step, vertical connector line, "Running"/"Complete" pill badges, big applied count on completion
- No company or job names shown at any point during processing

**Commit:** `cd2e36c` on both `main` and `auto-apply-saas`

### 34. Apr 27 — UTM tracking + resume quiz auto-retry (deployed)

**Goal:** Track marketing attribution from UTM params (LinkedIn post `?utm_source=linkedin&utm_medium=social&utm_campaign=200mrr`) and fix the resume quiz flow for users who upgrade mid-quiz.

**What shipped:**
- UTM fields added to `PagePresence` and `User` models (first-touch attribution, never overwrites)
- `usePagePresence.ts` captures UTM from URL, caches in localStorage, sends with heartbeats
- Signup route copies UTM from PagePresence to User record via `visitorId` linkage
- Admin dashboard shows UTM Attribution table (source/medium/campaign with visitor + signup counts)
- Resume quiz auto-retries rewrite if answers were submitted but PDF generation failed/timed out (handles upgrade-mid-quiz and timeout recovery)
- `maxDuration` bumped from 60 to 120 on resume rewrite route (Claude API + Chromium PDF was timing out)
- Standalone script `scripts/rewrite-resume-for-user.ts` for manual resume rewrites

**Commits:** `b004d26` (UTM + quiz auto-retry)

### 33. Apr 27 — Kasey Arnold resume rewrite diagnosis + fix

**Root cause:** Kasey completed the quiz while trialing, then upgraded to Starter. The rewrite endpoint had `maxDuration: 60` which was too tight for Claude API call + Chromium PDF render. Fixed by bumping to 120s and adding auto-detect-and-retrigger on page load (if answers submitted but no rewrite URL, auto-triggers rewrite).

### 32. Apr 27 cont'd — Workday expansion: 20 new tenants tested, 8 passing, added to auto-apply

**Goal:** Smoke-test 20 new Workday tenants and add passing ones to `auto-apply-companies.json`.

**Final scorecard (20 new tenants):**
| Tenant | Result | Error / Notes |
|---|---|---|
| Netflix | PASSED | |
| Intel | PASSED | Citizenship multiselect fix |
| Morgan Stanley | PASSED | |
| Target | PASSED | Skills tagger fix |
| Johnson & Johnson | PASSED | Salary text input fix |
| GE Aerospace | PASSED | |
| GE Vernova | PASSED | |
| GE HealthCare | PASSED | |
| HP Inc | FAILED | stuck-step-1 (phone device type field not filling) |
| HPE | FAILED | hung/timeout during browser automation |
| Northrop Grumman | FAILED | pressSequentially timeout (auth or field mismatch) |
| Bank of America | FAILED | stuck-step-2 (school searchable dropdown not selecting) |
| PwC | FAILED | stuck-step-1 (credential reuse / auth confusion) |
| Procter & Gamble | FAILED | stuck-step-2 (school searchable dropdown) |
| NVIDIA | FAILED | auth gate not detected (7-step wizard) |
| RTX | FAILED | auth gate not detected (7-step wizard) |
| Broadcom | FAILED | login/authentication required |
| Visa | FAILED | "How Did You Hear About Us?" multiselect never fills |
| Boeing | FAILED | graduation date widget not filling |
| Mastercard | FAILED | hung/timeout during browser automation |

**Wizard fixes made this session:**
1. `fillSearchableDropdown` helper for server-side autocomplete fields (school, field of study)
2. Phone Device Type: `formField-phoneType` -> `formField-phoneDeviceType` fallback -> label-based discovery
3. Skills tagger: type "Python", wait for autocomplete, click option
4. Citizenship multiselect: prefer "United States" on VD page
5. Context-aware AQ text inputs: salary -> "70000", years experience -> "0"
6. Address Line 2: always fill "Apt 1"
7. Education dates: educationStartDate/End, from/to, startYear/endYear
8. Name field fallback: `formField-legalName--firstName` -> `formField-firstName`

**Known issues for follow-up session:**
- NVIDIA/RTX: 7-step wizard auth gate detection needs deeper investigation (auth page looks like step 1)
- Broadcom: completely different auth flow, needs separate handling
- HP Inc/Northrop/HPE: Phone Device Type label-based discovery didn't match. Need non-headless debugging to inspect actual field automation IDs
- BofA/PwC/P&G: School searchable dropdown autocomplete results not appearing. Possible server-side search latency or different autocomplete pattern
- Boeing: graduation date widget uses unknown automation ID pattern
- Visa: "How Did You Hear" is a different widget type than multiselect or dropdown

### 31. Apr 27 — Cisco added as 5th Workday tenant + date widget fix: 5/5 tenants PASSED (NOT YET DEPLOYED)

**Goal of session:** Fix Cisco and Capital One Workday date widget failures (stuck on Self-Identify/Voluntary Disclosures steps), then get all 5 tenants passing.

**Final result: 5/5 Workday tenants PASSED DRY_RUN smoke (`smoke-results-2026-04-27T02-46-45-700Z.json`):**
| Tenant | Duration | 
|---|---|
| Cloudflare (control) | 42.0s |
| Salesforce | 84.7s |
| Adobe | 136.5s |
| Cisco | 136.4s |
| Capital One | 143.1s |
| Walmart | 88.2s |

**Key fix: Workday date widget filling (`wizard.ts`)**

Workday's e-signature date uses a 3-part widget (month/day/year separate INPUT elements with `dateSectionMonth-input`, `dateSectionDay-input`, `dateSectionYear-input` automation IDs). After 2 digits in month, Workday auto-advances cursor to day, then after 2 in day to year.

Previous approaches that FAILED:
- `fill()` + `pressSequentially()` per field: React controlled inputs drop the values
- `nativeInputValueSetter` via `page.evaluate()`: Sets DOM values but Capital One's React state doesn't pick them up (flaky: worked 1/3 times)
- `_valueTracker.setValue("")` reset: No improvement on Capital One
- Per-field keyboard typing with click between fields: Auto-advance conflicts cause garbled values ("2/20/26" instead of "04/26/2026")

**Working approach**: Type the full date as continuous digits `MMDDYYYY` (e.g., "04262026") into the month field via `page.keyboard.type()`. Workday's auto-advance distributes the digits naturally across month/day/year fields. This matches real user behavior and works reliably on all tenants.

**Other changes:**
- `clearAndType` helper: tries `fill()`, falls back to Ctrl+A+Backspace+pressSequentially, then `nativeInputValueSetter` with `_valueTracker` reset as last resort
- Stuck-step detection: wizard bails after 3 retries on the same step (error code `workday-wizard-stuck-step-{N}`)
- Removed verbose DATE DIAG logging from production steps
- Cisco tenant added to `tenants.ts` with question rules (former employee, referral, non-compete)

**Still TODO:**
- Add Cisco to `auto-apply-companies.json`
- Commit all changes
- Add 23 newly discovered Workday companies to system
- Deploy

### 30. Apr 26 cont'd — Multi-tenant Workday generalization: 4/4 tenants PASSED (NOT YET DEPLOYED)

**Goal of session:** Generalize the Walmart-only Workday wizard to support Adobe, Salesforce, and Capital One. Iterate smoke testing until all tenants pass.

**Final result: 4/4 Workday tenants PASSED DRY_RUN smoke (`smoke-results-2026-04-26T17-55-09-964Z.json`):**
| Tenant | Duration | Job tested |
|---|---|---|
| Salesforce | 108.7s | Lead Full Stack Engineer, Backend Oriented |
| Adobe | 134.1s | Product Manager 4 |
| Capital One | 131.8s | Director, Product Management |
| Walmart | 108.4s | Senior Manager, Software Engineering |

**What was generalized:**

1. **`worker/src/workday/wizard.ts`** — complete rewrite from Walmart-only to cross-tenant:
   - `fillWorkdayDate` helper: handles 3 date picker variants (select, Workday custom dropdown, single input)
   - `fillMyInformation`: broader multiselect discovery for "How Did You Hear" (tries known automation IDs, then discovers all multiselect containers by label text, falls back to regular dropdowns)
   - `fillMyExperience`: fills work experience (jobTitle, company with multi-selector fallback, location, dates) and education (school autocomplete, degree dropdown) after resume upload. Catch-all discovery fills ALL empty text inputs by label with sensible defaults.
   - `fillApplicationQuestions`: checkbox checking, text input filling, popover cleanup
   - `fillVoluntaryDisclosures`: smart dropdown filling (consent=Yes, gender/race=Decline, veteran/disability=prefer not), force-check hidden consent checkboxes (Capital One's `formField-acceptTermsAndAgreements`), e-signature text inputs (Name + Date)
   - `clickNextWithFallback`: 5 button selectors, scroll-to-bottom, force-click fallback

2. **`worker/src/workday/tenants.ts`** — 4 tenants with per-tenant question rules:
   - Walmart: family member, uniformed services, associate affiliation
   - Adobe: former employee, referral, non-compete
   - Salesforce: former employee, referral, non-compete, citizenship/residency, government entity
   - Capital One: former employee, referral, background check
   - Generic rules expanded: sanctions/embargo, government entity, relative employed

3. **`worker/test/integration/smoke-companies.ts`** — Capital One URL corrected (`wd1` -> `wd12`)

4. **`src/data/auto-apply-companies.json`** — 4 Workday tenants added with WorkdayConfig format (`baseUrl`, `company`, `siteName`)

**Key bugs fixed during iteration (20+ smoke runs):**
- Label-click regression: consent checkbox block's `label.click()` was toggling already-checked checkboxes OFF. Fixed by removing label click, keeping only `force: true` on hidden checkbox check.
- Salesforce VD page: gender dropdown required but wasn't being filled. Fixed by full dropdown discovery in fillVoluntaryDisclosures.
- Adobe Company field: `formField-company` selector didn't match Adobe's DOM. Fixed with broader selectors + label-based fallback + catch-all input discovery.
- Capital One "How Did You Hear" multiselect: added page-level eval to discover all promptIcon containers, then regular dropdown fallback.
- Capital One auth gate: required checking ALL checkboxes on signup page (not just specific IDs). Added role="checkbox" support, scroll-to-bottom, longer waits.
- Capital One consent checkbox hidden: Workday hides native `<input type="checkbox">` behind styled `<label>`. Fixed with `force: true` targeting `formField-acceptTermsAndAgreements`.

**What's NOT covered yet:**
- Snowflake, ServiceNow, Intuit still get 422 from Workday API (wrong siteName). Sprint 3: careers-page config harvest. **Cisco now fixed and passing.**
- No live (non-DRY_RUN) submission tested. Next step: a single live apply per tenant.

### 29. Apr 26 cont'd — Workday env install, seekingInternship backfill applied, multi-tenant Workday smoke = 0/4 (SUPERSEDED by section 30)

**Goal of session:** Validate + deploy the Apr 25 Workday + internship work (HANDOFF Steps 1-6 from prior plan).

**What shipped to prod state:**
- ✅ **Step 1 — Walmart consolidated wizard smoke (DRY_RUN) PASSED in 96.5s.** All 5 wizard steps logged: resume upload → My Information → Application Questions (10 fields) → Voluntary Disclosures → Review (submit SKIPPED). Confirms the consolidated `runWorkdayApply` → wizard.ts path matches the Apr 25 recon. Result JSON: `worker/test/integration/smoke-results-2026-04-26T02-23-11-104Z.json`. Used `SMOKE_FRESH_EMAIL=1` workaround (per Apr 25 known gotcha re: test user's pre-existing Walmart account).
- ✅ **Step 2 — `WORKDAY_CREDENTIAL_KEY` installed in prod.** Vercel (Production, `--sensitive`) + Railway (worker service). Same value in both. **Prod fingerprint sha256[:12] = `9c3eec9d53f4`**. Generated via `node -e crypto.randomBytes(32)` piped directly to `vercel env add` and a 600-perm `/tmp/workday-key.txt` for manual Railway paste; temp file deleted post-install.
- ✅ **Step 3 — `seekingInternship` backfill applied to prod.** `scripts/backfill-seeking-internship.ts --apply` flipped 10 free-tier users (incl. IniAbasi `f0da7f25-...`). 529 scanned, 487 had no graduationYear, 27 out-of-range, 2 yoe>=2 with current grad year, 3 admin/test. Verified post-write: `SELECT COUNT(*) FROM User WHERE seekingInternship = 1` → 10.

---

### 28. Internship-only matching + catalog growth + Workday auto-apply POC (Apr 25, NOT YET DEPLOYED)

**Motivated by:** Ticket from IniAbasi Bassey (Dartmouth, graduation 2027) Apr 17: "currently the system is applying to full-time roles for me even though my graduation year is listed as 2027. I was wondering if there was a way for me to specify that I would like to apply for Internships exclusively not full time roles?"

This expanded into a four-phase day:
- **Phase A**: internship-only preference + matcher filtering
- **Phase B**: catalog growth via smoke-tested company additions
- **Phase C**: more company additions (extended smoke harness)
- **Phase D**: Workday auto-apply support (POC submitted a real Walmart application end-to-end)

#### Phase A — Internship-only preference (shipped to local, NOT YET DEPLOYED)

**Schema (applied to prod Turso via `scripts/add-seeking-internship-column.ts`):**
- `User.seekingInternship Boolean? @default(false)` — explicit toggle, not derived from YoE
- `User.preferenceBannerDismissedAt DateTime?` — for the auto-flagged-cohort banner
- `BrowseSession.seekingInternship Boolean? @default(false)` — snapshot at queue time so worker doesn't join User per session
- `TempOnboarding.confirmedSeekingInternship Boolean?` — captured at the live `/start` confirm step

**Matcher (`src/lib/auto-apply/job-matcher.ts`):**
- Catalog query now selects `type` and filters when `seekingInternship=true`: `OR: [{ type: 'Internship' }, { title contains 'intern' }]`. Allows `manual` source for intern-seekers (so hand-seeded internships surface).
- Keyword sets are REPLACED (not appended) when seekingInternship — original early-career boost was additive, so a 2027 grad still matched every senior FT "Software Engineer" role.
- Post-filter inside the scoring loop with strict `looksLikeInternshipTitle()` regex (rejects "Internal Tools" / "International Recruiter" / "Intern Program Manager").
- LLM gate prompt gets a hard internship-only rule when seekingInternship.

**Worker (`worker/src/career-browser.ts`, `worker/src/browse-loop.ts`):**
- `discoverJobsFromCatalog` accepts `seekingInternship` arg
- `browse-loop` reads it off the BrowseSession row at session-claim time, threads through
- Snapshotted at queue time in `/api/cron/daily-apply` and `/api/auto-apply/browse`

**Resume extraction (`src/lib/resume-extraction.ts`):**
- Added `graduationYear: number | null` field — tool description recognizes Month+Year, Season+Year, year-alone, numeric (5/2027 / 12/26), date ranges (always end year), expected/anticipated phrasings, two-digit year normalization
- `normalizeGradYear()` post-processor: handles 2-digit years (promotes to 20xx), rejects out-of-range, tested 18/18 cases pass

**Onboarding wiring (live `/start` flow):**
- `ConfirmExtractionStep.tsx` (live signup): added "I'm only looking for internships" checkbox, default-checked when extracted gradYear is in future OR yoe < 2
- `/api/onboarding/confirm-extraction` persists to TempOnboarding.confirmedSeekingInternship
- `/api/onboarding/promote` reads it back, also has fallback that auto-flags if extracted gradYear shows current student
- `/onboarding/review/ReviewForm.tsx` (post-checkout): same toggle + graduationYear text input
- `/api/profile/route.ts` accepts seekingInternship + preferenceBannerDismissedAt

**Profile UI:**
- `JobPreferencesSection.tsx` — "Show me internships only" toggle
- New `InternshipPreferenceBanner.tsx` for backfilled users on `ApplicationsDashboard`. "Sounds good" / "Switch to full-time" buttons; dismiss writes `preferenceBannerDismissedAt`.

**Reclassification (`scripts/reclassify-internship-titles.ts --apply` ran Apr 25):**
- Strict regex `\b(intern|internship|co-?op|summer\s+(analyst|associate|engineer|intern))\b` minus `\bintern\s+program\s+manager\b|\bmanages?\s+interns?\b`. Soft-negative `\binternal|international\b` only blocks if no separate `\bintern\b` token elsewhere (so "Internal Audit Intern" passes).
- **Flipped 144 jobs from Full-time to Internship.** All-active type=Internship rows: 23 → 167.

**`normalizeJobType()` patched:** now takes optional `title` and infers Internship when ATS metadata is empty. All 4 scrapers (greenhouse/lever/ashby/workday) call sites updated.

**Backfill (`scripts/backfill-seeking-internship.ts --apply` NOT yet run):**
- Rule: graduationYear in `[currentYear, currentYear+2]` AND (gradYear > currentYear OR yoe < 2) AND title not senior. Future-graduation users always pass YoE check (still in school regardless of side gigs).
- Dry-run flagged 10 likely-students including IniAbasi (`f0da7f25-8fb9-48ea-bd3c-3f7c7ebb2bb6`). All 4 paying users skipped.

**Phase A status:** Code complete and type-checks clean (`npm run build` passes). Schema + reclassification applied to prod. Backfill script + matcher code + onboarding/profile UI **NOT YET DEPLOYED**.

#### Phase B — Initial catalog uplift (shipped Apr 25)

Test-first gate per Naya: every new company smoke-tested via `worker/test/integration/smoke-companies.ts` (DRY_RUN mode) before adding to scrape list.

**Smoke-tested 28 candidates (5 controls + 23 new). 3 candidates passed:**
- ✅ Brex, Faire, Anduril (Greenhouse) — added to `src/data/auto-apply-companies.json`

**Failures (NOT added):**
- Roblox (12-min Claude agent timeout)
- Datadog (job listing URL doesn't host the apply form, needs click-through we don't handle)
- Palantir (Lever stuck-cascade)

**Local scrape ran (`scripts/run-scrape-locally.ts`):**
- 5,054 jobs saved across 58 companies, 3,496 stale rows deactivated
- Anduril alone contributed 1,247 jobs; Brex 80, Faire 36
- Internships dropped 164 → 88 because the scrape correctly deactivated prior-season expired listings. 88 is real current inventory.

**Reusable infra built:**
- `scripts/run-scrape-locally.ts` — runs `scrapeAutoApplyCompanies` against prod Turso without needing a Vercel deploy. Sidesteps the `server-only` import issue in `src/lib/prisma.ts` by inlining its own PrismaLibSQL adapter and walking the company list directly.
- `scripts/seed-internships.ts` — pulls live internship listings from Greenhouse/Lever/Ashby APIs using the same regex as the reclassifier. Skip-on-conflict to avoid stomping the auto-apply scrape's `(externalId, companySlug)` ownership.

#### Phase C — Broader expansion (shipped Apr 25)

Extended smoke harness with FT-URL fallback (when no current intern URL exists, test apply against any current FT URL on the same board — proves the apply path works regardless of season).

**Smoke-tested 35 more candidates including 8 Workday tenants. 10 candidates passed:**
- ✅ Pinterest, Instacart, Lattice, Mercury, Robinhood, Discord, MongoDB, Coursera, Box (Greenhouse), Pinecone (Ashby) — added to `auto-apply-companies.json`

**Workday tenants ALL FAILED apply path (see Phase D for fix):**
- 8 of 8 — Salesforce, Snowflake, Adobe, ServiceNow, Cisco, Capital One, Intuit, Walmart all 400/422 with `limit: 50` in our request body. Root cause discovered: **Workday rejects API `limit > 20`.** Fixed in smoke harness. With `limit: 20`: Salesforce, Adobe, Walmart validate; Snowflake/ServiceNow/Cisco/CapitalOne/Intuit still 422 (wrong siteName, needs research). Of the 3 validating tenants, all 3 failed the apply itself (Salesforce + Walmart redirect-to-login, Adobe 12-min wizard timeout). **This is what motivated Phase D.**

**Failures from Phase C (NOT added):**
- Dropbox (multi-step "Save & Continue" timeout), Block (stuck), Coinbase (Cloudflare CAPTCHA), Modal (Ashby stuck), Supabase (Ashby stuck)

**Local re-scrape with the +10 Phase C companies:**
- 5,650 jobs saved, only 1 stale deactivation (since first scrape just ran). Total active: 6,386 → 6,741. Internships still 88 (most new companies don't currently post interns — late-April off-season).

**Smoke failures documented in `worker/test/integration/smoke-failures.md`** for future investigation. Naya picked the email-reply-to-IniAbasi gets HELD until inventory verified post-deploy.

#### Phase D — Workday auto-apply support (Sprint 1 POC LANDED, NOT YET DEPLOYED)

**Why:** 8 of 8 Workday tenants failed Phase C smoke. Workday gates the apply form behind sign-in/create-account (Salesforce, Walmart redirect to login) and runs a 5-7 page wizard per submission (Adobe hits the 12-min apply timeout mid-wizard). Generic Claude agent can't navigate either. But Workday is the single biggest unlock for internship inventory — Salesforce alone has 1,428 jobs, Adobe 1,161, Walmart 2,000.

**Sprint 1 POC: end-to-end real submission to Walmart.** Created a real account at `recon-mof0hb2e@apply.theblackfemaleengineer.com`, submitted application for "Summer 2026 Corporate Intern - Fellowship, Global Public Policy", confirmed via final URL `walmart.wd5.myworkdayjobs.com/.../jobTasks/completed/application` and "Application Submitted ✓" screenshot in `worker/test/integration/recon-wizard-after-submit-1777162767765.png`.

**Code shipped (LOCAL ONLY, not yet deployed):**

- `prisma/schema.prisma` — new `WorkdayCredential` model + back-relation on `User.workdayCredentials`
- `scripts/add-workday-credential-table.ts` — idempotent migration, applied to prod Turso
- `worker/src/workday/credentials.ts` — AES-256-GCM encrypt/decrypt for stored Workday passwords. Uses `WORKDAY_CREDENTIAL_KEY` env. Wire format: `base64(iv || authTag || ciphertext)`. `generateWorkdayPassword()` generates 20-char string with required upper/lower/digit/special. `getOrCreateCredential(userId, tenantHost, applicationEmail)` looks up or generates+persists. `markCredentialUsed` touches `lastUsedAt`. **Tested 4/4 invariants: roundtrip works, tampered authTag rejected, wrong key rejected, generated password classes correct.**
- `worker/src/workday/tenants.ts` — per-tenant config (host, apiTenant, siteName, optional fieldOverrides). Currently has Walmart only. `findTenant(applyUrl)` looks up by URL host.
- `worker/src/workday/email-verify.ts` — sibling to `worker/src/verification.ts`. Polls InboundEmail table for `*@*.{myworkdayjobs.com,myworkdaysite.com,workday.com}` URLs containing `verify|confirm|activate`. Returns clickable URL. Doesn't touch the existing `waitForVerificationCode` (that has 12 unit tests for ATS verification codes; we built a parallel function).
- `worker/src/workday/auth.ts` — `signupOrSignin` detects auth gate, uses cred row to decide path. Both paths use `pressSequentially` (not `.fill()` — React's controlled inputs drop chars at fast delays) + Tab to blur + force-click fallback (Workday's submit button is sometimes covered by a tooltip). Honeypot `beecatcher` field deliberately left empty (Workday's bot detector flags any account with that field set).
- `worker/src/workday/wizard.ts` — full 5-step wizard driver. `detectStep` parses progress bar; per-step fillers; submit handler with confirmation detection.
- `worker/src/workday/index.ts` — `runWorkdayApply` entry point with 10-min soft budget (so we always return before the outer 12-min Promise.race fires).
- `worker/src/apply-engine.ts` — host-router branch around line 2440: `if (ats === "Workday" && tmpPath && userId)` → call `runWorkdayApply`. Returns sentinel `workday-tenant-not-supported` when tenant isn't in our list, which makes apply-engine fall through to its existing Claude agent loop.

**Workday quirks discovered + handled (every one was a real iteration cycle):**
- **`limit > 20` rejected by Workday API with HTTP 400.** Use `limit: 20` for jobs API. Production scraper at `src/lib/scrapers/workday.ts` already uses 20; smoke harness was using 50.
- **React inputs drop chars at fast pressSequentially delays.** Use `delay: 60` minimum. Defense: after typing, verify with `inputValue()` and retry via `.fill()` if mismatched.
- **Submit buttons sometimes report un-actionable** (covered by a transient tooltip overlay). Use `clickWithForceFallback`: try normal `.click()` with 5s timeout, fall back to `.click({ force: true })` if it times out.
- **Multiselect dropdown trigger is the SVG `promptIcon`, not the input.** Click `[data-automation-id="promptIcon"]` inside the formField container. Clicking the input alone doesn't always open the popover.
- **Workday's "How Did You Hear About Us?" is a HIERARCHICAL multiselect.** Top-level options ("Advertising", "Job Board") have `>` chevrons that drill into sub-menus. Detect by checking if the option list changes after click; pick first non-"Other" sub-option.
- **`role="option"` includes selected pills** (the `× United States of America (+1)` style). Filter out `[data-automation-id="selectedItem"]` and anything inside `[data-automation-id="selectedItemList"]` when listing dropdown options.
- **Honeypot field** `[data-automation-id="beecatcher"]` (with `name="website"`) MUST remain empty. Filling it triggers Workday's bot detector.
- **Phone numbers `5XX-555-XXXX` are rejected** as "not valid for this region" (test/reserved numbers). Use a real-looking format like `7205550123` (Denver area code).
- **"Application Questions" step has tenant-specific Y/N selects with conditional follow-ups.** Picking "Current associate" reveals a required "What is your WIN?" field; picking "Opt-In to receive text messages" reveals a phone-confirmation field. Wrong picks at this step cascade into more required fields. `answerForApplicationQuestion()` heuristic in `wizard.ts` handles Walmart's 10 questions correctly.
- **Voluntary Disclosures step has only 3 fields** (ethnicity, gender, T&C). Only T&C is required.
- **Wizard's "Next" button is `[data-automation-id="pageFooterNextButton"]`**, label varies between "Save and Continue" and "Submit" based on step.
- **Submit confirmation:** URL changes to `/jobTasks/completed/application` and body contains "Application Submitted ✓" / "Welcome, {firstName}".

**Workday tenants that need the same treatment, ordered by yield:**

| Tenant | API status | siteName | Notes |
|---|---|---|---|
| Walmart | ✅ validated, POC submitted | `WalmartExternal` | In wizard.ts |
| Salesforce | ✅ validated (1,428 jobs) | `External_Career_Site` | Sprint 2 |
| Adobe | ✅ validated (1,161 jobs) | `external_experienced` | Sprint 2 |
| Snowflake | ❌ 422 | unknown | Sprint 3 — scrape public careers page for siteName |
| ServiceNow | ❌ 422 | unknown | Sprint 3 |
| Cisco | ❌ 422 | unknown | Sprint 3 |
| Capital One | ❌ 422 | unknown | Sprint 3 |
| Intuit | ❌ 422 | unknown | Sprint 3 |

Apple, Google, Microsoft, Amazon, Meta use **custom careers sites, NOT Workday.** Out of scope — would need per-company harvester scripts.

**Recon files left in repo (kept for future tenant onboarding):**
- `worker/test/integration/recon-walmart.ts` — initial click-walk through Apply → Sign In page
- `worker/test/integration/recon-walmart-full.ts` — full signup + signin path with snapshots
- `worker/test/integration/recon-walmart-wizard.ts` — full wizard walker, ended up actually submitting an application (this is the one that proved the patterns work)
- `worker/test/integration/probe-source.ts` — diagnoses the source-multiselect popover container
- `worker/test/integration/smoke-companies.ts` — extended this session to support Workday + FT-URL fallback + `SMOKE_WALMART_ONLY=1` and `SMOKE_WORKDAY_ONLY=1` env scoping
- `worker/test/integration/smoke-failures.md` — running record of why companies didn't pass

**KNOWN GOTCHA:** test user `1d16e543-db6e-497b-b78b-28fbf0a30626` has a Walmart account at `u-1d16e543@apply.theblackfemaleengineer.com` from an early recon iteration, but the password row in WorkdayCredential was deleted mid-debugging. The account still exists Walmart-side. To smoke-test the production path with that user, either rotate their applicationEmail OR accept that the smoke goes down the signup path and Walmart returns "email already exists". Easiest workaround: temporarily make smoke-companies.ts use a freshly-generated email instead of `u.applicationEmail`.

---

### 27. Daniel Cooke bug-fixes: tailored resume bullets + dark-mode button (Apr 24, DEPLOYED main `e04b7db`)
**Motivated by:** Two `/applications` bug reports from Daniel Cooke (3rd paid sub) submitted Apr 20:
1. "Tailored Resume leaving out job bulletpoints on 2nd and 3rd work history"
2. "Original Resume Unable to read" (dark mode, black-on-black button text)

**Investigation findings (Bug #1 — non-trivial):**
First attempted fix was a 6000→15000 char truncation cap raise in `worker/src/tailor-resume.ts`. **Wrong**: pulled Daniel's original resume from Vercel Blob, parsed via pdf-parse, measured **3778 chars** — well below the 6000 cutoff that was supposedly the bug. Truncation never fired.

**Real cause:** Daniel's resume PDF uses a two-column layout (left col = job headers, right col = bullets). pdf-parse extracts column-major: all 4 job headers first, then all bullets in one flat tail block. Job→bullet association destroyed by extraction. Combined with prompt rule #2 ("Reorder experience bullets so the most relevant appear first"), Claude pulled all matching bullets up to the most recent role and left the rest bare. Confirmed in Daniel's Apr 20 outputs: ZipRecruiter tailored had Job 1 with 13 bullets and Jobs 2/3/4 with zero. Cloudflare had 10/4/0/0.

**Fix shipped (3 commits on top of UI fix):**
- `44877c2` — Drop pdf-parse. Pass PDF buffer to Claude Haiku 4.5 as `document` content block (base64). Claude reads the rendered PDF the way a human does, preserving column→job mapping.
- `02de7c7` — Tighten rule #2: bullets may be reordered within a job, never moved or duplicated between jobs. Every original job must appear with its own bullets.
- `e04b7db` — `dedupeListItems()` regex pass on Claude's output. Verbatim-text fingerprint, keep LAST occurrence (in newest-first resumes, later in document = older job, where smaller jobs need their own bullets restored). Pure regex over `<li>...</li>`, no HTML-parser dep.

**Empirical results against Daniel's actual PDF + a Cloudflare JD:**
- Pre-fix prod: UHG=13, Tuff Shed=0, Woodward=0, Emerson=0
- After PDF input: 9 / 9 / 3 / 2 (every job populated, but ~9 cross-job duplicates)
- After rule tightening: 5 / 9 / 3 / 4 (still ~5 duplicates at boundaries)
- After dedup pass: 6 / 3 / 3 / 2 = **14 total**, exactly matching the 14 unique experience bullets in the source. Every job retains its own bullets.

**Bug #2 fix (`98f2d5c`):** `src/app/profile/applications/ApplicationsDashboard.tsx:648` — button used `text-[var(--gray-800)]` on `bg-[var(--card-bg)]` inside an always-light-purple parent row. Dark mode resolved to #262626 on #1a1a1a (1.16 contrast). Switched to static `bg-white text-purple-800 border-purple-300 hover:bg-purple-100` to match the always-light parent and pair visually with the adjacent Tailored Resume button. Verified via Playwright with computed-style dump + screenshot diff (`.playwright-mcp/original-resume-button-fix.png`).

**Cost note (Bug #1):** PDF input is billed per page (~3000 tokens/page). Daniel's resume is 1 page → ~3168 input tokens vs the prior ~1k from text extraction. Roughly 3x input cost per tailor. Output unchanged (~2900 tokens). Worth it for correctness; monitor Anthropic console for a week.

**Follow-up email** to Daniel sent via Resend (`a9584aeb-539d-46a0-a3a8-508c1b47c567`) acknowledging both fixes are live. Send script was throwaway, deleted post-send.

---

### 26. Trial-fill investigation: cannot force trialing users to 5/5 without breaking relevance (Apr 24, NOT SHIPPED)
**Motivated by:** "trials are ending soon and they need to see all 5 used up." Built `scripts/fill-trial-users-to-cap.ts` (untracked) that imports the production `matchJobsForUser` directly to avoid the script-matcher drift documented in section 22 / tech debt 0c.

**Findings (cohort = 13 trialing users):**
- 8/13 (62%) **already at 5/5** — healthy outcome
- 3/13 stuck under cap with new matches available per local matcher (LLM-fallback, keyword-only): nwanzejl@ (4/5 → 1 slot), c.wright-galloway@benedict.edu (3/5 → 2), jain1009@purdue.edu (3/5 → 2)
- 2/13 incomplete profile (`ayomideaderinto6@gmail.com`, `ceejaymar@gmail.com` at 0/5; missing phone/workAuth/country/targetRole/resume) — higher-leverage conversion target than the under-cap 3

**Triggered prod `/api/cron/daily-apply` directly via curl with CRON_SECRET** (so the LLM gate runs server-side with fresh env): all 3 under-cap trial users returned `no_matches`. The LLM gate correctly rejected the keyword candidates (JD-YOE / role-fit / PhD violations). Conclusion: **the matcher is doing its job**; these 3 users have exhausted their relevant inventory given their profile + dedup. Pushing past `no_matches` would violate the relevance constraint.

**Outcome:** No sessions queued, no quota burned. Script kept on disk (untracked) for future cohorts. Real conversion opportunity is the 2 incomplete-profile users; nudge email recommended but not sent.

---

### 25. `.env.vercel-current` parsing gotcha (Apr 24)
**Found while debugging stale-key 401s:** the local file written by `vercel env pull` stores quoted values with a literal `\n` suffix (two characters: backslash + lowercase n) before the closing `"`. Naive parsers (`grep | cut -d'"' -f2` or `tr -d '"'`) leave the `\n` in the resulting string, so callers ship an API key with `\n` appended → 401 from Anthropic, Resend, etc. Verified via `od -c` on the file.

**Fix in script parsing** (use everywhere keys come from this file):
```bash
KEY=$(grep '^KEY=' .env.vercel-current | sed 's/^KEY=//' | sed 's/^"//' | sed 's/"$//' | sed 's/\\n$//' | tr -d '\r' | tr -d '\n')
```
The `sed 's/\\n$//'` is the load-bearing line — strips the literal escape suffix.

**Worth scanning** other scripts that read `.env.vercel-current` / `.env.vercel-prod` for the same blind spot. `scripts/send-past-due-email.ts` and others source env via the CLAUDE.md pattern from `.env.production` which doesn't have this issue, so they're fine. The `\n` corruption is specific to files produced by `vercel env pull`.

---

### 24. Security audit pass 1 — C1 + C2 + H1 (Apr 19, DEPLOYED main `bb7ffaf`)
**Motivated by:** Naya spotted `onboarded-users.csv` (35 real user emails, orphan file, not in `.gitignore`) sitting in repo root and asked for a full security audit using the Trail of Bits skills playbook.

**Audit approach (read-only):** replicated ToB's `audit-context-building → insecure-defaults → static-analysis → variant-analysis → supply-chain-risk-auditor` flow manually via Explore agents + direct file reads. Covered auth/authz, API-route surface, webhooks, PII exposure, secrets-in-code, input validation, dependency CVEs, file upload, and user-facing error hygiene.

**Overall posture (good news first):** Stripe webhook signature verified, inbound-email webhook has shared-secret gate, all 7 cron routes check `Bearer ${CRON_SECRET}`, admin layout gates every `/admin/*` page via `requireAdmin()`, every `/api/admin/*` route checks `isAdmin` from `checkAdmin()`, all 15+ user-scoped API routes correctly filter by `session.user.id` (no IDOR), bcrypt cost 12 for passwords, no `eval`/`child_process`/`exec*` anywhere, no hardcoded secrets in tracked source, Prisma queries all parameterized.

**Findings that shipped (3 of ~20):**

- **C1 — `POST /api/jobs` was fully unauthenticated.** Anyone on the internet could insert a job into the public board, and the matcher+auto-apply cron would then ship users' resumes to the attacker's `applyUrl`. Now gated with `checkAdmin()` at `src/app/api/jobs/route.ts:143`. Verified: 401 without session, 200 for public GET, tested in Playwright.

- **C2 — loose PII + test artifacts on disk.** `onboarded-users.csv` deleted (35 user emails). `dev.db` (0 bytes, tracked via accidental earlier commit) and 9 `.playwright-mcp/*.log` files (tracked via `34d0964`) untracked via `git rm --cached` — files preserved locally, removed from git. `.gitignore` extended with `/*.csv`, `.playwright-mcp/`, `/dev.db`, `/dev.db-journal`. Spot-checked one playwright log: only third-party console errors from greenhouse/pinterest, no cookies or user PII.

- **H1 — hardcoded auto-promote email defaults in `src/lib/auth.ts`.** Before: `AUTO_ADMIN_EMAILS` defaulted to `"obiajuluonyinye1@gmail.com"`, `AUTO_CONTRIBUTOR_EMAILS` defaulted to `"ashlyncmitm@gmail.com"`. If env unset on any deploy (preview, local, misconfig), whoever registers those emails auto-gets admin/contributor. Verified against prod DB: `obiajuluonyinye1` is already `role: admin` (default was dead code), `ashlyncmitm` is not registered at all (Naya confirmed she should have no privileged access). Defaults both changed to `""` — env vars in Vercel still work identically if set.

**Prod DB role check (Apr 19):** 3 privileged users total — `theblackfemaleengineer@gmail.com` (admin), `obiajuluonyinye1@gmail.com` (admin), `Sarah.comlan@gmail.com` (operations, **never logged in** — no passwordHash, no emailVerified, no Account rows, no Session rows, row created 2026-04-07 via direct DB write). Sarah's row is a latent escalation path: first person to sign in via magic-link with `Sarah.comlan@gmail.com` inherits `operations`. Naya flagged, decision deferred to future session.

**Local-dev caveat (pre-existing, NOT introduced today):** `/api/auth/check-email` and `/api/auth/signup` use `@libsql/client/web` with `runtime = "edge"`. That client rejects `file:` URLs, so the signup/signin flow throws `LibsqlError: URL_SCHEME_NOT_SUPPORTED` locally when `DATABASE_URL=file:./dev.db`. Blocks interactive auth testing in dev. Prod uses `libsql://…turso.io`, so unaffected. Separate bug to track.

**Remaining findings (2 Critical-reduced, 4 High, 5 Medium, 5 Low) not shipped today:**
- H2 `/api/auth/check-email` — email enumeration + `firstName` leak
- H3 `/api/stripe/convert` — unauthenticated GET enables email enumeration
- H4 `/api/auth/signup` — no rate limit + bcrypt-cost 12 = server DoS lever
- H5 `.env.production.local.bak` — 1220 bytes of stale prod secrets on disk (gitignored, never committed, but on disk)
- M1 `/api/admin/blog/[slug]` GET — no `checkAdmin` gate + verbose error leak
- M2 `/api/onboarding/temp-save` — POST unauth/unbounded = DoS / disk fill
- M3 inbound-email forwarding embeds attacker-controlled `from`/`html` into forwarded email (branded phishing vector)
- M4 `/api/stripe/checkout:84` and `/api/admin/blog/[slug]:25` return raw `error.message` to client (violates `feedback_no_user_facing_errors`)
- L1 `npm audit`: 12 vulns (9 high, 3 moderate) all transitive with fixes available — `effect`, `flatted`, `defu`, `ajv`, `brace-expansion`, `@vercel/blob → undici`
- L2 `/api/cron/daily-apply` response includes user emails (defense-in-depth leak if `CRON_SECRET` compromised)
- Sarah Comlan's `operations` role (see above)

### 23. CLAUDE.md no-em-dashes rule codified (Apr 18)
Memory-level guidance promoted to project-level contract. New `## Copywriting` section in `CLAUDE.md` between Testing and Session Start Checklist: never em-dashes (` — `) in user-facing copy (emails, banners, button text, modals, blog posts, errors). Replace with period or restructure. Code comments, plan files, HANDOFF.md exempt.

### 22. JD-stated YOE enforcement everywhere (Apr 19)
**Motivated by:** Naya spotted `udvlenkhtaivan@gmail.com` (yoe=0.7) being applied to LaunchDarkly Full Stack Engineer roles whose JDs say "3+ years of professional software engineering experience." Title alone wasn't catching it.

**Two real bugs found:**
1. **Regex span too narrow.** Original pattern `years\s+(?:of\s+)?(?:experience|exp)` required "experience" right after "years of" with at most "of" between. LaunchDarkly's "3+ years of professional software engineering experience" had 4 adjective words in between → no match. Fixed: allow up to 80 chars between "years" and "experience" (stops at periods/newlines).
2. **`parseInt("0.7")` returned 0, then `0 || 2` fell back to 2.** Udval's effective YOE for filtering was 2, not 0.7. So `2 < 3 - 1.5 = 1.5` was false → not skipped. Fixed: `parseFloat` + `Number.isFinite && >= 0` check (accepts 0 as new-grad).

**Shipped:**
- `src/lib/auto-apply/job-matcher.ts:267` — added explicit YOE GUARDRAIL rule to LLM gate prompt with concrete examples + 1.5-yr buffer + false-positive guidance ("5 years from now we expect").
- `scripts/requeue-udvlenkhtaivan.ts`, `scripts/apply-for-cwright-galloway-capped.ts`, `scripts/apply-for-user.ts` — all three got `parseJdYearsRequired` + JD-YOE filter + `parseFloat` yoe + Sr. abbreviation in senior regex + `engineering manager` in staff+ regex + `isUrlExcluded` (Stripe intern URLs) + two-way region gate + `titleOrLocHintsNonUS` sniff. Full parity with production matcher.

**Verified live:** parseJdYearsRequired returns 3 for LaunchDarkly Observability JD. Edge cases pass: "5 years of growth" → null (false-positive avoided). `udvlenkhtaivan` re-queue with `yoe=0.7` correctly excludes both LaunchDarkly Full Stack roles.

### 21. React-select v5 dropdown handler + fast-fail (Apr 18, DEPLOYED main `1698dbf`)
**Motivated by:** `udvlenkhtaivan` session had 8 of 10 jobs fail, 5-6 of those on the same Greenhouse EEO dropdown. Investigation via Playwright on Webflow's live form: existing `selectStaticDropdown` strategies all use Playwright's `.click()`, which react-select v5 ignores (it binds `onMouseDown` not `onClick`). Typed-filter path also breaks when search prefix doesn't match the option ("Prefer not" doesn't filter "I do not want to answer").

**Shipped:**
- **`worker/src/apply-engine.ts` Strategy D (~line 1031):** queries options by react-select v5 ID pattern `[id^="react-select-{cb-id}-option-"]`, dispatches `mousedown → mouseup → click` event chain. Verified live on Webflow disability dropdown — selected option-1 ("No, I do not have a disability") correctly.
- **Disability default flipped to "No I don't" (apply-engine.ts:1881-1889).** Pattern `/^No,?\s*I do not have|^No,?\s*I don.t have|.../i` selects the actual option text on Webflow ("No, I do not have a disability and have not had one in the past") instead of the previous "Prefer not" path that resolved to non-existent text. Honors explicit non-decline applicant settings (e.g. "Yes, I have a disability").
- **Fast-fail per normalized field (apply-engine.ts:2499+).** `fieldKey` normalized aggressively (lowercase, strip `Required` / punctuation) so "Disability Status", "disability status", "Disability Status *" share one counter. Dropdowns capped at 2 attempts (text fields stay 3) — broken dropdowns cost ~1 min per cycle and never resolve.
- **Anthropic added to BLOCKED_COMPANIES** (`src/lib/auto-apply/job-matcher.ts:332`, `scripts/apply-for-user.ts`, both ad-hoc requeue scripts). Their Greenhouse hit us as stuck-page.

### 20. Trial-cap conversion banner + early-end endpoint + cap=5 + admin trial pill + post-trial review page (Apr 18-19, DEPLOYED main `e51ccd8`/`b9bf14c`)
Bundled trial-flow improvements:

- **Trial cap dropped 10 → 5** (mirrors legacy free tier). `src/lib/subscription.ts:113`, `worker/src/browse-loop.ts:374,511`. Five literal-edit fix + 4 log-message updates.
- **TrialCapReachedBanner** (`src/components/TrialCapReachedBanner.tsx`, mounted on `src/app/profile/applications/ApplicationsDashboard.tsx`). Fires when `subscriptionStatus === 'trialing' && monthlyAppCount >= 5`. Copy applies marketing-skill frameworks (endowment, loss aversion, anchored CTA, single-button Fogg). One-click upgrade-now button POSTs to a new `/api/stripe/end-trial` endpoint that calls `stripe.subscriptions.update({ trial_end: 'now' })` + optimistically writes `subscriptionStatus = 'active'` locally to close the webhook race.
- **Admin trial pill** (`src/app/admin/auto-apply/UserTable.tsx`). Trialing users now render with an amber "trial" pill instead of the same blue "starter" pill paid users get. New "Trial" filter button between Free and Starter; counts split. Includes `subscriptionStatus` in the user select on `page.tsx`.
- **Post-trial-checkout review page** (`/onboarding/review`). New page that fires after Stripe trial-start success_url. Shows the 9 resume-extracted fields prefilled (firstName/lastName, phone, linkedinUrl, currentTitle, currentEmployer, yearsOfExperience, school, degree). Required-first-time gate via `User.detailsReviewedAt = null`. Save → POST `/api/profile/review` → set timestamp → redirect to `/profile/applications`. Subsequent visits show "Skip for now". Stripe `success_url` switches to `/onboarding/review?session_id=...` for trial-start; Pro upgrades unchanged.

### 19. applicationEmail backfill + worker defense-in-depth (Apr 18, DEPLOYED main `11ff361`)
**Motivated by:** First `c.wright-galloway` canary post-verification-fix returned 0/14 with the same "Verification code not received" pattern. Investigation: her `applicationEmail` was NULL, so the worker fell back to her real `c.wright-galloway@benedict.edu` address. SendGrid Inbound Parse only routes `@apply.theblackfemaleengineer.com` mail; her real inbox never gets read by the worker → verification gate always fails.

**Root cause:** `ensureApplicationEmail()` (added Mar 28, commit `7c80721`) is only called by 4 API routes. Sessions queued via direct DB writes / scripts skip provisioning. Cohort scan found **380 onboarded users with NULL applicationEmail**.

**Shipped:**
- `scripts/backfill-application-emails.ts` (new). Dry-run-by-default. Provisions `u-{userId.slice(0,8)}@apply.theblackfemaleengineer.com` per the existing helper format. Handles intra-batch + DB collisions (12-char fallback). **Ran on Apr 18: 380 written, 0 failed, 0 collisions.**
- `worker/src/browse-loop.ts:processNextBrowseSession` (~line 232): after fetching user profile, if `applicationEmail` is null, calls new local `ensureApplicationEmailOnUser(userId)` helper that mirrors the Next.js `ensureApplicationEmail` but uses the libsql client. Defense-in-depth: any future session queued via direct DB write still gets a provisioned email before the first apply.

**Canary result:** Re-ran `c.wright-galloway` with applicationEmail provisioned + verification fix live. **3/3 successful applies before hitting the 3-cap** (Affirm, Stripe, Coinbase patterns). 0/14 → 3/3 confirmed end-to-end.

### 18. Heartbeat-based session watchdog (Apr 18, DEPLOYED main `7e00753`)
**Motivated by:** `jain1009@purdue.edu` AI/ML Engineer session: 30 jobs found, watchdog reset after only ~5 applied. Old watchdog at `worker/src/browse-loop.ts:103-126` filtered by `startedAt < now - 30 min` with no liveness signal. Healthy long sessions (30 jobs × 5 min = 150 min) got killed mid-progress.

**Shipped:**
- **Schema:** `BrowseSession.lastHeartbeatAt DateTime?` + composite index `(status, lastHeartbeatAt)`. Migration via `scripts/add-browse-session-heartbeat-column.ts` (idempotent ALTER + CREATE INDEX IF NOT EXISTS).
- **Worker `heartbeat()` helper** writes `lastHeartbeatAt = new Date().toISOString()` (ISO format — Prisma 6's libsql adapter rejects SQLite default `"YYYY-MM-DD HH:MM:SS"` with P2023, broke /admin/auto-apply briefly when first deployed; hot-fixed with ISO writes + clear-bad-heartbeat-format script).
- **Atomic claim** writes `lastHeartbeatAt = ?` (ISO param) at the same time as `startedAt`.
- **6 heartbeat call sites:** session claim, before each `applyToJob` (fast path + retry queue + legacy path), after each result handler before `delay`.
- **Watchdog rewrite:** three OR'd conditions — heartbeat stale > 20 min, OR (NULL heartbeat AND startedAt > 30 min, backwards compat), OR (startedAt > 6 hours, absolute cap). Uses ISO threshold computed in JS for the lastHeartbeatAt comparison.
- **Counter flush:** when watchdog fires, also marks `applying`-status discoveries as `failed` with `[session-watchdog] Session reset before this job finished` and increments `jobsFailed`. Fixes pre-existing undercount where orphaned `applying` rows stayed forever.

### 17. Verification-code success-rate fix (Apr 18, DEPLOYED main `2047abd`)
**Motivated by:** `c.wright-galloway@benedict.edu` ran two back-to-back sessions with **0/14 applies** (PM 0/6, Project Manager 0/8). The dominant pattern (8/14 = 57%) was "Verification code not received within timeout" on Greenhouse customers (Affirm, ClickHouse, GitLab, Airtable, Chime). Pattern has been recurring for months. Root cause: 60s wait window + 3s poll interval was shorter than the SendGrid Inbound Parse → Turso → poll roundtrip; emails were arriving but the worker had already given up.

**Shipped:**
- **`worker/src/verification.ts` rewrite.** Wait window 60s → 240s, poll interval 3s → 1.5s. Returns structured `VerificationResult` (code, elapsedMs, pollCount, inboundEmailCountInWindow). Broader code-extraction regex covering 6-digit codes (Lever, Workday) and codes wrapped in `<td>` / `<span>` tags.
- **`worker/src/apply-engine.ts handleVerificationCode` rewrite.** After the primary 240s wait, hold the page open and poll one more 60s as in-line rescue. Threads `verificationTelemetry` through all 8 return paths so browse-loop can surface it.
- **`worker/src/browse-loop.ts` retry queue (fast path).** Verification-timeout failures are collected during the main loop and retried once at the end of the session, with quota re-check. Counters adjust on retry success. **Verification-timeout only** — 12-min app timeouts are NOT retried because page state is unknown (could cause duplicate apply).
- **`src/app/api/webhooks/inbound-email/route.ts` near-miss telemetry.** When a verification email arrives, checks for matching verification-timeout BrowseDiscovery rows in last 30 min and writes `worker:near-miss-verification` to ErrorLog. Lets us tune the wait window empirically — if entries appear, the email arrived after the new 240s + 60s rescue ran out.
- **`src/lib/log-error.ts` + `worker/src/error-log.ts`.** Added `"near-miss-verification"` to `ServerErrorKind` union; both args interfaces gained an optional `metadata: Record<string, unknown>` field.
- **`worker/test/verification.test.ts` (new).** 12 unit tests for `extractVerificationCode` covering Greenhouse 8-char, Lever/Workday 6-digit, table-wrapped codes, keyword anchors, and skip-list safety.

**Live test (integration test user, same 4 verification-prone Greenhouse roles):**
- Affirm: Senior Product Manager, Financial Reporting → **applied**
- ClickHouse: Senior Technical Product Manager - Core Database → **applied**
- GitLab: Senior Product Manager, Hosted Runners → **applied**
- Airtable: Associate Program Manager, Digital Programs (Contractor) → **applied**
- **4/4 success in 16 minutes** (~4 min avg). Zero verification timeouts, zero near-miss entries. The in-line rescue and retry queue weren't even needed — the new 240s primary wait was sufficient. Same role set previously failed 0/14 for c.wright-galloway.

**New scripts:**
- `scripts/queue-test-verification-session.ts` — queue a session for the integration test user against a hard-coded list of verification-prone Greenhouse jobs. Promotes test user to starter/active for the run.
- `scripts/check-verification-test-status.ts <sessionId>` — surfaces per-discovery status, verification telemetry from steps trace, near-miss-verification entries, and verification-timeout failures.
- `scripts/reset-test-user-after-verification-test.ts` — restores the integration test user to free/inactive after a test run.

**Deferred (not in this fix):**
- Pre-form title sanity check for Twilio "Cannot proceed" cluster (1 of 14, role mismatch on Principal vs PM)
- Veteran-status dropdown widening on Webflow (1 of 14, `selectDropdown` regex doesn't catch all option text variants)

### 16. Freemium -> 7-Day Free Trial (Apr 17, branch `seven-day-trial`, DEPLOYED `bfewebsite-e3d8j0oiz` + polish `bfewebsite-qk8wi2z5a`)
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

**Backfill (RAN ON TURSO Apr 17):**
- `scripts/backfill-free-tier-ends-at.ts` - one-time, dry-run-by-default. Ran `--apply` against Turso Apr 17. **473 free-tier users patched, all walled at `2026-05-01`** (uniform, no one gets locked out early). 4 paying users auto-skipped. 3 users skipped by role filter (2 admins + 1 test).
- **Wall date fix before apply:** initial logic used `firstOfNextMonth(monthlyAppResetAt)` which computed April 1 walls for users whose resetAt was in March — would have walled them immediately. Fixed to `max(firstOfNextMonth(resetAt), firstOfNextMonth(now))` so everyone gets at least until the first of next calendar month from today.

**Stripe dashboard config (Naya, Apr 17):**
- Customer Portal: Cancellations enabled, both Starter + Pro added to subscription products for plan switching, proration = "Charge or credit the full difference", charge timing = immediately, **"When downgrading" = Update at end of billing period** (so mid-cycle downgrade from Pro to Starter stays on Pro until renewal, no partial refunds).
- Stripe auto-reminder email (trial ends in 7 days) NOT enabled — would fire on day 0 of our 7-day trial, useless. Day-6 "trial ends tomorrow" reminder is a future follow-up.

**Production preview email:** Sent live to `nayaunitybere@gmail.com` Apr 17 via Resend (message id `eab14769-...`) using the same template the cron fires. Copy approved.

**Post-deploy polish (Apr 17, commit `857905c`, deploy `bfewebsite-qk8wi2z5a`):**
- **Trial 10-app cap.** `canApply()` in `src/lib/subscription.ts` and the worker quota check in `worker/src/browse-loop.ts` both override the 100-app Starter limit to 10 when `subscriptionStatus === "trialing"`. After Stripe flips to `active`, the full 100 unlocks. Prevents users from burning through Starter inventory during the free 7 days. Edge case noted but not solved: a trial that spans a calendar month boundary could get ~20 total apps because `monthlyAppCount` resets at the boundary; rare enough to accept.
- **Dashboard cleanup.** Removed the duplicate "You've used all 5 free applications — limit resets next month" upsell block (old ApplicationsDashboard.tsx:481-540). TrialRequiredBanner is now the single CTA for free users at the wall. "Resets next month" was a lie under the new model anyway.
- **FAQ copy.** `src/components/landing/FAQSection.tsx` "Is this free?" rewritten to "Is there a free trial?" with the 7-day + $29 breakdown. Old copy described the now-defunct 5-app free plan.

**Verification done locally:**
- `npm run build` passes (route map shows `/api/cron/free-tier-sunset-warning`).
- Worker `tsc --noEmit` passes.
- Pricing page rendered visually, free tier card gone, Starter shows "7-day free trial, $0 today", FAQ updated.
- Apply-gate logic spot-checked against seeded test users (warning, blocked, trialing-8/10, trialing-10/10, active-starter) — correct behavior in every case.
- Sunset email rendered against real prod data (Jovonne, 5,231 active jobs) and sent to Naya's inbox for approval.

**Post-deploy verification:**
- Cron endpoint hit: `curl /api/cron/free-tier-sunset-warning` returns `{"candidateCount":0,"sent":0}` (correct — wall date is May 1, no users within 3-day window yet). Cron will start finding candidates ~Apr 28.
- FAQ at `/auto-apply/landing` visually confirmed new copy live.

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
Phase 2 `common-gates.ts` + `greenhouseDeterministicFill` now clear 90% of Greenhouse URLs. **Apr 18 update:** `selectStaticDropdown` Strategy D added for the EEO cluster — uses react-select v5 ID pattern + mousedown event chain (the prior `.click()` based strategies couldn't trigger react-select's onMouseDown handler). Verified live on Webflow disability dropdown.

### Greenhouse verification-code timeout -- RESOLVED Apr 18 (incl. canary)
60s wait window was below the SendGrid Inbound Parse → Turso → poll roundtrip. Raised to 240s + 60s in-line rescue + one-shot session-end retry. See section 17. **c.wright-galloway canary 3/3 successful applies after the fix + applicationEmail backfill (section 19) — was 0/14 before.**

### Session watchdog killed legitimate long sessions -- RESOLVED Apr 18
Old 30-min `startedAt`-based watchdog killed healthy 30-job sessions mid-progress. Replaced with heartbeat-based gate (20-min staleness + 6-hour absolute cap). See section 18.

### applicationEmail NULL for legacy users -- RESOLVED Apr 18
380 onboarded users were silently failing all verification-gated applies because their applicationEmail was never provisioned (feature added Mar 28 but only 4 API routes called the helper). Backfilled all 380 + added defense-in-depth in worker. See section 19.

### Trial conversion at 5/5 has no in-product CTA -- RESOLVED Apr 18
Trialing users hitting cap saw only UsageMeter's generic "Limit reached. Upgrade." link. New TrialCapReachedBanner + `/api/stripe/end-trial` endpoint (one-click upgrade, ends trial via Stripe + optimistic local write). See section 20.

### Title-only seniority filtering misses JD-stated YOE -- RESOLVED Apr 19
Generic-titled jobs with high YOE requirements in the description (e.g., LaunchDarkly "Full Stack Engineer" + JD says "3+ years") slipped through. Both production matcher (LLM gate prompt rule) and all 3 ad-hoc scripts (regex helper) now enforce JD-YOE with a 1.5-year buffer. See section 22.

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

### Walmart catalog yields zero useful inventory -- NEW Apr 26
Walmart Workday board has 2,000 postings but only 7 active tech jobs after `isTechRole` filter + offset<500 cap, all senior FT mostly Bangalore/Chennai. SE interns posted via separate university recruiting flow, not Workday. Recommend reverting Walmart from `auto-apply-companies.json` and not re-adding until the inventory shape changes. See Apr 26 Next Steps Priority A.

### Multi-tenant Workday wizard not implemented -- NEW Apr 26
`worker/src/workday/index.ts:68` hard-routes to Walmart-only. Adobe / Salesforce / Capital One are recognized as Workday tenants (`findTenant` returns their config) but the wizard call falls through to `workday-wizard-not-implemented:${tenant.name}`. Adobe additionally fails inside `auth.ts` because Walmart-tuned signup selectors miss Adobe's form. Each new tenant needs ~1-2 hours of bespoke wizard + auth-overrides work. See Apr 26 Next Steps Priority E.

### Stale WorkdayCredential rows for test user encrypted with local-dev key -- NEW Apr 26
Today's smoke runs created rows in prod Turso `WorkdayCredential` for the test user `1d16e543-...` using the **local-dev** `WORKDAY_CREDENTIAL_KEY`, not the prod key (`9c3eec9d53f4`). Prod code path will be unable to decrypt them. Affected hosts: walmart, adobe, capitalone, possibly salesforce. Cleanup query in Apr 26 Next Steps Priority B. Doesn't affect any real user (no real users have used Workday yet).

---

## Next Steps (Prioritized)

### Apr 26 — Revised pickup priorities (supersedes the Apr 25 plan below)

After today's findings, the Apr 25 Step-1-through-6 plan is partially obsolete. Steps 1-3 are done. Step 4 (Walmart catalog) is recommended-revert. Step 5 (deploy) is still gated on a deploy decision, but the *content* of the deploy has changed: Workday code stays dormant in prod (wizard hard-coded to Walmart-only at `worker/src/workday/index.ts:68`, no Walmart in catalog → no Workday URLs in matcher → `runWorkdayApply` never fires). What WOULD ship is meaningful on its own: internship-only matching + the 13 Phase B+C non-Workday catalog additions (Brex/Faire/Anduril/Pinterest/Instacart/Lattice/Mercury/Robinhood/Discord/MongoDB/Coursera/Box/Pinecone).

#### Priority A — Decide working-tree fate (15 min)

Working tree has 4 modified files. Choices per file:

1. `src/data/auto-apply-companies.json` — **revert Walmart entry**. 7 senior FT jobs, mostly non-US, will get zero matches. Re-add when Walmart's college pipeline gets onto Workday OR when a senior-FT cohort exists.
2. `src/lib/scrapers/workday.ts` — **revert two-pass scrape**. Didn't help Walmart (no SE interns exist on its board), untested elsewhere, churn for unclear value. Re-introduce if Adobe scraping shows a similar pattern.
3. `worker/src/workday/tenants.ts` — **keep the +3 entries** (Adobe + Salesforce + Capital One with corrected `wd12+Capital_One`). Cheap, harmless when wizard is unimplemented (router falls through cleanly), saves rework when each tenant's wizard exists. The Capital One config correction is itself the durable artifact (Phase C had the wrong shard).
4. `worker/test/integration/smoke-companies.ts` — **revert SMOKE_FRESH_EMAIL block**, **keep Capital One config fix + WORKDAY_ONLY_CANDIDATES addition**. The fresh-email path was a one-shot harness workaround; the Capital One stuff is durable.

#### Priority B — Clean up poisoned WorkdayCredential rows (10 min)

Today's smoke runs created WorkdayCredential rows in prod Turso for the test user `1d16e543-...`, encrypted with the **local-dev key** (not the prod key `9c3eec9d53f4`). Those rows are now unreadable by prod code. Specifically the test user has rows for: Walmart (recon-d9180c13 from Step 1), Walmart (recon-6fdb7f22 — wait, no, getOrCreateCredential reuses the original; actually only 1 row per (userId, host)), Adobe (recon-6fdb7f22), Capital One (recon-6fdb7f22). Salesforce *might* also have one (auth completed before wizard bailed).

```bash
# Inspect first
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
npx tsx -e "
import { createClient } from '@libsql/client';
const c = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const r = await c.execute(\"SELECT id, userId, tenantHost, email, createdAt FROM WorkdayCredential WHERE userId = '1d16e543-db6e-497b-b78b-28fbf0a30626'\");
for (const row of r.rows) console.log(row);
"
# Then DELETE them (they're encrypted with the local-dev key, can't be decrypted by prod):
# DELETE FROM WorkdayCredential WHERE userId = '1d16e543-db6e-497b-b78b-28fbf0a30626';
```

This won't break prod (no real users have Workday rows yet — only the test user did smoke runs).

#### Priority C — Ship what we have (30 min, awaiting "deploy")

Per CLAUDE.md no-auto-deploy: wait for explicit "deploy" from Naya. When greenlit, ship `auto-apply-saas` → `main` → `vercel --prod`. Content of deploy:
- Internship-only matching (live impact: 10 backfilled `seekingInternship` users start matching internship listings only; new signups via `/start` and `/onboarding/review` capture the toggle; profile UI exposes it; reclassifier already flipped 144 jobs to Internship type so catalog has ~88 active internships)
- 13 Phase B+C non-Workday catalog additions (Brex/Faire/Anduril/Pinterest/Instacart/Lattice/Mercury/Robinhood/Discord/MongoDB/Coursera/Box/Pinecone) — already in `auto-apply-companies.json` from Apr 25
- Workday code path live but DORMANT in prod (no Workday URLs in catalog after Walmart is reverted, so `runWorkdayApply` never fires)
- `WORKDAY_CREDENTIAL_KEY` already installed in both envs, ready when needed

After deploy: **24h watch** on `/admin/errors` for matcher regressions on internship matching (NOT for `worker:workday:*` since Workday won't get traffic). Watch metrics:
- Daily-apply cron output for the 10 seekingInternship users — should see them get matched to internships only
- No regression in other users' match counts

#### Priority D — Pivot for "more companies on platform"

Naya's stated goal in Apr 26 session. Two paths, ranked by ROI:

**D1. Greenhouse/Lever/Ashby breadth (high ROI, quick wins).** These ATSes go through the generic Claude agent loop — no per-tenant code. The smoke harness's broader `CANDIDATES` list already covers many. Add more well-known engineering employers using these ATSes (e.g., Reddit, Substack, Replit, Anthropic, Hugging Face, GitHub, GitLab, Cloudflare adjacencies, Datadog adjacencies that share boards). Each candidate = 5-10 min of smoke time. A 2-hour focused smoke session should add 10-20 companies.

**D2. Workday tenant-by-tenant (low ROI, hours each).** Adobe is the highest-value Workday target (real SE interns) but auth.ts needs Adobe-specific field overrides. Salesforce + Capital One need wizard implementations. Each = 1-3 hours. Recommend pausing this until D1 saturates.

#### Priority E — Deferred Sprint 2/3 follow-ups

- Adobe tenant onboarding (auth.ts field overrides, smoke, wizard generalization). Once auth works, Adobe's wizard structure is similar to Walmart's per the API probe — likely cheaper than Salesforce/Capital One.
- Salesforce + Capital One wizards. Sprint 2.
- Snowflake / ServiceNow / Cisco / Intuit siteName discovery. Their careers pages don't expose Workday URLs in HTML (JS-bootstrapped). Need to navigate via Playwright and scrape the bootstrap JSON. Sprint 3.

---

### Apr 25 work — original pickup steps (mostly obsolete after Apr 26)

The Apr 25 session ended with a working Workday POC (real Walmart submission) but **none of the new code is deployed**. Prod still runs the pre-Apr-25 matcher and worker. Pick up here in order:

#### Step 1 — Validate the production code path (~30-60 min, blocks everything else)

The recon (`worker/test/integration/recon-walmart-wizard.ts`) proved the patterns end-to-end. Tonight's `worker/src/workday/wizard.ts` is a consolidation of those patterns into the production flow (`applyToJob` → `runWorkdayApply` → `wizard.ts`). That consolidated path was NOT smoke-tested with the same user state.

```bash
# 1. Generate prod Workday master key (do NOT reuse the local-dev key from the Apr 25 transcript)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Save it. Add to Vercel env (production) and Railway env. Local dev .env can use any 64-hex value.

# 2. Run smoke through the production path. Easiest: pick a Walmart intern URL the test user
#    HAS NOT applied to before (Walmart blocks duplicate applications per user). Use a
#    company-internal email override OR delete & recreate the test user's applicationEmail
#    (KNOWN GOTCHA noted in section 28).
cd worker
SMOKE_WALMART_ONLY=1 \
  WORKDAY_CREDENTIAL_KEY=<your local hex key> \
  WORKDAY_DEBUG=1 \
  DATABASE_URL=$(grep DATABASE_URL ../.env.production | cut -d'"' -f2) \
  DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN ../.env.production | cut -d'"' -f2) \
  ANTHROPIC_API_KEY=$(grep '^ANTHROPIC_API_KEY=' ../.env.vercel-prod | sed 's/^ANTHROPIC_API_KEY=//;s/^"//;s/"$//;s/\\n$//' | tr -d '\r' | tr -d '\n') \
  INTEGRATION_TEST_USER_ID=1d16e543-db6e-497b-b78b-28fbf0a30626 \
  HEADLESS=true \
  DRY_RUN=true \
  npx tsx test/integration/smoke-companies.ts

# Expected: smoke logs the wizard reaching Review under DRY_RUN. The "submit" button is NOT clicked.
# If it fails: compare with the proven recon at recon-walmart-wizard.ts. The deltas should be zero.

# 3. Once DRY_RUN passes, run without DRY_RUN against a DIFFERENT Walmart intern URL than the
#    POC submission used (the POC went to "Summer 2026 Corporate Intern - Fellowship, Global
#    Public Policy"). One-off: edit smoke-companies.ts to hit a specific URL, OR re-target.
```

#### Step 2 — Add `WORKDAY_CREDENTIAL_KEY` to prod env

- Vercel: env vars → Production scope → add new var
- Railway: variables tab → add new var
- Same value in both. Treat like `ALERT_SECRET` — never rotated lightly because rotation invalidates every encrypted password row.

#### Step 3 — Backfill `seekingInternship` (small cohort, low-risk)

```bash
# Dry-run, eyeball the 10 flagged users (incl. IniAbasi)
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
  DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
  npx tsx scripts/backfill-seeking-internship.ts

# Then apply
DATABASE_URL=... DATABASE_AUTH_TOKEN=... npx tsx scripts/backfill-seeking-internship.ts --apply
```

#### Step 4 — Add Walmart to `auto-apply-companies.json`

Once Step 1 smoke passes, edit `src/data/auto-apply-companies.json` and append:
```json
{
  "name": "Walmart",
  "slug": "walmart",
  "careersUrl": "https://walmart.wd5.myworkdayjobs.com/WalmartExternal",
  "industry": "Retail",
  "atsType": "workday",
  "atsConfig": {
    "baseUrl": "https://walmart.wd5.myworkdayjobs.com",
    "company": "walmart",
    "siteName": "WalmartExternal"
  }
}
```
Then run `scripts/run-scrape-locally.ts` to ingest Walmart's ~2,000 jobs.

#### Step 5 — Deploy

Vercel `vercel --prod` from main. Railway auto-deploys from `auto-apply-saas` branch (currently synced with main per branch table). Per CLAUDE.md: `vercel --prod` MUST run from main; switch back to working branch immediately after.

#### Step 6 — 24-hour watch

Filter `/admin/errors` to `worker:workday:*`. If error rate > 30% in first 100 attempts, hot-fix is to remove Walmart from `auto-apply-companies.json` and re-deploy.

#### Step 7 (Sprint 2) — Salesforce + Adobe (~2-3 days)

Both have validated APIs (Phase C smoke confirmed). Add to `worker/src/workday/tenants.ts`. Smoke each. Each tenant likely has a few different field IDs and step-3 questions — extend `answerForApplicationQuestion()` heuristics in `wizard.ts` as new questions surface.

After both pass smoke: add to `auto-apply-companies.json`, scrape, deploy.

#### Step 8 (Sprint 3) — Crack the 5 Workday tenants that 422'd

Snowflake, ServiceNow, Cisco, Capital One, Intuit. Build `worker/test/integration/discover-workday-sitename.ts`: scrape the public careers page HTML, find the bootstrap config (Workday emits the actual tenant/siteName as JSON in a `<script>` tag with `id="wd-page-content"` or similar). Feed correct siteName back into smoke. Each will likely take 1-2 hours of debugging.

#### Step 9 — LLM fallback for unknown step-3 question patterns

Walmart's hand-coded heuristics in `answerForApplicationQuestion()` worked. Salesforce/Adobe/etc. will have new questions our regex doesn't match. When the wizard sees a Q with no heuristic match, send `(question, options)` to Claude Haiku and pick. Cheap (~50 input tokens). This unblocks the long tail of tenant-specific oddball questions without hand-rolling per-tenant heuristics.

#### Step 10 — IniAbasi reply email

Hold the draft until Step 5 deploy is verified. Update copy to mention Walmart specifically (the original draft was generic). Don't send emails without explicit Naya approval (`feedback_never_send_emails`).

---

### 0. Pre-form title sanity check (deferred from Apr 18)
Compare `document.title` / H1 against queued `job.title` after navigation; bail early with `role-mismatch` for "Principal Project Manager" vs "Project Manager" mismatches. Fixes the Twilio cluster (~7% of c.wright-galloway's original 0/14 failures). Cheap fix, ~1 hour.

### 0a. Veteran-status dropdown widening (deferred from Apr 18)
`worker/src/common-gates.ts:98` regex misses "I prefer not to answer" / "Decline to self-identify" variants on Webflow. The new Strategy D dropdown handler (section 21) catches this for general react-select cases, but `common-gates.ts` is the deterministic pre-pass — should mirror the new defaults pattern.

### 0b. Contentful (and similar) job-row scrape-duplication (Apr 19)
Catalog has 6 distinct rows for what looks like the same Contentful "Security Engineer (Application Security)" posting (different applyUrls). Worker's URL dedup catches them as separate jobs and applies to all. Recruiters get duplicate apps. Worth investigating the scraper's dedup logic.

### 0c. Ad-hoc scripts duplicate matcher logic (Apr 19 tech debt)
`scripts/apply-for-user.ts`, `scripts/requeue-udvlenkhtaivan.ts`, `scripts/apply-for-cwright-galloway-capped.ts` each carry their own copy of seniority/YOE/region/URL filters. Bug pattern surfaced 3x today (forgot Sr. abbreviation, missed JD-YOE, parseInt-not-parseFloat). Long-term fix: extract the per-job filter chain into a non-`server-only` shared helper that all paths import. ~1-2 hours.

### 0d. Worker doesn't respect mid-flight session cancellation (Apr 19 tech debt)
`browse-loop.ts` reads `matchedJobs` JSON into memory at session-claim time, then iterates. Cancelling the session via DB write doesn't stop the worker — it keeps applying. Pinterest "Sr. Software Engineer, Backend" was applied for udvlenkhtaivan AFTER I cancelled the session containing it (the session that had pre-Sr.-fix matches). Suggested fix: worker checks `session.status` between jobs in the loop; if `cancelled`, break.

### 1. Monitor the trial conversion funnel (Apr 17 onward)
- **Apr 28**: sunset cron starts firing 3-day warning emails (wall is May 1 for all 473 existing free users). Monitor Resend send rate + any delivery failures.
- **May 1**: existing free users hit the in-app wall. Watch `/admin/errors` for trial-required paths.
- **New signups**: watch Stripe dashboard → Trials for trial starts. Day 8 conversion rate is the key metric.
- If Stripe starts reporting many canceled trials before day 8, investigate the checkout experience and day-6 reminder email (not yet built — see follow-up below).

### 2. Day-6 "trial ends tomorrow" reminder email (follow-up)
Stripe's built-in trial reminder is hardcoded at 7 days, useless for our 7-day trial. Build our own cron that fires when `subscriptionStatus=trialing` AND `currentPeriodEnd` is within 24h. Likely lifts conversion by reducing involuntary churn (forgot to cancel or forgot to swap card).

### 3. Decide on paid Browserbase ($99/mo Scale tier for residential proxies)
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

### 7. Analyze new-onboarding conversion (scheduled 2026-05-01)
Compare conversion since Apr 17 (new `/start` resume-first flow + card-required 7-day trial) against the ~30 days prior (old wizard flow + permanent 5-app free tier). Two-week window should be enough to see signal.

Core metrics to pull:
- **Visit → Signup**: `PageVisitor` hits on `/auto-apply/get-started` or `/get-started` (pre-Apr 17) vs `/start` (post) → `User` rows created in the same window.
- **Signup → Onboarding completed**: `User.createdAt` → `User.onboardingCompletedAt` set.
- **Onboarding completed → Trial started**: `User.stripeCustomerId` present AND `User.subscriptionStatus IN ('trialing', 'active')`.
- **Trial started → Paid**: `User.subscriptionStatus = 'active'` on day 8+.

**Known confound:** old-flow cohort had a permanent free tier (no card required), new-flow cohort has a 7-day card-required trial. Cannot isolate "new onboarding UI" effect from "card-required trial" effect — report the bundle as one intervention.

For the new-flow cohort only, also use `Activity` rows where `type = 'onboarding_step'` (linked by `tempId` in metadata JSON) to see where users drop off within the funnel — steps 0-7 defined in `src/app/start/StartClient.tsx`. Old-flow step events lack session association so mid-funnel drop-off is not recoverable pre-Apr 17.

Context: follow-up to the resume-first-onboarding + 7-day-trial deploys on Apr 17, 2026.

---

## User Stats (as of Apr 19)
- **473 free-tier users walled at May 1** (post-backfill; see section 16)
- **4 paying subscribers** -- Brian McLaren ($14.50), Anika Ahmed ($29), Daniel Cooke ($29), Knight Kimosop ($29) -- all Starter tier, tier=starter status=active, NOT affected by trial cap
- **~119 onboarded users** (the autoApplyEnabled backfill list)
- **142 fully-onboarded free-tier users** (per `scripts/count-free-under-cap.ts`); 68 still under the 5-cap, 74 capped (52% capped rate)
- **380 users had applicationEmail backfilled Apr 18** — were silently failing all verification-gated applies before the fix
- **~8,800 active jobs** in catalog
- **5 late-upgrade emails sent** (sharayu699, samayo.dev, rranjan07th, msadiknur, adepitandavid) -- $14.50 promo with STARTER50 coupon
- **328 onboarding-dropoff emails sent**
- **1 sunset-email production preview sent** (Naya's personal `nayaunitybere@gmail.com`, Apr 17 — this was a one-off; she is still in the 473-user cohort that will be re-emailed by the cron around Apr 28)
- **17 cap-conversion candidates identified** for automated drip (digest sent to Naya for approval)
- **0 new cap-hit candidates between Apr 17 7am MT digest and Apr 18 evening** (per `scripts/check-cap-hits-since-last-digest.ts`)
- **Cohort success rate (post-Phase 2 + Apr 18 verification fix): expect lift from ~64% baseline. c.wright-galloway canary 3/3 post-fix vs 0/14 pre-fix.**

## Admin Users
- **Nyaradzo (Naya)** -- `admin` (full access)
- **Sarah Comlan** (`Sarah.comlan@gmail.com`) -- `operations`

## Admin Pages
- `/admin` -- main dashboard, shows AdminAlert red banner at top
- `/admin/errors` -- central error log, includes worker errors under `worker:*` endpoints (also `worker:near-miss-verification` from Apr 18)
- `/admin/scrape-runs` -- last 7 days of scrape executions
- `/admin/stuck-fields` -- top failure clusters
- `/admin/apply-exclusions` -- URL patterns excluded by the matcher
- `/admin/integration-runs` -- integration suite run history
- `/admin/cap-conversion/[token]` -- cap-hit conversion email approval page (linked from daily digest email)
- `/admin/auto-apply` -- auto-apply session overview. **Apr 18:** trialing users now show distinct amber "trial" pill (vs blue "starter" for paid). New "Trial" filter button between Free and Starter.

## Automated Emails
| Email | Trigger | Recipients |
|---|---|---|
| Cap-conversion digest | Daily 7am MT cron | theblackfemaleengineer@gmail.com (approval link) |
| Paying-user report | Daily 7:30am MT cron | theblackfemaleengineer@gmail.com |
| Cap-conversion send | Admin clicks "Send all" on approval page | Capped free users (per-user 72h coupon) |

## Diagnostic Resources
- Worker startup log: search Railway deploy logs for `"event":"browser_binary"` to verify Chromium binary path
- Failure screenshots: every stuck/timeout failure uploads a full-page PNG to Vercel Blob
- One-off scripts: `scripts/apply-for-user.ts <userId>`, `scripts/send-late-upgrade-email.ts [--test|--send]`, `scripts/send-onboarding-dropoff-email.ts`, `scripts/repair-city-location.ts`, `scripts/repair-datetime-format.ts`, `scripts/canary.ts`, `scripts/queue-test-verification-session.ts`, `scripts/check-verification-test-status.ts <sessionId>`, `scripts/reset-test-user-after-verification-test.ts`
- **Apr 18-19 additions:** `scripts/add-browse-session-heartbeat-column.ts` (one-shot ALTER), `scripts/add-details-reviewed-at-column.ts` (one-shot ALTER), `scripts/clear-bad-heartbeat-format.ts` (hot-fix for non-ISO heartbeat values), `scripts/backfill-application-emails.ts [--apply]` (provisions u-{shortId}@... for users with NULL applicationEmail), `scripts/count-free-under-cap.ts` (free-tier cap distribution), `scripts/check-cap-hits-since-last-digest.ts` (gap-fill between cap-conversion digests), `scripts/requeue-udvlenkhtaivan.ts` (her ad-hoc requeue with full filter parity), `scripts/apply-for-cwright-galloway-capped.ts` (canary with 3-success cap), `scripts/refund-udval-wrong-matches.ts [--apply]` (refunds quota for senior/blocked-company applies that slipped through buggy ad-hoc script — idempotent, skips already-tagged), `scripts/check-udvlenkhtaivan-session.ts` (heartbeat + telemetry inspector for her latest session)
- Integration test user: `1d16e543-db6e-497b-b78b-28fbf0a30626` (role=`test`)
- Integration suite: `cd worker && npm test` (fixture) + `npm run test:integration` (real URLs)

## Technical Debt
- `worker/data/target-companies.json` and `scripts/target-companies.json` must stay in sync
- `.env.vercel-prod` file exists locally -- contains prod secrets, don't commit
- Per-app timeout 12 min x max 25 agent steps x 2 concurrent sessions can saturate Railway memory
- The xvfb wrapper means worker must be killed via tini for clean shutdown
- `BrowseDiscovery.createdAt` non-ISO format -- workaround in place, bulk repair pending
- **`BrowseSession.lastHeartbeatAt` MUST be written as ISO 8601** (Prisma 6's libsql adapter rejects SQLite default `"YYYY-MM-DD HH:MM:SS"` with P2023). Worker uses `new Date().toISOString()`. If you ever write to this field via raw SQL `datetime('now')`, the dashboard breaks. Hot-fix script `scripts/clear-bad-heartbeat-format.ts` NULLs bad rows.
- **Ad-hoc scripts duplicate matcher logic** (3 different `findMatches` implementations — apply-for-user, requeue-udvlenkhtaivan, apply-for-cwright-galloway-capped). Currently kept in sync by hand. See Next Steps 0c for refactor proposal.
- **Worker doesn't respect mid-flight session cancellation.** matchedJobs read into memory at claim; cancellation via DB doesn't stop iteration. See Next Steps 0d.
- `rebrowser-playwright` skipped (tops out at v1.52, we're on v1.58)
- **HANDOFF.md and CLAUDE.md still contain em-dashes** in their own body text (e.g., "all emails — user communications"). Per the no-em-dashes rule shipped Apr 18 (section 23), code/internal docs are exempt — but consistency cleanup wouldn't hurt.
- **`getOrCreateCredential` keys on `(userId, tenantHost)`, ignores caller's `applicationEmail`** (Apr 26). When the same userId hits the same Workday tenant twice with different emails (e.g., smoke runs with `SMOKE_FRESH_EMAIL=1`), the second call returns the first call's stored credential — which sends the auth flow down the existing-creds **signin** path with the ORIGINAL email, breaking when that email's account isn't actually accessible. Surfaced as Walmart's `workday-wizard-stuck-step-1` regression in Apr 26 multi-tenant smoke. Fix options: (1) include email in the lookup key; (2) have `SMOKE_FRESH_EMAIL` clean rows for the test user before each run; (3) add an `applicationEmail` arg semantic that "always overrides" the stored row. See `worker/src/workday/credentials.ts`.
- **Workday wizard is hard-coded to Walmart at `worker/src/workday/index.ts:68`** (`if (tenant.host === "walmart.wd5.myworkdayjobs.com")`). All other tenants in `WORKDAY_TENANTS` fall through to `workday-wizard-not-implemented:${tenant.name}` at line 83. Adding any new tenant requires either: (a) per-tenant wizard like `runAdobeWizard`, or (b) generalizing `runWalmartWizard` with tenant-driven field maps + question heuristics. (b) is the right answer long-term but each tenant likely has unique step-3 questions that need their own answers (see `answerForApplicationQuestion()`). Sprint 2.
- **Workday auth.ts is Walmart-tuned.** Adobe's signup form has `[data-automation-id="email"]` not appearing within 30s — different selectors. The `WorkdayFieldMap` interface in `tenants.ts` already accepts `fieldOverrides` but auth.ts may not consult it for every selector. Audit + add per-tenant overrides as new tenants come online.
- **WORKDAY_CREDENTIAL_KEY ratchet.** Rotation invalidates every existing `WorkdayCredential.passwordEncrypted` row. There's no key-rotation pathway built. If/when rotation is needed (compromise), all stored Workday passwords become unrecoverable — users would need to either reset Workday-side passwords or have the worker generate fresh signup attempts. Also: the local-dev WORKDAY_CREDENTIAL_KEYs from Apr 25 + Apr 26 transcripts have created **prod Turso rows the prod key cannot decrypt** for the test user `1d16e543-...` (Walmart, Adobe, Capital One, possibly Salesforce). Cleanup: `DELETE FROM WorkdayCredential WHERE userId = '1d16e543-db6e-497b-b78b-28fbf0a30626'` — see Apr 26 Next Steps Priority B.
