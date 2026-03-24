# Auto-Apply Skill

Autonomously apply to all eligible jobs in the database using browser automation.

## Invocation

User says: `/auto-apply`

## Instructions

When this skill is invoked, follow these steps:

### 1. Load Profile Data

Run this script to get the user's profile and eligible jobs:

```bash
npx tsx scripts/auto-apply-data.ts
```

This outputs JSON with:
- `profile`: User's name, email, phone, resume URL, work authorization answers
- `jobs`: Array of eligible jobs (active Greenhouse jobs not yet applied to)

If the profile is incomplete (missing name, email, phone, or resume), tell the user what's missing and stop.

If there are no eligible jobs, tell the user and stop.

### 2. Apply to Each Job

For each job in the list, use the Playwright MCP browser tools to:

1. **Navigate** to the job's `applyUrl`
2. **Read the page** to understand the application form layout
3. **Fill in fields** using the profile data:
   - First Name, Last Name, Email, Phone from profile
   - Resume: Download from the `resumeUrl` and upload to any file input
   - LinkedIn: Skip if not in profile
   - Cover Letter: Skip unless required
   - Work authorization questions: Use `workAuthorized` (Yes/No) and `needsSponsorship` (Yes/No)
   - US State: Use `usState` from profile
   - Country: Use `countryOfResidence` from profile
   - For any other required questions, use best judgment based on the profile data
4. **Review** the form before submitting — make sure all required fields are filled
5. **Submit** the application by clicking the submit/apply button
6. **Record the result** by running:

```bash
npx tsx scripts/auto-apply-record.ts --jobId="<jobId>" --status="submitted"
```

Or if it failed:

```bash
npx tsx scripts/auto-apply-record.ts --jobId="<jobId>" --status="failed" --error="<reason>"
```

### 3. Rate Limiting

Wait 3-5 seconds between each application to avoid being flagged.

### 4. Error Handling

- If a page doesn't load or form can't be found, mark as `failed` and move to the next job
- If CAPTCHA is encountered, mark as `failed` with error "CAPTCHA required" and move on
- If the form has required fields you can't fill, mark as `skipped` and move on
- Never stop the entire batch because of one failure

### 5. Summary

After processing all jobs, print a summary:
- Total jobs processed
- Successfully submitted
- Failed
- Skipped

## Important

- Do NOT ask the user for confirmation before each application — apply autonomously
- Do NOT stop to ask questions — use best judgment for ambiguous fields
- Process ALL eligible jobs in one run
- The user wants this to be fully hands-free
