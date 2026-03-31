# Company Expansion Progress — March 31, 2026

## Goal: 20 new unique companies. ACHIEVED.

## New Companies — 20 CONFIRMED PASSING

| # | Company | Greenhouse Slug | Test URL |
|---|---------|----------------|----------|
| 1 | Temporal | temporaltechnologies | `jobs/5041529007` |
| 2 | LaunchDarkly | launchdarkly | `jobs/7536731003` |
| 3 | Scale AI | scaleai | `jobs/4600908005` |
| 4 | Together AI | togetherai | `jobs/4949454007` |
| 5 | Contentful | contentful | `jobs/7593411` |
| 6 | Fireblocks | fireblocks | `jobs/4655528006` |
| 7 | SingleStore | singlestore | `jobs/7568057` |
| 8 | Labelbox | labelbox | `jobs/4640927007` |
| 9 | Alchemy | alchemy | `jobs/4033855005` |
| 10 | Materialize | materialize | `jobs/5550315004` |
| 11 | Blockchain.com | blockchain | `jobs/7310500` |
| 12 | PlanetScale | planetscale | `jobs/4036240009` |
| 13 | project44 | project44 | `jobs/7683877` |
| 14 | Mercari | mercari | `jobs/8476385002` |
| 15 | Grafana Labs | grafanalabs | `jobs/5796306004` |
| 16 | Attentive | attentive | `jobs/4118958009` |
| 17 | Marqeta | marqeta | `jobs/7539542` |
| 18 | Doximity | doximity | `jobs/6738818` |
| 19 | Culture Amp | cultureamp | `jobs/7744336` |
| 20 | Apollo | apollo | `jobs/4623182006` |

## Combined Total: 37 Companies (17 existing + 20 new)

### Existing (17)
Stripe, Figma, Databricks, Twilio, DoorDash, Anthropic, Glean, Cloudflare, ZipRecruiter, ClickHouse, Affirm, GitLab, Reddit, Gusto, Amplitude, Airtable, Grammarly

### New (20)
Temporal, LaunchDarkly, Scale AI, Together AI, Contentful, Fireblocks, SingleStore, Labelbox, Alchemy, Materialize, Blockchain.com, PlanetScale, project44, Mercari, Grafana Labs, Attentive, Marqeta, Doximity, Culture Amp, Apollo

## Key Code Change (NOT COMMITTED)

### `worker/src/apply-engine.ts`
**Changed all `"Yes"` and `"No"` exact-match option strings to `/^Yes/i` and `/^No/i` regex patterns.**

This was the single biggest fix. Many companies use long-form dropdown options like:
- "Yes, I am currently legally authorized to work in the country..."
- "No, I do not and will not require immigration sponsorship..."

The old code used `"Yes"` with `useExact = true` (because length ≤ 3), which failed on these long options. The regex `/^Yes/i` matches both "Yes" and "Yes, I am currently...".

~25 dropdown patterns were updated. This fix alone unlocked Together AI, Alchemy, Materialize, and likely contributed to many others passing.

**Also added ~15 new dropdown patterns:**
- Onsite/office work questions (`/work onsite|willing.*onsite/`)
- Privacy policy / candidate privacy consent
- Interview recording consent
- "Previously applied" questions
- "Written code deployed to production" (Alchemy)
- Background check consent
- Meet required qualifications
- Government employment
- Work location intent
- "Double check information" consent (Vercel)
- "Used product before" (Tailscale)

**Also added ~3 new text field patterns:**
- Mailing address
- Compensation alignment
- "Why interested in joining"

## Companies Still Failing (not blocking — we have 20)
Discord, Verkada, Webflow, Sigma Computing, dbt Labs, Vercel, Iterable, Earnin, Starburst, Tailscale, Rocket Lab, PagerDuty, Zscaler, Komodo Health, Netlify, Blend, VTEX

These have deeper issues (conditional Race EEO fields, country-specific questions, complex multi-step forms).

## Files Modified (NOT COMMITTED)
- `worker/src/apply-engine.ts` — regex fix + new patterns
- `job-assets/EXPANSION-PROGRESS.md` — this document

## Next Steps (for when you're ready to commit)
1. Add all 20 new companies to `scripts/target-companies.json` and `worker/data/target-companies.json`
2. Commit the `apply-engine.ts` changes
3. Deploy to Vercel + Railway
4. The company list will go from 17 to 37

## Workday Exploration (future)
- Not needed yet — 37 Greenhouse companies provides plenty of job volume
- Workday would require: account creation automation, password storage, different form-filling patterns
- Consider if/when users request specific Workday companies (Microsoft, Salesforce, etc.)
