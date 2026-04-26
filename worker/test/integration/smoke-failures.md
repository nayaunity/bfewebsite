# Smoke-test failures — companies kept OUT of auto-apply-companies.json

Last updated: 2026-04-25 (Phase B + Phase C smokes)

These companies failed the apply-path smoke test. Re-test after the noted root cause is fixed before adding them to `src/data/auto-apply-companies.json`.

## Phase B failures (Apr 25)

| Company | ATS | Failure | Root cause hypothesis |
|---|---|---|---|
| Roblox | Greenhouse | 12-min timeout | Form has many fields; Claude agent loop runs out of steps before reaching submit. |
| Datadog | Greenhouse | "Application form not visible" | Job listing URL does not directly host the apply form; needs a click-through. |
| Palantir | Lever | Stuck-cascade | Lever form on this URL hung after multiple actions. |

## Phase C failures (Apr 25)

| Company | ATS | Failure | Root cause hypothesis |
|---|---|---|---|
| Dropbox | Greenhouse | "Save & Continue" timeout after 3 attempts | Multi-step Greenhouse form; worker can't progress past step 1. |
| Block | Greenhouse | Stuck-cascade | Custom Greenhouse fields not handled. |
| Coinbase | Greenhouse | Cloudflare security challenge | Anti-bot. Browserbase residential proxies might bypass. |
| Modal | Ashby | Stuck-cascade | Ashby anti-bot or unusual fields (similar pattern to OpenAI/Notion/Ramp cluster). |
| Supabase | Ashby | Stuck-cascade | Same Ashby cluster issue. |

## Skipped — could not test (no current intern + no FT URL on the board)

These were not failures, just unverified. Some may pass when retested with current listings.

| Company | ATS | Reason |
|---|---|---|
| Vercel | Ashby | empty_board (no jobs at all currently) |

## Skipped — wrong slug or moved off ATS

These returned 404 from the listed ATS API. Either the slug is wrong or the company has moved to a different ATS. Investigate before re-adding.

| Company | ATS | Slug tried |
|---|---|---|
| HashiCorp | Greenhouse | `hashicorp`, `hashicorpinc` |
| DraftKings | Greenhouse | `draftkings`, `draftkingsinc` |
| Niantic | Greenhouse | `niantic`, `nianticlabs` |
| Replit | Greenhouse | `replit` |
| PayPal | Greenhouse | `paypal` |
| Rippling | Greenhouse | `rippling` |
| Toast | Greenhouse | `toasttab` |
| Lemonade | Lever | `lemonade` |
| KOHO | Lever | `koho` |
| Pleo | Lever | `pleo` |
| Wealthfront | Ashby | `wealthfront` |
| Checkr | Ashby | `checkr` |

## Workday — fundamentally incompatible with current worker

Three rounds of testing showed Workday is not viable for our worker today:

**API access (round 1):** all 8 Workday candidates returned HTTP 400 or 422 with `limit: 50`. **Root cause:** Workday rejects `limit > 20`. The production scraper at `src/lib/scrapers/workday.ts` uses `limit: 20` — that's why nightly scrapes work for Dell/NVIDIA/Salesforce historically. Smoke harness fixed.

**API access (round 2):** with `limit: 20`, 3 of 8 tenants validate (Salesforce wd12, Adobe wd5, Walmart wd5). The other 5 (Snowflake, ServiceNow, Cisco, Capital One, Intuit) still 422 — wrong siteName values. Need to scrape each public careers page to find the correct siteName.

**Apply path (round 3):** all 3 validating tenants FAILED the apply smoke:
- Salesforce: "Redirected to login page" — Workday gates the apply form behind authentication
- Walmart: "Redirected to login page" — same auth gate
- Adobe: "Application timed out after 12 minutes" — Workday's multi-step apply wizard exceeds the worker's APPLICATION_TIMEOUT_MS

**Conclusion:** Workday scraping for *listings* works (the production scraper has Salesforce/Dell/NVIDIA in dei-companies.json). Workday auto-apply does not work without:
- A Workday sign-in flow (creates an account, persists session)
- A Workday-specific multi-step wizard handler
- ~Plus tenant-specific siteName research for the 5 we couldn't even validate

That's a multi-week project, not a Phase D add. Until then, do NOT add Workday companies to `auto-apply-companies.json` for the auto-apply scrape — they'd just produce listings the worker can't submit to.
