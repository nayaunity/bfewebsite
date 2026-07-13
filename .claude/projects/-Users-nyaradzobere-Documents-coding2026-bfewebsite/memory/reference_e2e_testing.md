---
name: reference-e2e-testing
description: How to E2E test authenticated pages locally using dev login + seed script
metadata:
  type: reference
---

## E2E Testing Infrastructure

Two scripts enable authenticated E2E testing on localhost:

1. **`scripts/seed-e2e-user.ts`** seeds a fully-provisioned test user:
   - Email: `e2e@test.local`, Password: `test1234`, ID: `e2e-test-user-001`
   - Pro tier, active subscription, onboarding + selfID completed
   - 4 LinkedIn connections (Figma, Stripe, Google, Anthropic)
   - 5 browse discoveries, 1 completed sync run
   - Run: `npx tsx scripts/seed-e2e-user.ts`

2. **`/api/dev/login`** (dev-only) sets a valid JWT session cookie:
   - GET: `http://localhost:3000/api/dev/login?email=e2e@test.local&then=/profile/applications`
   - POST: `curl -X POST http://localhost:3000/api/dev/login -H 'Content-Type: application/json' -d '{"email":"e2e@test.local"}'`
   - Automatically detects `__Secure-` prefix from AUTH_URL (handles `.env.local` pointing to production HTTPS)

**Critical detail:** `.env.local` has `AUTH_URL="https://www.theblackfemaleengineer.com"`, so NextAuth uses `__Secure-authjs.session-token` as the cookie name even in dev. The dev login endpoint reads AUTH_URL to match.

**For Playwright MCP testing:** Use `browser_navigate` to the GET endpoint (not fetch/evaluate), since httpOnly cookies require real navigation to be set.
