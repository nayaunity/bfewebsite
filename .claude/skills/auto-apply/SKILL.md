# Auto-Apply Skill

Autonomously browse company career pages, find relevant jobs, and apply using browser automation.

## Invocation

- `/auto-apply` — Apply to all companies in the target list
- `/auto-apply Anthropic, OpenAI` — Apply only to specific companies
- `/auto-apply --add "Company Name" "https://careers.example.com"` — Add a new company to the target list

## Instructions

### 1. Load Profile & Target Companies

Run this to get the user's profile:

```bash
npx tsx scripts/auto-apply-data.ts
```

Read the target companies list:

```bash
cat scripts/target-companies.json
```

If specific companies were named in the command, filter the list to only those. If `--add` was used, append the new company to `scripts/target-companies.json` and include it in this run.

If the profile is incomplete (missing name, email, phone, or resume), tell the user what's missing and stop.

### 2. Download Resume

Before starting, download the user's resume from the `resumeUrl` to a local temp file so it can be uploaded to forms:

```bash
curl -L -o /tmp/resume.pdf "<resumeUrl>"
```

### 3. For Each Company: Browse, Find Jobs, Apply

For each company in the target list:

#### 3a. Navigate to the careers page

Use Playwright to open the company's `careersUrl`.

#### 3b. Search for relevant jobs

- Look for a search box or filter options on the careers page
- Search for relevant terms based on the user's background (e.g., "software engineer", "developer", "engineering")
- If there are location filters, try filtering to the user's state or "Remote"
- Browse the job listings that appear

#### 3c. For each relevant job listing

1. **Click into the job** to see the full description and application form
2. **Evaluate fit** — read the job title and requirements. Skip if it's clearly not a tech/engineering role or requires 10+ years of senior experience the user likely doesn't have
3. **Find the Apply button** — click "Apply", "Apply Now", or similar
4. **Fill the application form** using profile data:
   - First Name, Last Name, Email, Phone
   - Resume: Upload from `/tmp/resume.pdf`
   - LinkedIn: Skip unless required
   - Cover Letter: Skip unless required, if required write a brief 3-sentence one
   - Work authorization: Use `workAuthorized` (Yes) and `needsSponsorship` (No/Yes from profile)
   - US State / Location: Use `usState` from profile
   - Country: Use `countryOfResidence` from profile
   - For dropdown/select questions: Pick the closest matching option
   - For free-text required questions: Use best judgment based on profile data
   - For optional fields: Skip them
5. **Submit** the application
6. **Record the result**:

```bash
npx tsx scripts/auto-apply-record-external.ts --company="<Company>" --title="<Job Title>" --url="<Job URL>" --status="submitted"
```

Or if failed:

```bash
npx tsx scripts/auto-apply-record-external.ts --company="<Company>" --title="<Job Title>" --url="<Job URL>" --status="failed" --error="<reason>"
```

7. **Navigate back** to the job listings and continue to the next job

#### 3d. Move to next company

After processing available jobs at one company, move to the next.

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

| Company | Jobs Found | Applied | Skipped | Failed |
|---------|-----------|---------|---------|--------|

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
