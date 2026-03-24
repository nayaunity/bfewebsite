# Auto-Apply Skill

Autonomously browse company career pages, find relevant jobs, select the best resume for each role, and apply using browser automation.

## Invocation

- `/auto-apply` — Apply to all companies in the target list
- `/auto-apply Anthropic, OpenAI` — Apply only to specific companies
- `/auto-apply --add "Company Name" "https://careers.example.com"` — Add a new company to the target list

## Instructions

### 1. Load Profile & Configuration

Get the user's profile:

```bash
npx tsx scripts/auto-apply-data.ts
```

Read target companies:

```bash
cat scripts/target-companies.json
```

Check available resumes and their status:

```bash
npx tsx scripts/match-resume.ts
```

This lists all configured resumes, their match keywords, and whether the PDF files exist. If resumes are missing, warn the user which files need to be placed in `job-assets/resumes/`.

If specific companies were named in the command, filter the list to only those. If `--add` was used, append the new company to `scripts/target-companies.json`.

If the profile is incomplete (missing name, email, phone), tell the user what's missing and stop.

Load the application answers reference:

```bash
cat job-assets/application-answers.json
```

This contains pre-written answers to common application questions (why this company, tell me about yourself, strengths, weaknesses, etc.) tailored per resume type. Use the answers matching the resume selected for each job. For free-text application questions, adapt these answers to reference the specific company and role.

### 2. Resume Selection

For each job found, select the right resume by running:

```bash
npx tsx scripts/match-resume.ts "<Job Title>"
```

This returns:
- `matched: true` with the resume file path if a match is found
- `matched: false` if no resume fits — **skip this job entirely**

The matching logic:
- Each resume in `job-assets/resumes.json` has keywords tied to role types
- The job title is matched against these keywords
- The most specific match wins (e.g., "developer advocate" beats "engineer" for a DevRel role)
- If no keywords match, a fallback resume is used (if configured)
- If no fallback exists and nothing matches, the job is skipped

**Resume profiles configured in `job-assets/resumes.json`:**
- Software Engineer — SWE, backend, frontend, full stack roles
- Developer Advocate — DevRel, community, evangelism roles
- Product / Program Manager — PM, TPM, project roles
- Data / ML Engineer — data science, ML, analytics roles
- DevOps / SRE — infrastructure, cloud, reliability roles
- General (fallback) — anything else; remove this entry from the config to skip non-matching jobs instead

### 3. For Each Company: Browse, Find Jobs, Apply

For each company in the target list:

#### 3a. Navigate to the careers page

Use Playwright to open the company's `careersUrl`.

#### 3b. Search for relevant jobs

**IMPORTANT: Career pages are often very large and will exceed snapshot limits. Follow this approach:**

1. First, use Playwright to navigate to the careers page
2. Use Playwright's `browser_type` tool to type a search query like "software engineer" into the search box (use `browser_click` on the search input first, then `browser_type`)
3. If the page has filter buttons/dropdowns for location, use `browser_click` to select "Remote" or the user's state
4. **Do NOT try to parse raw snapshots with Python/scripts.** Instead, use `browser_snapshot` to read what's visible, then use `browser_click` on individual job links you can see
5. If a snapshot is too large, use `browser_click` on pagination or scroll to see fewer results at a time
6. Process jobs one at a time: click a job link, read the page, decide if it matches, apply or go back

#### 3c. For each relevant job listing

1. **Click into the job** to see the full description
2. **Match a resume** — run `npx tsx scripts/match-resume.ts "<Job Title>"`. If `matched: false`, skip this job and move to the next one
3. **Check resume file exists** — if `exists: false`, skip and log a warning
4. **Find the Apply button** — click "Apply", "Apply Now", or similar
5. **Fill the application form** using profile data:
   - First Name, Last Name, Email, Phone
   - Resume: Upload the matched resume file from its `file` path
   - LinkedIn: Skip unless required
   - Cover Letter: Skip unless required; if required, write a brief 3-sentence one tailored to the role
   - Work authorization: Use `workAuthorized` and `needsSponsorship` from profile
   - US State / Location: Use `usState` from profile
   - Country: Use `countryOfResidence` from profile
   - For dropdown/select questions: Pick the closest matching option
   - For free-text questions (why this company, tell me about yourself, etc.): Use the matching role-specific answer from `application-answers.json`, adapting it to reference the specific company name and product. Use `commonQuestions` keyed by resume type and `additionalQuestions` for general questions
   - For EEO/demographic questions: Use values from `backgroundQuestions` in the answers file
   - For optional fields: Skip
6. **Submit** the application
7. **Record the result**:

```bash
npx tsx scripts/auto-apply-record-external.ts --company="<Company>" --title="<Job Title>" --url="<Job URL>" --status="submitted"
```

Or if failed/skipped:

```bash
npx tsx scripts/auto-apply-record-external.ts --company="<Company>" --title="<Job Title>" --url="<Job URL>" --status="failed" --error="<reason>"
npx tsx scripts/auto-apply-record-external.ts --company="<Company>" --title="<Job Title>" --url="<Job URL>" --status="skipped" --error="No matching resume"
```

8. **Navigate back** to the job listings and continue to the next job

### 4. Rate Limiting

- Wait 3-5 seconds between page navigations
- Wait 5-10 seconds between applications at the same company
- If a site shows a CAPTCHA or blocks you, skip that company and move on

### 5. Error Handling

- If a careers page doesn't load, skip that company
- If an application form is too complex or broken, mark as failed and move on
- If you get rate-limited or blocked, skip the rest of that company's jobs
- If a job requires login/account creation to apply, mark as skipped with reason "requires account"
- Never stop the entire batch because of one failure

### 6. Summary

After processing all companies, print a summary table:

| Company | Jobs Found | Applied | Skipped | Failed | Resumes Used |
|---------|-----------|---------|---------|--------|-------------|

And a total across all companies.

## Important Rules

- Do NOT ask the user for confirmation before each application — apply autonomously
- Do NOT stop to ask questions — use best judgment for ambiguous fields
- Process ALL target companies in one run
- The user wants this to be fully hands-free
- If a site requires account creation, skip it (don't create accounts)
- For "years of experience" questions, answer honestly based on the profile
- Never fabricate credentials, certifications, or experience
- Spend at most 5 minutes per company — if the site is too slow or complex, move on
- ALWAYS use the matched resume for each job — never use a generic one if a specific match exists
- If no resume matches a job, SKIP it — don't apply with the wrong resume
- **CRITICAL: NEVER write inline Python, Ruby, or multi-line scripts in Bash.** This is the #1 rule. Any Bash command with a newline followed by a # comment triggers an un-skippable security prompt that breaks automation. Use ONLY:
  - `npx tsx scripts/auto-apply-data.ts` (load profile)
  - `npx tsx scripts/match-resume.ts "<title>"` (match resume)
  - `npx tsx scripts/auto-apply-record-external.ts --company="X" --title="Y" --url="Z" --status="S"` (record result)
  - `cat <file>` for reading JSON files (single-line commands only)
- **NEVER pipe commands into python3, node -e, or any inline interpreter**
- Use ONLY Playwright MCP tools (`browser_navigate`, `browser_click`, `browser_type`, `browser_snapshot`, `browser_tab_list`) to interact with web pages
- When a page snapshot is too large, use Playwright to click/filter/paginate — do NOT download and parse the snapshot with scripts
