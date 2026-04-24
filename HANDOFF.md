# Session Handoff — April 14–24, 2026 (Apr 24: assistant access fix + signin restore)

## Current State

### Branches
- **main** — production code, deployed to Vercel. Head: `2023a3c` (Apr 24, login route restored + contributor role write access).
- **blog** — current working branch (Apr 24). Latest: `ec9675e` (content admin fix). Merged fast-forward to main and deployed.
- **resume-first-onboarding** — Apr 19 branch, fully merged into main.
- **seven-day-trial** — Apr 17 working branch. Fully merged and deployed.
- **cap-conversion-drip** — prior working branch. All commits merged to main.
- **auto-apply-saas** — Railway worker deploys from this branch. Head: `d32da13` (fast-forwarded to main).
- **apply-engine-fixes** — feature branch from Apr 15, 6 commits. Kept around for reference.
- **resume-builder** — the resume builder feature (not yet deployed). Head: `6e0fe3a`.
- **applications** — prior working branch, at `b43d7ac` (behind main).

### Infrastructure
- **Vercel** — frontend (www.theblackfemaleengineer.com). Most recent prod deploy: main `2023a3c` (Apr 24, deploy id `dpl_BmMUdGLbF9MY5oEmMLbE5UFEzpq8`). Earlier Apr 18-19 sequence: verification fix → watchdog → backfill → trial pill → cap=5 → conversion banner → dropdown handler → applicationEmail provisioning → JD-YOE matcher → apply-for-user.ts parity.
- **Railway** — worker (browse-loop + apply-engine). **Now runs xvfb-wrapped headed Chromium**, not headless. Dockerfile installs `tini` + `xvfb` + full Chromium binary. Memory budget ~+300MB, well within 8GB. **Note:** auto-apply-saas pushed many times Apr 18-19; deploy-induced session resets observed (worker keeps applying from in-memory matchedJobs after I cancel a session — see "Technical Debt").
- **Turso** — production database. Tables added across recent sessions: `AdminAlert`, `ScrapeRun`, `CompanyCooldown`, `StuckField`, `IntegrationRun`, `CapConversionDigest`. New columns on `User`: `resumeBuilderUsed`, `workLocations`, `conversionEmailSentAt`, `freeTierEndsAt` (Apr 17), `freeTierSunsetEmailAt` (Apr 17), **`detailsReviewedAt` (Apr 18)** for the post-trial-checkout review page. New column on `BrowseSession`: **`lastHeartbeatAt` (Apr 18)** for the heartbeat-based watchdog. Pushed via raw SQL (Prisma CLI can't push to Turso directly).
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

## What Was Done This Session (April 15-24)

### 25. Assistant access restored + password signin unblocked for everyone (Apr 24, DEPLOYED main `2023a3c`)
**Motivated by:** Naya reported her assistant `obiajuluonyinye1@gmail.com` could no longer access the admin portal (stuck on signin). Naya's intent: restore "limited" access scoped to Jobs + Blog + Links.

**What I found during investigation:**
- Her prod DB role was still `admin` (holdover from the hardcoded `AUTO_ADMIN_EMAILS` default removed on Apr 19). So her access hadn't actually been revoked by the security audit, but Naya's desired level was narrower than admin.
- `src/app/auth/signin/page.tsx:120` POSTs password login attempts to `POST /api/auth/login`. That route file was **deleted in commit `ae54073` on Apr 8** as part of "Delete 6 orphaned files / clean up tech debt". The frontend still calls it. **Password signin has been returning 404 for every caller since Apr 8.** Magic-link users (like Naya herself) were unaffected, which is why this stayed latent for 16 days.
- The `contributor` role was largely theatrical: the admin layout admits it, but every content API route (`/api/admin/jobs/*`, `/api/admin/blog/*`, `/api/admin/links/*`) uses `checkAdmin()` which returns `isAdmin: role === "admin"` — so a contributor could *see* pages but every save/edit returned 401. The `/admin/links` page itself was also stricter: `requireFullAdmin()` + `adminOnly: true` sidebar flag, so contributors never saw it at all.

**Shipped:**
- **`src/app/api/auth/login/route.ts` restored** — verbatim from `git show ae54073^`. Edge runtime, libsql web client, bcrypt compare, `setSessionCookie`. Fixes password signin for everyone, not just the assistant.
- **`src/lib/admin.ts`** — new `checkContentAdmin()` helper returning `{ allowed, session }` where `allowed = role === "admin" || role === "contributor"`. Kept `checkAdmin()` unchanged so every other admin API surface (analytics, users, errors, auto-apply, tickets, etc.) stays admin-only.
- **Content API routes swapped `checkAdmin` → `checkContentAdmin`** (and `isAdmin` → `allowed`) across 7 files: `src/app/api/admin/links/route.ts`, `src/app/api/admin/links/[id]/route.ts`, `src/app/api/admin/links/reorder/route.ts`, `src/app/api/admin/jobs/route.ts`, `src/app/api/admin/jobs/[id]/route.ts`, `src/app/api/admin/blog/route.ts`, `src/app/api/admin/blog/[slug]/featured/route.ts`, `src/app/api/admin/blog/upload/route.ts`.
- **Links page gates widened** — `requireFullAdmin()` → `requireAdmin()` in `src/app/admin/links/page.tsx`, `src/app/admin/links/new/page.tsx`, `src/app/admin/links/[id]/edit/page.tsx`. Sidebar flag flipped: `adminOnly: false` for Links in `AdminSidebar.tsx` (nav filter on line 129 now includes it for contributor).
- **Prod DB role change** — `UPDATE User SET role = 'contributor' WHERE email = 'obiajuluonyinye1@gmail.com'`. Dry-run first (selected the row, printed before/after), then applied via the standard Turso-direct-write pattern from CLAUDE.md. She now sees: sidebar Jobs / Blog / Links only, "Contributor" blue pill next to the logo, and can actually save edits (no more 401s on PUT/POST).

**NOT done (intentionally):**
- `checkAdmin()` itself was NOT broadened — blast radius kept to the three content surfaces Naya named.
- `GET /api/admin/blog/[slug]/route.ts` has no auth gate at all (audit finding M1, Apr 19). Left as-is since the plan didn't claim to fix it.
- Public `POST /api/jobs` still uses `checkAdmin()` (the H1 gate). Contributors should post via `/api/admin/jobs`, not the public endpoint.

**Verification:**
- Local: `npm run build` passes. Dev server + Playwright confirmed signin page renders, `POST /api/auth/login` responds with `LibsqlError: URL_SCHEME_NOT_SUPPORTED` (not 404 — the known file:-URL local-dev limitation from HANDOFF line 69 means this is the expected "the route runs" signal). All content API routes still 401 anon.
- Prod smoke after deploy: `curl POST /api/auth/login` with bogus creds returns `401 {"error":"Incorrect email or password"}` (was 404 before), `GET /api/admin/links` returns 401 anon as expected.

**Prod DB post-change:**
- `obiajuluonyinye1@gmail.com`: role=`contributor` (was admin)
- Privileged users (3 total): `theblackfemaleengineer@gmail.com` (admin), `obiajuluonyinye1@gmail.com` (contributor), `Sarah.comlan@gmail.com` (operations, still never logged in — latent escalation path unchanged).

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

### Password signin returned 404 site-wide for 16 days -- RESOLVED Apr 24
`src/app/api/auth/login/route.ts` was deleted in commit `ae54073` (Apr 8) as "orphaned tech debt" but the signin page still POSTed to it. Every password signin attempt returned HTML 404 that the frontend surfaced as a generic "Something went wrong" error. Magic-link path was unaffected, which is why Naya (magic-link user) never saw it. Root cause: frontend/backend split wasn't audited when the file was deleted. Restored verbatim from `git show ae54073^` in Apr 24 fix. See section 25.

### `contributor` role couldn't actually write content -- RESOLVED Apr 24
Contributor role has existed since Jan but every content API (`/api/admin/jobs/*`, `/api/admin/blog/*`, `/api/admin/links/*`) used `checkAdmin()` which only admits role=`admin`. Contributors could read pages but saves 401'd. Fixed via new `checkContentAdmin()` helper in `src/lib/admin.ts` (admits admin + contributor) — only those 7 content routes swapped; every other `/api/admin/*` surface still uses strict `checkAdmin()`. See section 25.

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

---

## Next Steps (Prioritized)

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
- **Nyaradzo (Naya)** (`theblackfemaleengineer@gmail.com`) -- `admin` (full access)
- **Naya's assistant** (`obiajuluonyinye1@gmail.com`) -- `contributor` (Jobs, Blog, Links pages only). Demoted from admin on Apr 24.
- **Sarah Comlan** (`Sarah.comlan@gmail.com`) -- `operations` (never logged in, latent escalation path)

### Role capability summary
- `admin` — everything
- `contributor` — Jobs + Blog + Links (read + write via the three content APIs which now use `checkContentAdmin()`)
- `operations` — Auto-Apply, Errors, Tickets, Onboarding pages only (no write APIs widened for this role)

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
