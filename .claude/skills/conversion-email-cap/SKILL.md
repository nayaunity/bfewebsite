---
name: conversion-email-cap
description: Draft and send a personalized 50%-off upgrade email to free users who hit the 5-application monthly cap. Use when the user asks to email capped users, run a conversion campaign to capped free users, send a late-upgrade nudge, or convert cap-hitters to Starter.
argument-hint: [optional: specific emails/user ids, or "missed" for users who capped after the prior campaign]
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Write, Edit
---

# Cap-Hit Conversion Email

Converts free users who hit the 5-application free-tier cap into Starter subscribers via a personalized, time-limited 50% off offer.

## CRITICAL RULES

- **NEVER send without explicit approval.** Two phases. Always draft first, stop, wait for "send it" / "looks good, send" / similar.
- **NEVER use em dashes (—)** anywhere. Hyphens only. This applies to subject, body, HTML, everything.
- **Always test-send to theblackfemaleengineer@gmail.com first** with `[TEST for <real_email>] <subject>` subject prefix. Only send to real recipients after explicit approval of the test batch.
- **Signature: `Naya`** on its own line. Not "Talk soon, Naya", not "— Naya", just `Naya`.
- **Verify the coupon AND click the CTA button in the test email before live send.** A visually-correct draft can still ship a dead button — the `/api/stripe/convert` endpoint returns a bare JSON `{"error":"Failed to create checkout session"}` if the coupon is expired. See "Pre-send verification checklist" below.
- **CTA must be above the fold.** Gmail desktop preview shows roughly the first 500px. The button + price must land inside that window — role list, stats, and closing copy go below. Do not put the bulleted role list before the button.

## Phase 1: Identify Recipients

### Default query — all capped free users
```sql
SELECT id, email, firstName, targetRole, monthlyAppCount, subscriptionTier
FROM User
WHERE monthlyAppCount >= 5
  AND subscriptionTier = 'free'
  AND (role IS NULL OR role NOT IN ('test', 'admin'))
  AND emailVerified IS NOT NULL
ORDER BY monthlyAppCount DESC;
```

### "Missed" query — capped AFTER the prior campaign
If the user says "the ones we missed" or "users who capped after the last email":
1. Look up prior Resend sends (dashboard or a prior `scripts/send-*upgrade*.ts`)
2. Cross-reference: capped users whose email is NOT in the prior send list
3. Typical outcome: 3-8 users who hit the cap in the last 1-2 weeks and were missed by the earlier blast

### Confirm the list with the user before drafting
Show: `email | firstName | targetRole | monthlyAppCount | top 2 companies applied`

## Phase 2: Build Per-User Drafts

For each recipient, compute:

### firstName (normalized)
```ts
const rawFirst = (user.firstName || "there").trim().split(/\s+/)[0];
const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);
```
Some users have middle names in `firstName` (e.g. "Sharayu Appasaheb"). Take the first word only.

### Top-2 companies they already applied to
```ts
const applies = await prisma.browseDiscovery.findMany({
  where: { session: { userId: user.id }, status: "applied" },
  select: { company: true },
});
// Count, sort desc, take top 2
```
Rendered as: `"Stripe, Anthropic"` (or single company if only 1).

### 3 role-matched open jobs — 4-pass fallback
Fetch up to 500 active jobs. Exclude blocked companies. Pick 3 distinct companies using these passes in order:

```ts
const BLOCKED = ["openai", "ramp", "notion", "perplexity", "linear",
                 "elevenlabs", "duolingo", "samsara", "grammarly"];

// Pass 1: exact role-keyword match per user target (priority order)
// Pass 2: if engineering target, any /engineer|architect/i title
// Pass 3: if design/research target, any /designer|researcher/i title
// Pass 4: any remaining job at a new company (pure fallback)
```
Keyword mapping (see `scripts/send-late-upgrade-email.ts` for the full function):
- "engineering manager" → `["engineering manager", "eng manager"]`
- "data engineer" → `["data engineer", "data platform", "data engineering"]`
- "full stack" → `["full stack", "fullstack", "full-stack"]`
- "backend" → `["backend", "back-end", "back end"]`
- "frontend" → `["frontend", "front-end", "front end", "ui engineer", "ui software"]`
- "product designer" / "ux / product" → `["product designer", "ux designer"]`
- "ai / ml" / "machine learning" → `["machine learning", "ml engineer", " ai "]`
- "product manager" → `["product manager"]`

**Never let dashes (— at —) appear in the output.** If passes 1-4 still can't produce 3 distinct picks, relax to 2 picks and adjust copy, or widen to allow duplicate companies — do not render placeholder lines.

### Checkout URL (CRITICAL)
```
https://www.theblackfemaleengineer.com/api/stripe/convert?tier=starter&coupon=STARTER50&email=<encodedEmail>
```
This is the unauthenticated Stripe conversion endpoint. It pre-fills the customer email AND applies the 50% coupon.

**DO NOT use `/pricing?coupon=STARTER50`** — the pricing page does not read the `coupon` query param and the user will see full price.

### Coupon lifecycle
Stripe coupons are immutable on `redeem_by`. Before every new campaign, verify the coupon is still valid:
```bash
STRIPE_SECRET_KEY=$(grep '^STRIPE_SECRET_KEY=' .env.vercel-prod | cut -d'"' -f2) \
npx tsx -e "import Stripe from 'stripe'; const s = new Stripe(process.env.STRIPE_SECRET_KEY!); s.coupons.retrieve('STARTER50').then(c => console.log(c.id, 'valid:', c.valid, 'expires:', c.redeem_by && new Date(c.redeem_by*1000).toISOString()));"
```
If `valid: false` (expired), create a fresh one with a new ID:
```ts
await stripe.coupons.create({
  id: 'STARTER50_<date>',              // unique; old coupon can't be revived
  percent_off: 50,
  duration: 'once',                    // first-month-only discount
  redeem_by: Math.floor(Date.now()/1000) + 72*60*60,
  max_redemptions: 100,
  name: 'Starter 50% Off First Month (72h window)',
});
```
Update `CHECKOUT_BASE` in `scripts/send-late-upgrade-email.ts` AND this skill file to reference the new id. Never ship copy that says "50% off" with an expired coupon behind it — the convert endpoint returns a 500 and the user sees a bare JSON error.

## Phase 3: Copy Template (CTA-above-the-fold layout)

Order is load-bearing. Do not rearrange. Tested live: CTA rendered above the Gmail desktop fold, role list as supporting detail below.

### Subject
```
<firstName>, your job pipeline hit the free limit
```

### Plain text body
```
Hey <firstName>,

Your applications to <companiesText> are live, and you've hit your 5-app free limit. 5,000+ new jobs were just added. Unlock 100 apps/mo for $14.50 (normally $29, 50% off for the next 72 hours). Cancel anytime.

Unlock 100 Apps/Mo for $14.50 (50% off): <checkoutUrl>

A few <primaryRole> roles open right now:
  <title1> at <company1>
  <title2> at <company2>
  <title3> at <company3>

The average job search takes 100+ applications. You've sent 5 - that's $0.15 per application on Starter.

Naya
```

### HTML body
```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 560px;">
  <p style="font-size: 20px; font-weight: 700; margin: 0 0 18px;">the<span style="color: #ef562a;">BFE</span></p>
  <p style="margin: 0 0 12px;">Hey <firstName>,</p>
  <p style="margin: 0 0 14px;">Your applications to <strong><companiesText></strong> are live, and you've hit your <strong>5-app free limit</strong>. 5,000+ new jobs were just added. Unlock 100 apps/mo for <strong>$14.50</strong> (normally $29, 50% off for the next 72 hours).</p>
  <p style="text-align: center; margin: 18px 0 20px;"><a href="<checkoutUrl>" style="display: inline-block; background: #ef562a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Unlock 100 Apps/Mo - $14.50 (50% off)</a></p>
  <p style="margin: 0 0 8px;">A few <primaryRole> roles open right now:</p>
  <ul style="list-style: none; padding-left: 20px; margin: 0 0 14px;">
    <li style="margin-bottom: 4px;"><strong><title1></strong> at <company1></li>
    <li style="margin-bottom: 4px;"><strong><title2></strong> at <company2></li>
    <li style="margin-bottom: 4px;"><strong><title3></strong> at <company3></li>
  </ul>
  <p style="margin: 0 0 14px;">The average job search takes 100+ applications. You've sent 5 - that's $0.15 per application on Starter. Cancel anytime.</p>
  <p style="margin: 0;">Naya</p>
</div>
```

**Copy rules locked in by prior user feedback:**
- Opener MUST start with "Hey <firstName>," followed by "Your applications to..." (companies they actually applied to).
- Single hook paragraph must combine: apps live → cap hit → 5,000+ new jobs → both prices → 72h promo. All before the button.
- Must explicitly state BOTH prices: `$14.50` and `(normally $29, 50% off for the next 72 hours)`. Without the original price, users don't recognize the promo.
- "Cancel anytime." — always include (in the below-button paragraph).
- Role list MUST come after the button, with header `A few <primaryRole> roles open right now:`.
- The $0.15/app math is a closer below the role list, not the opener.
- Signature: bare `Naya`, no "Talk soon".
- Margins tight (`0 0 12-14px`) so the hook + button fit inside ~500px vertical.

## Phase 4: Show Drafts in Chat

After building all drafts, output each one in the chat (NOT a file) under headings so Naya can read them:

```
### Draft 1 — <email>
**Subject:** <subject>
**Body:**
<plaintext body>

### Draft 2 — <email>
...
```

**Stop. Ask:** "Here are the <N> drafts. Test-send all to theblackfemaleengineer@gmail.com for review?"

## Phase 5: Test-Send (only after approval)

Create or reuse `scripts/send-late-upgrade-email.ts` (see that file for reference). Invoke with `--test` mode:
```bash
RESEND_API_KEY=$(grep RESEND_API_KEY .env.vercel-prod | cut -d'"' -f2) \
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
npx tsx scripts/send-late-upgrade-email.ts --test
```
Test mode rewrites `to` → `theblackfemaleengineer@gmail.com` and prefixes subject with `[TEST for <real_email>]`. Still 1 email per target so all personalization variants land in Naya's inbox.

Pacing: 200ms between sends to respect Resend rate limits.

### Pre-send verification checklist

Before asking Naya to approve the live send, confirm ALL of these yourself. A "the draft reads well" approval is not enough — the last campaign shipped a working-looking email with a dead button because the coupon had silently expired:

1. **Coupon is valid today.** Run the `stripe.coupons.retrieve(...)` snippet from "Coupon lifecycle" and confirm `valid: true` AND `redeem_by` is at least 72h away.
2. **The checkout URL resolves to a real Stripe session, not a 500.** Either:
   - Ask Naya to click the button in her test email (preferred — also validates the render)
   - Or reproduce the call:
     ```bash
     STRIPE_SECRET_KEY=$(grep '^STRIPE_SECRET_KEY=' .env.vercel-prod | cut -d'"' -f2) \
     STARTER=$(grep 'STRIPE_STARTER_PRICE_ID' .env.vercel-prod | head -1 | cut -d'"' -f2) \
     npx tsx -e "import Stripe from 'stripe'; const s = new Stripe(process.env.STRIPE_SECRET_KEY!); s.checkout.sessions.create({customer:'<existing stripeCustomerId>',mode:'subscription',line_items:[{price:process.env.STARTER!,quantity:1}],discounts:[{coupon:'STARTER50'}],success_url:'https://x/y',cancel_url:'https://x/y'}).then(r=>console.log('OK',r.url)).catch(e=>console.error('ERR',e.message));"
     ```
3. **CTA renders above the fold in the test email.** Open the test in Gmail desktop at normal zoom; the button must be visible without scrolling. If not, tighten margins or shorten the hook paragraph.
4. **No em dashes anywhere** (grep the script output text for `—`).
5. **No `- at -` placeholder lines** in any role list (indicates the 4-pass fallback failed — tune keywords or relax the filter).
6. **All personalization variables populated** — no literal `<firstName>` or `undefined` in the HTML.

## Phase 6: Live Send (only after second explicit approval)

After Naya reviews the test batch AND explicitly approves, run with `--send`:
```bash
npx tsx scripts/send-late-upgrade-email.ts --send
```

## Resend send config (always)
```ts
await resend.emails.send({
  from: "Naya <naya@theblackfemaleengineer.com>",
  replyTo: "theblackfemaleengineer@gmail.com",
  to,
  subject,
  html,
  text,
});
```
- `from` MUST be `naya@theblackfemaleengineer.com` (verified domain).
- `replyTo` MUST be `theblackfemaleengineer@gmail.com` (naya@ is send-only, not monitored).

## Reference Script

`scripts/send-late-upgrade-email.ts` implements all of the above. Before writing new code, read it — the job-matching, firstName normalization, and 4-pass fallback are already debugged there. Clone and edit only when the recipient cohort or copy changes materially.

## What NOT to do

- Never send to a list of cap-hitters without cross-referencing who's already received the prior campaign — double-emailing the same offer burns goodwill.
- Never use `/pricing?coupon=STARTER50` — use `/api/stripe/convert?tier=starter&coupon=STARTER50&email=`.
- Never omit the $29 original price. The promo only lands if the discount is legible.
- Never include placeholder lines like `— at —` in the role list. If matches fall short, tune the fallback or adjust the list length.
- Never include users with `role='test'` or `role='admin'` in the send.
- Never include users whose `subscriptionTier != 'free'` (they've already converted or churned).
- Never skip the test-send-to-Naya phase, even for a single recipient.
- Never trust the Stripe convert URL without testing it. Coupons expire silently; the endpoint returns a 500 with `{"error":"Failed to create checkout session"}` and the user hits a dead page. Always run the pre-send verification checklist.
- Never put the role list above the CTA button. CTA must be above the fold; role list is supporting detail below.

## Session history (April 2026 campaign)

Campaign 1 (late-upgrade, 5 recipients): sharayu699, samayo.dev, rranjan07th, msadiknur, adepitandavid. First send attempted with coupon `crczQBPX` which had silently expired on 2026-04-13. Visually-correct email was approved and sent, but the button returned a 500 error. Rebuilt with new coupon `STARTER50` (72h window, max 100 redemptions) and a restructured layout moving the CTA above the fold. Re-sent successfully. Lesson: verify the button, not just the draft.

## Automated drip (production)

As of Apr 2026 a Vercel cron runs the drip automatically — this skill documents the *manual* flow for backfills, ad-hoc sends, or when the drip is disabled. The automated flow:

- **Cron**: `/api/cron/cap-conversion-digest` fires daily at 15:00 UTC (9am MT), authed via `CRON_SECRET`.
- **Candidate definition** (in `src/lib/cap-conversion.ts:findCapConversionCandidates`): tier=free, not test/admin, email verified, `conversionEmailSentAt IS NULL`, AND their 5th `BrowseDiscovery.applied` was created in the last 24 hours.
- **If 0 candidates**: no email fired (intentional — no noise).
- **If N candidates**: a `CapConversionDigest` row is created with a random 32-byte token and 24h expiry. One summary email goes to theblackfemaleengineer@gmail.com with a link to `/admin/cap-conversion/<token>`.
- **Approve page** renders the full HTML preview of each draft. The "Send all N" button POSTs to `/api/admin/cap-conversion/send`, which creates a fresh per-user 72h coupon (`CAP_<userid>_<timestamp>`, `max_redemptions: 1`) for each recipient, sends the email, and sets `User.conversionEmailSentAt = now()`. Digest row marked `status=approved`. Dedupes forever at the user level.
- **If the digest link expires unclicked**: those users are skipped permanently (cron won't re-propose them because they're outside the 24h window next time).

Shared draft-building logic lives in `src/lib/cap-conversion.ts:buildDraft`. The standalone `scripts/send-late-upgrade-email.ts` still exists for manual ad-hoc batches but should be kept in sync with the library (or ideally deleted and replaced with a one-off script that calls `buildDraft` directly).

### Disabling the drip temporarily

Remove or comment out the `cap-conversion-digest` entry in `vercel.json` and redeploy. Existing digests with unclaimed tokens will still work until they expire.
