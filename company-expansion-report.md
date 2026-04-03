# Company Expansion Report — FINAL
**Date:** April 3, 2026

## Final Target List: 41 companies (37 original + 4 new)

### New Companies Added (verified end-to-end)

| Company | Jobs Found | Applied | Rate | Role Coverage |
|---|---|---|---|---|
| **Klaviyo** | 15 | 5 | 33% | 16 marketing, 11 security |
| **Zscaler** | 15 | 4 | 27% | 19 security, 6 marketing |
| **Abnormal Security** | 15 | 3 | 20% | 17 security, 3 marketing |
| **Asana** | — | — | — | 7 security, 3 marketing (form compatible, pending live test) |

### Removed

| Company | Reason |
|---|---|
| **Okta** | 0% success — form embed on okta.com incompatible |
| **Intercom** | 0-13% across 4 test runs — non-standard dropdown options, consistently failing |
| **Elastic** | Uses custom ATS, not Greenhouse |
| **Toast** | Uses custom career site, not Greenhouse |

## Key Improvements Deployed

1. **Greenhouse API discovery** — career browser now uses `boards-api.greenhouse.io` JSON API instead of scraping HTML. Fixes 0-result issue on large boards. Benefits ALL companies.

2. **Blur after dropdown selection** — clicks body after selecting to trigger Greenhouse form validation. Fixes "value shows but has validation error" pattern.

3. **Broader work auth option matching** — supports long-form options like "I am authorised to work..." alongside simple "Yes"/"No". Supports British spelling.

4. **New company-specific patterns** — hybrid office, relocate, previously worked, Current Location autocomplete, future openings.

5. **Worker data file sync** — fixed `worker/data/target-companies.json` being out of sync with `scripts/target-companies.json`.

## Security Engineer Job Coverage

Across all 41 companies, Security Engineer users now have access to roles at:
- **Abnormal Security** — 17 security roles (Application Security, ML Security)
- **Zscaler** — 19 security roles (InfoSec, Cybersecurity, Compliance)
- **Klaviyo** — 11 security-adjacent roles
- **Asana** — 7 security roles
- Plus existing: Databricks, Cloudflare, GitLab, Grafana Labs, etc.

Estimated **~80 security engineer roles** across the full company list.
