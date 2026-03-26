# Auto-Apply System — Status & Handoff (March 25, 2026)

## Project Goal

Build an auto-apply SaaS feature for theblackfemaleengineer.com that lets users select a target role + companies, then automatically browses career pages, discovers matching jobs, and submits applications using Playwright browser automation + Claude AI for intelligence.

## Architecture

```
User clicks "Start Applying" on website
  → Creates BrowseSession in Turso DB
  → Railway worker polls for sessions every 30s
  → Worker uses Playwright + stealth browser to visit career pages
  → Claude Haiku identifies matching jobs from page links
  → For each job: navigates to apply form, Claude decides each form action
  → Results stored in BrowseDiscovery table, shown real-time on frontend
```

### Key Files

| File | Purpose |
|------|---------|
| `worker/src/apply-engine.ts` | **Core file** — Claude agent loop, form interaction, page snapshots, all strategies |
| `worker/src/career-browser.ts` | Job discovery — browses career pages, sends links to Claude for matching |
| `worker/src/browse-loop.ts` | Session orchestration — polls DB, iterates companies, calls apply engine |
| `worker/src/browse-worker.ts` | Local dev entry point (`cd worker && HEADLESS=false npm run browse`) |
| `worker/src/index.ts` | Railway production entry point |
| `worker/src/db.ts` | Turso database operations |
| `src/components/BrowseApplyForm.tsx` | Frontend UI (role selector, company checklist, real-time progress) |
| `src/app/api/auto-apply/browse/route.ts` | API: create browse session |
| `src/app/api/auto-apply/browse/[sessionId]/route.ts` | API: poll session progress |
| `job-assets/application-answers.json` | Pre-filled application answers by role |
| `scripts/target-companies.json` | 20 company career page URLs |

### Infrastructure

- **Vercel** — hosts Next.js app
- **Turso** — production database (shared between Vercel and Railway)
- **Railway** — hosts Playwright worker
- **Stripe** — subscription billing (free: 5 apps/month, starter: 50, pro: unlimited)
- **Vercel Blob** — stores uploaded resume PDFs
- **Anthropic API** — Claude Haiku for job matching and apply agent loop

## What Works (as of this session)

### Job Discovery
- Browses career pages with stealth browser context (random UAs, anti-detection)
- Extracts all page links, sends to Claude Haiku in batches of 100 (max 15 matches per batch)
- Claude identifies matching jobs with clean titles
- Handles pagination, search inputs, Cloudflare challenges
- **Tested**: Stripe (27-36 jobs), Anthropic (72-154 jobs), Coinbase, Meta, Microsoft

### Navigation to Apply Forms
- `findATSApplyLink()` detects external ATS links (Greenhouse, Lever, Ashby, Workday)
- Handles Stripe's `{listing-url}/apply` pattern
- Login detection (`isLoginPage()`) catches auth-gated pages early

### Form Filling (text fields)
- React native value setter (`HTMLInputElement.prototype.value.set`) as Strategy 0
- 5 additional fallback strategies for `robustFill()`
- Claude uses explicit field-to-value mapping from the prompt
- **Fields that fill correctly**: First Name, Last Name, Email, Phone, Website, LinkedIn, Name Pronunciation, Personal Preferences, free-text answers
- Resume upload works via `robustUpload()` with hidden-input fallback
- Application answers from `job-assets/application-answers.json` fed to Claude

### Robustness
- Form-state stuck detection (hashes input values, not just URL)
- Field skip list — after 3 failed attempts on a field, adds to SKIPPED FIELDS so Claude moves on
- Fill verification — reads back values after each fill
- JSON parse error recovery — retries instead of failing the whole application
- `__name` polyfill in browser context (esbuild/tsx keepNames workaround)
- ATS detection (Greenhouse, Lever, Workday, Ashby, etc.)
- Iframe-aware page snapshots and action execution
- MAX_STEPS = 25, visible text limit = 5000 chars

## What Does NOT Work — THE MAIN BLOCKER

### Custom Dropdown Selection

**This is the single issue preventing applications from being submitted.**

Career site forms (Ashby, Greenhouse, etc.) use custom React dropdown components for fields like:
- **Country** (phone code selector)
- **Do you require visa sponsorship?** (Yes/No dropdown)
- **Are you open to working in-person?** (Yes/No dropdown)
- **Earliest start date** (custom selector)

These are NOT native `<select>` elements. They are React components that render as divs with `role="listbox"` / `role="option"` or custom class-based dropdowns.

#### What happens now:
1. Claude correctly identifies the field needs to be filled
2. Claude sends a `fill` or `select` action with the right value ("United States", "No", "Yes")
3. `robustSelect()` tries 6 strategies including click-to-open + click-option
4. The dropdown OPENS (visually confirmed in screenshots)
5. But clicking the option **does not register** with the React component
6. The field value remains empty in the DOM
7. Fill verification detects the failure
8. After 3 failures, the field gets skipped
9. Claude moves on to other fields but can't submit with required fields empty

#### Why the click doesn't work:
- `page.evaluate(() => element.click())` doesn't trigger React synthetic events
- `page.getByText("United States").click()` should work but may be targeting the wrong element (the text might be inside a nested span within the option div)
- The Ashby Country dropdown shows "🇺🇸 United States +1" — the text includes emoji and phone code, so exact text matching may fail
- After clicking an option, React may need specific event sequences (mousedown → mouseup → click, or pointerdown → pointerup)

#### Approaches NOT yet tried:
1. **Screenshot-based debugging**: Take a screenshot when the dropdown is open, inspect the exact DOM structure of the options
2. **Playwright `locator.filter()` with partial text**: `page.locator('[role="option"]').filter({ hasText: 'United States' }).click()`
3. **Keyboard navigation**: After opening dropdown, use Arrow keys to navigate to the right option, then Enter
4. **`page.mouse.click(x, y)`**: Get the bounding box of the option element and click by coordinates
5. **React event simulation**: `new PointerEvent('pointerdown')` followed by the full sequence
6. **Ashby-specific handling**: Reverse-engineer Ashby's dropdown component and trigger the correct React callbacks

#### Recommended next step:
The most promising approach is **keyboard navigation** — open the dropdown with click, then use ArrowDown repeatedly until the desired option is highlighted, then press Enter. This mimics real user behavior and works with virtually all dropdown implementations regardless of their internal event handling.

```typescript
// Proposed approach for robustSelect:
await page.click(selector, { timeout: 3000 });  // Open dropdown
await page.waitForTimeout(500);
// Type to filter (most comboboxes support this)
await page.keyboard.type("United States", { delay: 80 });
await page.waitForTimeout(500);
// Press Enter to select the highlighted/first option
await page.keyboard.press("Enter");
```

If that doesn't work, try ArrowDown + Enter:
```typescript
await page.click(selector);
await page.waitForTimeout(300);
for (let i = 0; i < 30; i++) {  // ArrowDown through options
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(50);
  // Check if current option contains target text
  const highlighted = await page.evaluate(() => {
    const active = document.querySelector('[role="option"][aria-selected="true"], [class*="highlighted"]');
    return active?.textContent || "";
  });
  if (highlighted.toLowerCase().includes("united states")) {
    await page.keyboard.press("Enter");
    return;
  }
}
```

### Secondary Issues

1. **CAPTCHA**: Greenhouse forms have reCAPTCHA Enterprise. Ashby may also trigger CAPTCHA after many applications. Options: CAPTCHA solving service ($3/1000), or target CAPTCHA-free ATSes.

2. **Claude JSON parsing**: Occasionally Claude returns extra text after JSON. Fixed with brace-counting parser, but could be improved by using `tool_use` API instead of raw JSON output.

3. **Anthropic's own job pages**: Some Ashby-hosted pages redirect to `job-boards.greenhouse.io/anthropic` — a Greenhouse embed that has CAPTCHA.

## Testing

```bash
# Run worker locally with visible browser
cd worker && HEADLESS=false npm run browse

# Create a test session (run from project root)
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
npx tsx -e "
import { createClient } from '@libsql/client';
const db = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN });
async function main() {
  const id = 'browse_test_' + Date.now();
  await db.execute({
    sql: \`INSERT INTO BrowseSession (id, userId, targetRole, companies, resumeUrl, resumeName, status, totalCompanies, companiesDone, jobsFound, jobsApplied, jobsSkipped, jobsFailed, progressLog, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, 'queued', 1, 0, 0, 0, 0, 0, '[]', datetime('now'))\`,
    args: [id, 'cmklxchwl0009l20411l5lqe3', 'AI Engineer, Software Engineer', JSON.stringify(['Anthropic']),
      'https://7af79irdmlkxa8mq.public.blob.vercel-storage.com/resumes/cmklxchwl0009l20411l5lqe3/N.Bere-AI-Engineer-zp6XVdJ9Vnu5gsovGZ54mXxYhdh7Fg.pdf', 'N.Bere-AI-Engineer.pdf']
  });
  console.log('Created:', id);
}
main();
"

# Check results
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
npx tsx -e "
import { createClient } from '@libsql/client';
const db = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN });
async function main() {
  const d = await db.execute('SELECT jobTitle, status, errorMessage FROM BrowseDiscovery ORDER BY createdAt DESC LIMIT 10');
  for (const r of d.rows) console.log(\`[\${(r as any).status}] \${(r as any).jobTitle}\`);
}
main();
"

# Clear stuck sessions
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'"' -f2) \
DATABASE_AUTH_TOKEN=$(grep DATABASE_AUTH_TOKEN .env.production | cut -d'"' -f2) \
npx tsx -e "
import { createClient } from '@libsql/client';
const db = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN });
async function main() {
  await db.execute('UPDATE BrowseSession SET status = \"failed\" WHERE status IN (\"queued\", \"processing\")');
  console.log('Cleared');
}
main();
"
```

## Changes Made This Session (March 25, 2026)

### worker/src/apply-engine.ts
- React native value setter (Strategy 0 in robustFill)
- Form-state stuck detection (hashes field values, not just URL)
- `robustSelect()` with 6+ strategies for custom dropdowns
- MAX_STEPS 12→25, snapshot text 2000→5000 chars
- Application answers from JSON fed to Claude prompt
- Explicit field-to-value mapping in Claude prompt (name pronunciation, personal preferences, etc.)
- `isLoginPage()` detection after navigation and each action
- Fill verification with field skip list (3 failures → skip)
- `findATSApplyLink()` for ATS URL detection and /apply suffix pattern
- `detectATS()` for ATS identification in prompt
- Iframe-aware page snapshots and action execution
- `__name` polyfill via string-based addInitScript
- JSON parse error recovery (brace-counting parser, retries instead of fatal)
- [ALREADY FILLED - SKIP] markers in snapshot for non-empty fields

### worker/src/career-browser.ts
- Link batching (100 per batch) for pages with 500+ links
- Max 15 matches per batch to prevent JSON truncation
- Increased max_tokens to 4096

### worker/src/browse-loop.ts
- Passes targetRole to applyToJob for role-matched answers
