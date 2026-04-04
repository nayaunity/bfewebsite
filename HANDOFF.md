# Session Handoff — April 3, 2026

## Current State

### Branches
- **main** — production code, deployed to Vercel
- **applications** — current working branch (in sync with main)
- **auto-apply-saas** — Railway worker deploys from this branch. **Must be synced with main after every deploy.**
- **profile** — old branch, can be deleted

### Infrastructure
- **Vercel** — frontend deployment (theblackfemaleengineer.com)
- **Railway** — worker deployment (browse-loop + apply-engine), deploys from `auto-apply-saas` branch
- **Turso** — production database (libsql)
- **Stripe** — LIVE mode (claudecodeworkshop account). Starter $29/mo, Pro $59/mo
- **Resend** — email sending (magic links, transactional emails)

### Auth
- Switched from magic-link-only to **email/password + magic link fallback** this session
- Session strategy changed from `database` to `jwt`
- Existing users need to sign in again (old session cookies invalid)
- Signup page at `/auth/signup`, sign-in at `/auth/signin`

---

## What Was Done This Session

### Profile Page Redesign
- Full-page layout with 11 collapsible sections, each saving independently
- Unified "Roles & Resumes" section — select roles, upload resume per role, see which roles need resumes
- "Why is this important?" explainer for role-specific resumes
- "Start Applying to Jobs" CTA banner at top of profile
- Profile completion bar
- Green animated save button feedback

### Data Pipeline Overhaul
- 13 new DB fields (demographics, salary, application answers, etc.)
- All 30+ profile fields now flow through: profile → API → applicantData JSON → worker
- Question matcher expanded from 4 to 17 patterns (demographics, LinkedIn, salary, etc.)
- Worker's Claude prompt includes user's actual answers instead of hardcoded values
- Work auth/sponsorship dropdowns use actual user values

### Resume-Role Matching
- `matchUserResume()` now checks resume name against target role first
- Next-steps uploads populate keywords from role searchTerms
- Browse flow sends roleLabel for accurate matching

### Onboarding Improvements
- Added first name, last name, phone, LinkedIn, country, state, work auth, sponsorship to wizard
- OnboardingSync maps all new fields to profile on sign-in
- "Auto-apply is ready" badge (replaced "activates within 24 hours")
- "Start Applying to Jobs" CTA on next-steps page
- Project Manager added to ROLE_OPTIONS

### Worker Fixes
- Greenhouse API discovery (fast path) — uses `boards-api.greenhouse.io` JSON instead of HTML scraping
- Dropdown fallback strategies (XPath → click combobox → ancestor search)
- Blur after dropdown selection to trigger Greenhouse validation
- British spelling support ("authorised" alongside "authorized")
- Broader work auth option matching (long-form options like "I am authorised to work...")
- Dedup fix — checks `applying` status + in-memory Set + cross-flow JobApplication check
- Stripe `/apply` URL construction fix (77 failures resolved)
- ATS iframe wait time (up to 8 seconds)

### Company Expansion
- Added: Zscaler (27%), Klaviyo (33%), Abnormal Security (20%), Asana (pending test)
- Removed: Okta (0%), Intercom (0-13%), Elastic (wrong ATS), Toast (wrong ATS)
- **Important:** `scripts/target-companies.json` AND `worker/data/target-companies.json` must stay in sync

### Error Logging
- `ErrorLog` table in DB
- `logError()` utility wired into profile save, resume upload, Stripe checkout, browse validation
- Admin dashboard at `/admin/errors`

### Stripe
- Switched from test to live mode
- All test subscription data cleared from production users
- Pricing: Free (5 apps, 3 resumes), Starter $29 (100 apps, 5 resumes), Pro $59 (300 apps, 10 resumes)

---

## Known Issues / Next Steps

### Immediate
1. **Subdomain setup** — Meeting feedback wants `apply.theblackfemaleengineer.com` for the auto-apply tool. Plan written in `plans/luminous-cuddling-ripple.md` but not implemented.
2. **Asana** — Added to company list but not tested end-to-end with live applications yet.
3. **Session timeout** — Multi-company sessions timeout before finishing all companies. Users need to select 2-3 companies at a time. Could increase timeout or batch differently.

### Application Success Rates
- Databricks: 79% (best)
- DoorDash: 100% (small sample)
- Figma: 53%
- Stripe: 27-56% (improved from 2%)
- Zscaler: 27%
- Klaviyo: 33%
- Abnormal Security: 20%
- Main failure pattern: Greenhouse dropdown interactions (select_dropdown failing)

### User Issues Tracked
- TraceyLynn & Joseph emailed about incomplete profiles
- Cream emailed about 219 security roles
- Prasanna, Jovonne, Shanice emailed about profile optimization
- Stanley's applicationAnswers limit fixed (10K → 50K)

### Meeting Action Items Not Yet Done
- Email deliverability research (Mailchimp going to spam)
- SMS notifications as Pro feature
- College club outreach for growth
- "Naya" bot branding
- Subdomain structure (planned, not built)

### Technical Debt
- `worker/data/target-companies.json` is a separate copy from `scripts/target-companies.json` — must be manually synced
- `auto-apply-saas` branch must be manually synced with `main` after deploys
- Dead code: `src/components/profile/ResumesSection.tsx` (replaced by RolesAndResumesSection)
- `job-assets/application-answers.json` is unused static file (answers now come from user profile)
