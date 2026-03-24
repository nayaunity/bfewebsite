# Debug Context for Next Session

## What We Built

A paid auto-apply SaaS feature on theblackfemaleengineer.com. Users subscribe (Free/Starter/Pro tiers via Stripe), upload resumes, fill in their profile, and the system applies to jobs at 20+ tech companies using browser automation (Playwright on a Railway worker server).

## Current Branch

`auto-apply-saas` — all work is here. It's been merged to `main` and deployed to Vercel multiple times.

## What's Working

- Stripe checkout flow — user can subscribe to Starter/Pro, gets redirected to Stripe, payment processes
- Railway worker deployed and running — polls the `ApplyQueue` table in Turso every 30s
- Production database migrated with all new tables (`UserResume`, `ApplyQueue`, subscription fields on `User`)
- `/pricing` page renders correctly with 3 tier cards
- Stripe webhook endpoint exists at `/api/stripe/webhook`

## What's Broken — NEEDS DEBUGGING

### 1. React Hydration Error on `/profile`

**Error:** `Minified React error #418` — text content mismatch between server and client.

**What we tried:**
- Added `suppressHydrationWarning` to `<html>` and `<body>` in `src/app/layout.tsx`
- Serialized `Date` objects to ISO strings before passing to client components (`ResumeUpload`, `ResumeManager`)
- Replaced `Infinity` with `999999` in tier limits
- Ensured numeric values from `canApply()` are explicitly cast with `Number()`

**None of these fixed it.** The error persists after the latest deploy.

**Root cause hypothesis:** The `ThemeProvider` (`src/providers/ThemeProvider.tsx`) defaults to `"light"` on the server but reads `localStorage` on the client, potentially switching to `"dark"`. This causes any theme-dependent text to mismatch. However, `suppressHydrationWarning` should have silenced this — unclear why it didn't.

**To debug:** Run `npm run dev` locally and check the browser console — the dev build will show the exact component and text that mismatches instead of just the minified error number.

### 2. Resume Upload Not Working on `/profile`

**Symptom:** User clicks the upload area on the profile page but nothing happens (or it fails silently).

**Possibly related to:** The hydration error crashing React before event handlers attach. If fixing #1 doesn't fix this, check:
- Browser console Network tab for requests to `/api/profile/resume` — what status code?
- The `ResumeUpload` component at `src/components/ResumeUpload.tsx`
- The API route at `src/app/api/profile/resume/route.ts`
- Whether `BLOB_READ_WRITE_TOKEN` env var is set on Vercel (required for `@vercel/blob` uploads)

### 3. Stripe Webhook Not Verified Yet

After the user subscribes, the webhook `checkout.session.completed` should fire and update the user's `subscriptionTier` in the database. This hasn't been tested end-to-end yet.

**To verify:**
- Go to Stripe dashboard → Developers → Webhooks → click the endpoint → check "Attempts" tab
- Look for `checkout.session.completed` events and whether they succeeded (200) or failed
- If the user's tier badge on `/profile` doesn't show "Starter" or "Pro" after subscribing, the webhook isn't working

**Webhook endpoint:** `src/app/api/stripe/webhook/route.ts`
**Stripe webhook secret env var:** `STRIPE_WEBHOOK_SECRET` on Vercel

## Key Files

| File | Purpose |
|------|---------|
| `src/app/profile/page.tsx` | Profile page — passes data to client components |
| `src/components/ResumeUpload.tsx` | Single resume upload (original) |
| `src/components/ResumeManager.tsx` | Multi-resume upload (new, tier-limited) |
| `src/components/AutoApplyProfile.tsx` | Auto-apply profile form + Apply Now button |
| `src/components/UsageMeter.tsx` | Monthly usage progress bar |
| `src/components/SubscriptionBadge.tsx` | Tier badge (Free/Starter/Pro) |
| `src/providers/ThemeProvider.tsx` | Theme toggle — likely hydration error source |
| `src/app/layout.tsx` | Root layout with suppressHydrationWarning |
| `src/lib/stripe.ts` | Stripe client + tier limits config |
| `src/lib/subscription.ts` | Usage tracking helpers |
| `src/app/api/stripe/webhook/route.ts` | Stripe webhook handler |
| `src/app/api/stripe/checkout/route.ts` | Creates Stripe checkout sessions |
| `src/app/api/profile/resume/route.ts` | Single resume upload API |
| `src/app/api/profile/resumes/route.ts` | Multi-resume CRUD API |
| `src/app/api/auto-apply/route.ts` | Auto-apply trigger (queues jobs) |
| `src/app/api/auto-apply/queue/route.ts` | Queue status API |
| `src/app/pricing/page.tsx` | Pricing page |
| `worker/` | Railway Playwright worker (Express + Turso + Playwright) |

## Infrastructure

- **Vercel** — hosts the Next.js app
- **Turso** — production database (libsql), shared between Vercel and Railway worker
- **Stripe** — subscription billing (currently in test mode)
- **Railway** — hosts the Playwright worker server (polls `ApplyQueue`, applies via browser)
- **Vercel Blob** — stores uploaded resume PDFs

## Environment Variables Needed

**Vercel:**
- `STRIPE_SECRET_KEY` — set ✅
- `STRIPE_PUBLISHABLE_KEY` — set ✅
- `STRIPE_STARTER_PRICE_ID` — set ✅
- `STRIPE_PRO_PRICE_ID` — set ✅
- `STRIPE_WEBHOOK_SECRET` — set ✅
- `BLOB_READ_WRITE_TOKEN` — CHECK IF SET (needed for resume uploads)

**Railway:**
- `DATABASE_URL` — set ✅
- `DATABASE_AUTH_TOKEN` — set ✅
