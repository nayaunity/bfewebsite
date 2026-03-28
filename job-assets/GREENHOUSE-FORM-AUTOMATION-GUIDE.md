# Greenhouse Job Application Form Automation Guide

**Purpose:** This document describes exactly how to automate filling and submitting Greenhouse job application forms using Playwright MCP tools. It was written from a real successful application session (Stripe, Software Engineer, Bridge — March 28, 2026) and documents every interaction pattern, failure mode, and solution.

A different Claude session reading this should be able to replicate the process without trial-and-error.

---

## Table of Contents

1. [Overview of the Full Flow](#1-overview-of-the-full-flow)
2. [Navigating to the Application Form](#2-navigating-to-the-application-form)
3. [Understanding Greenhouse Form Field Types](#3-understanding-greenhouse-form-field-types)
4. [Filling Plain Text Fields](#4-filling-plain-text-fields)
5. [Filling Autocomplete Comboboxes (e.g., Location)](#5-filling-autocomplete-comboboxes-eg-location)
6. [Filling Static Dropdowns (e.g., Country, Yes/No)](#6-filling-static-dropdowns-eg-country-yesno)
7. [Filling the Phone Country Code Dropdown](#7-filling-the-phone-country-code-dropdown)
8. [Checking Checkboxes](#8-checking-checkboxes)
9. [Uploading Resume/CV Files](#9-uploading-resumecv-files)
10. [Answering Free-Text Questions](#10-answering-free-text-questions)
11. [Filling EEO/Demographic Fields](#11-filling-eeodemographic-fields)
12. [Submitting the Application](#12-submitting-the-application)
13. [Verifying Submission Success](#13-verifying-submission-success)
14. [Handling Validation Errors](#14-handling-validation-errors)
15. [Common Failures and How to Avoid Them](#15-common-failures-and-how-to-avoid-them)
16. [Complete Field-by-Field Walkthrough](#16-complete-field-by-field-walkthrough)
17. [The browser_fill_form Shortcut](#17-the-browser_fill_form-shortcut)

---

## 1. Overview of the Full Flow

The end-to-end process is:

1. Navigate to the job listing page
2. Click "Apply" / "Apply Now" to reach the Greenhouse form
3. The form loads inside an **iframe** with title `"Greenhouse Job Board"`
4. Fill all required fields (text, dropdowns, checkboxes, file uploads)
5. Click "Submit application"
6. Verify the "Thank you for applying" confirmation page
7. Record the result

**Critical context:** Greenhouse forms are rendered inside an iframe. All Playwright MCP tools automatically handle the iframe when you reference elements by their `ref` attribute from the snapshot. You do NOT need to manually switch iframe context — the tools resolve the iframe automatically based on the `ref`.

---

## 2. Navigating to the Application Form

### Step 1: Navigate to the job listing page

```
Tool: browser_navigate
url: https://stripe.com/jobs/listing/software-engineer-bridge/7277110
```

### Step 2: Find and click the Apply button

Take a snapshot, look for a link or button with text like "Apply for this role" or "Apply Now". In the Stripe/Greenhouse pattern, it's typically a link:

```yaml
link "Apply for this role" [ref=e144] [cursor=pointer]:
  - /url: /jobs/listing/software-engineer-bridge/7277110/apply
```

```
Tool: browser_click
ref: e144
element: "Apply for this role"
```

### Step 3: Verify the form loaded

After clicking, the snapshot should show the Greenhouse iframe with the form:

```yaml
- iframe [ref=e56]:
  - heading "Apply for this job" [level=2]
  - textbox "First Name" [ref=f7e23]
  - textbox "Last Name" [ref=f7e28]
  ...
```

**Key indicator:** Element refs inside the iframe are prefixed with `f7e` (or similar frame prefix), while outer page refs are just `e`. This tells you you're reading iframe content.

---

## 3. Understanding Greenhouse Form Field Types

Greenhouse forms use **four distinct field types**, each requiring a different interaction pattern:

### Type A: Plain Textbox
```yaml
- textbox "First Name" [ref=f7e23]
```
- Standard text input
- Use `browser_type` with `fill()` semantics (default behavior)
- Works reliably every time

### Type B: Autocomplete Combobox (searchable)
```yaml
- combobox "Location (City)" [ref=f7e70]
```
- Has a text input that triggers a search API as you type
- Returns filtered options in a `listbox`
- **MUST type slowly** using `slowly: true` to trigger keystroke events
- `fill()` will NOT work — it doesn't trigger the search

### Type C: Static Dropdown (non-searchable)
```yaml
- generic [ref=f7e118]: Select...
- combobox "Please select the country where you currently reside." [ref=f7e120]
- button "Toggle flyout" [ref=f7e122]
```
- Has a combobox element but **typing into it does NOT search**
- Typing produces "0 results available" or "No options"
- **MUST click the "Toggle flyout" button** to open the full list
- Then click the desired option from the listbox

### Type D: Checkbox Group
```yaml
- checkbox "US" [ref=f7e238]
- generic: US
```
- Standard checkboxes, just click to toggle
- Used for multi-select questions like "countries you anticipate working in"

### How to tell Type B from Type C:

You often can't tell in advance. The approach is:
1. Try the toggle button approach first (Type C) — it's the most common in Greenhouse
2. If the field has location/city in its label, it's likely Type B (autocomplete)
3. If you accidentally type into a Type C field and get "0 results", click the toggle button to reset and open the full list

---

## 4. Filling Plain Text Fields

**Tool:** `browser_type`

These are the simplest. Just reference the textbox and provide the text. The default behavior uses Playwright's `fill()` which clears any existing value and sets the new one.

### Fields that use this pattern:

| Field | Example ref | Value |
|---|---|---|
| First Name | f7e23 | `Nyaradzo` |
| Last Name | f7e28 | `Bere` |
| Email | f7e33 | `NayaUnityBere@gmail.com` |
| Phone number | f7e58 | `7206298925` |
| Current/previous employer | f7e317 | `The Black Female Engineer (Self-employed)` |
| Current/previous job title | f7e322 | `CTO / AI Engineer` |
| Most recent school | f7e327 | `University of Colorado Boulder, Leeds School of Business` |
| Most recent degree | f7e332 | `B.S. Finance & Accounting` |
| City and state | f7e362 | `Denver, Colorado` |
| Why interested in X | f7e357 | *(long-form answer)* |

### Example call:

```
Tool: browser_type
ref: f7e23
element: "First Name"
text: "Nyaradzo"
```

### Parallel filling:

Multiple independent text fields CAN be filled in parallel (multiple tool calls in one message). This is safe because they don't depend on each other:

```
# These 4 can all be called in parallel:
browser_type ref=f7e317 text="The Black Female Engineer (Self-employed)"
browser_type ref=f7e322 text="CTO / AI Engineer"
browser_type ref=f7e327 text="University of Colorado Boulder, Leeds School of Business"
browser_type ref=f7e332 text="B.S. Finance & Accounting"
```

### Important notes:
- Do NOT use `slowly: true` for plain text fields — it's unnecessary and slow
- `fill()` (the default) properly clears the field first, so you don't get concatenation
- For free-text questions with apostrophes/quotes, the tool handles escaping automatically

---

## 5. Filling Autocomplete Comboboxes (e.g., Location)

**This is the trickiest field type.** The Location (City) field in Greenhouse uses a search-as-you-type autocomplete that fetches results from an API.

### Why `fill()` fails:
`fill()` sets the entire value at once and dispatches a single `input` event. Greenhouse's autocomplete needs individual keystroke events to progressively filter results and fetch from the API. With `fill()`, the dropdown never opens.

### Correct approach:

#### Step 1: Type slowly to trigger autocomplete
```
Tool: browser_type
ref: f7e70
element: "Location (City)"
text: "Denver"
slowly: true    # <-- CRITICAL: This uses pressSequentially() instead of fill()
```

#### Step 2: Verify the listbox appeared in the snapshot response
The snapshot will show:
```yaml
- log: Denver, Colorado, United States, 1 of 10. 10 results available...
- combobox "Location (City)" [expanded] [active] [ref=f7e70]: Denver
- listbox [ref=f7e501]:
  - option "Denver, Colorado, United States" [ref=f7e502]
  - option "Denver City, Texas, United States" [ref=f7e503]
  - option "Denver, Pennsylvania, United States" [ref=f7e504]
  ...
```

**Key indicators of success:**
- `[expanded]` attribute on the combobox
- A `listbox` element with `option` children appeared
- The `log` element shows "X results available"

#### Step 3: Click the correct option
```
Tool: browser_click
ref: f7e502
element: "Denver, Colorado, United States option"
```

#### Step 4: Verify selection in the snapshot response
```yaml
- log: option Denver, Colorado, United States, selected.
- generic [ref=f7e512]: Denver, Colorado, United States
- combobox "Location (City)" [ref=f7e70]
- button "Clear selections" [ref=f7e515]    # <-- confirms selection
```

### What to type:
- Type just the city name (e.g., "Denver") — don't type the full "Denver, Colorado, United States"
- Use enough characters to narrow results but not so many that you might not match (e.g., "Denver" not "Den")

---

## 6. Filling Static Dropdowns (e.g., Country, Yes/No)

These are the most common dropdown type in Greenhouse forms. They look like comboboxes but **do not support text search**.

### How to identify them:
- They have a "Toggle flyout" button next to the combobox
- The initial state shows `Select...` as placeholder
- Typing into them produces "0 results available" or "No options"

### Correct approach:

#### Step 1: Click the "Toggle flyout" button to open the dropdown
```
Tool: browser_click
ref: f7e122    # the Toggle flyout button ref
element: "Toggle flyout for country residence"
```

#### Step 2: The snapshot shows all available options
```yaml
- log: Australia, 1 of 29. 29 results available.
- combobox [expanded] [active]
- listbox [ref=f7e527]:
  - option "Australia" [ref=f7e528]
  - option "Belgium" [ref=f7e529]
  ...
  - option "US" [ref=f7e555]
  - option "Other" [ref=f7e556]
```

#### Step 3: Click the desired option
```
Tool: browser_click
ref: f7e555
element: "US option for country of residence"
```

#### Step 4: Verify selection
```yaml
- log: option US, selected.
- generic [ref=f7e557]: US
- combobox "Please select the country..." [active]
- button "Clear selections" [ref=f7e559]    # <-- confirms selection
```

### Fields that use this pattern:

| Field | Options (typical) |
|---|---|
| Country where you currently reside | Australia, Belgium, ..., US, Other |
| Are you authorized to work... | Yes, No |
| Will you require sponsorship... | Yes, No |
| Plan to work remotely? | Yes I intend to work remotely, No I intend to work from an office |
| Previously employed by Stripe? | Yes, No |
| WhatsApp opt-in | Yes, No |
| Gender | Male, Female, Decline To Self Identify |
| Hispanic/Latino | Yes, No, Decline To Self Identify |
| Race | American Indian..., Asian, Black or African American, White, ..., Decline |
| Veteran Status | I am not a protected veteran, I identify as..., I don't wish to answer |
| Disability Status | Yes I have a disability..., No I do not..., I do not want to answer |

### DO NOT type into these fields first:
If you accidentally type into a static dropdown, it enters a broken state where:
- The typed text shows in the combobox
- "No options" or "0 results" appears
- Subsequent toggle clicks may not work properly

**Recovery from broken state:**
1. Click the Toggle flyout button once (closes the broken dropdown)
2. Click the Toggle flyout button again (opens a fresh dropdown with `Select...` reset)
3. Now click your desired option

---

## 7. Filling the Phone Country Code Dropdown

This is a specific instance of the static dropdown pattern, but it's in a nested `group` element labeled "Phone" and the options include country codes.

### Structure in the snapshot:
```yaml
- group "Phone" [ref=f7e35]:
  - generic: Phone
  - generic:
    - generic: Country*
    - generic:
      - combobox "Country" [ref=f7e48]
      - button "Toggle flyout" [ref=f7e50]
  - generic:
    - generic: Phone*
    - textbox "Phone" [ref=f7e58]
```

### Correct approach:

#### Step 1: Click the Toggle flyout for the phone country
```
Tool: browser_click
ref: f7e50
element: "Toggle flyout for phone country"
```

#### Step 2: Select "United States +1" from the 244-option list
```yaml
- listbox:
  - option "United States +1" [ref=f7e680]    # First in list
  - option "Afghanistan +93" [ref=f7e682]
  ...
```

```
Tool: browser_click
ref: f7e680
element: "United States +1 phone country"
```

#### Step 3: Verify — the phone number auto-formats
After selecting the country code, Greenhouse may auto-format the phone number:
```yaml
- generic [ref=f7e1170]: "+1"
- textbox "Phone" [active] [ref=f7e58]: (720) 629-8925
```

### Important:
- This field is often **missed** because it defaults to no country selected but doesn't show a visible error until you try to submit
- Always set this BEFORE submitting, or you'll get a validation error: "Select a country"
- The phone number field itself is a plain textbox — fill it with digits only (e.g., `7206298925`), and Greenhouse formats it after the country code is selected

---

## 8. Checking Checkboxes

Used for multi-select questions like "Select the country or countries you anticipate working in."

### Structure:
```yaml
- group "Please select the country or countries..." [ref=f7e126]:
  - checkbox "Australia" [ref=f7e130]
  - generic: Australia
  - checkbox "Belgium" [ref=f7e134]
  - generic: Belgium
  ...
  - checkbox "US" [ref=f7e238]
  - generic: US
```

### Correct approach:
```
Tool: browser_click
ref: f7e238
element: "US checkbox for anticipated work country"
```

### Verify:
```yaml
- checkbox "US" [checked] [active] [ref=f7e238]
#                ^^^^^^^^^ confirms it's checked
```

### Notes:
- Clicking a checked checkbox unchecks it — don't double-click
- You can check multiple checkboxes (they're independent)
- Check the snapshot response for `[checked]` to confirm

---

## 9. Uploading Resume/CV Files

Greenhouse file upload uses a button that triggers a native file chooser dialog.

### Structure:
```yaml
- group "Resume/CV" [ref=f7e73]:
  - generic: Resume/CV
  - generic:
    - button "Attach" [ref=f7e79]
    - generic: Attach
    - button "Attach" [ref=f7e81]
    - button "Dropbox" [ref=f7e83]
    - button "Enter manually" [ref=f7e86]
    - paragraph: "Accepted file types: pdf, doc, docx, txt, rtf"
```

### Correct approach:

#### Step 1: Click the first "Attach" button
```
Tool: browser_click
ref: f7e79
element: "Resume/CV Attach button"
```

#### Step 2: The snapshot response shows a file chooser modal
```yaml
### Modal state
- [File chooser]: can be handled by browser_file_upload
### Snapshot
(empty - modal is blocking)
```

#### Step 3: Upload the file
```
Tool: browser_file_upload
paths: ["/absolute/path/to/resume.pdf"]
```

#### Step 4: Verify upload in the snapshot response
```yaml
- group "Resume/CV" [ref=f7e73]:
  - generic: Resume/CV
  - generic:
    - img [ref=f7e492]
    - paragraph: N.Bere-AI-Engineer.pdf    # <-- filename shown
    - button "Remove file" [ref=f7e497]     # <-- remove button appeared
```

**Key indicators of success:**
- The filename appears as text
- A "Remove file" button appears
- The "Attach" buttons are gone, replaced by the file display

### Important:
- Use **absolute paths** for the file
- The file must actually exist at that path — verify with the resume matching script first
- Cover Letter uses the same pattern but is usually optional — skip it unless required
- If the upload fails silently, the "Attach" buttons will still be visible

---

## 10. Answering Free-Text Questions

For questions like "Why are you interested in Bridge?", use `browser_type` with a tailored answer.

### Approach:
```
Tool: browser_type
ref: f7e357
element: "Why are you interested in Bridge?"
text: "I'm drawn to Bridge because it sits at the intersection of two things I care deeply about: building critical financial infrastructure and working with emerging technology at scale..."
```

### How to tailor answers:
1. Load answers from `job-assets/application-answers.json`
2. Use the `commonQuestions` section keyed by the matched resume type (e.g., "AI Engineer / Software Engineer")
3. Adapt the `whyThisCompany` answer to reference the specific company name and product
4. For Bridge specifically, reference stablecoins, global money movement, API products — pulled from the job description

### Notes:
- These are plain textboxes, so `fill()` works fine (no need for `slowly: true`)
- Apostrophes and special characters are handled automatically
- Keep answers under ~500 words — Greenhouse may have character limits
- Do NOT copy-paste generic answers — always reference the specific company/product/team

---

## 11. Filling EEO/Demographic Fields

These are **voluntary** self-identification fields at the bottom of the form. They use the **static dropdown** pattern (Type C).

### Fields and values used:

| Field | Dropdown Option Selected |
|---|---|
| Gender | Female |
| Are you Hispanic/Latino? | No |
| Please identify your race | Black or African American |
| Veteran Status | I am not a protected veteran |
| Disability Status | No, I do not have a disability and have not had one in the past |

### Important behavior — conditional fields:
When you answer "No" to "Are you Hispanic/Latino?", a **new field appears** that wasn't in the original snapshot:

```yaml
# BEFORE answering Hispanic/Latino:
- generic: Are you Hispanic/Latino?
  - combobox [ref=f7e398]

# AFTER answering "No":
- generic: Are you Hispanic/Latino?
  - generic: "No"
- generic:                                    # <-- NEW FIELD APPEARED
  - generic: Please identify your race
  - combobox [ref=f7e638]
  - button "Toggle flyout" [ref=f7e640]
```

**You MUST take a new snapshot (or read the response snapshot) after answering conditional questions** to see if new fields appeared. The race field only shows after answering the Hispanic/Latino question.

### Process for each EEO field:
1. Click the Toggle flyout button
2. Read the options from the listbox
3. Click the appropriate option
4. Verify the selection in the response snapshot
5. Check if any new fields appeared

---

## 12. Submitting the Application

### Step 1: Click "Submit application"
```
Tool: browser_click
ref: f7e487
element: "Submit application"
```

### Step 2: Check the response for one of two outcomes:

**Success:**
```yaml
- heading "Thank you for applying." [level=1]
- paragraph: Thank you for submitting your application to Stripe...
- link "View more jobs at Stripe"
- link "Back to job post"
```

**Validation Error:**
```yaml
# The form stays open, and error messages appear near invalid fields:
- paragraph [ref=f7eXXX]: Select a country    # validation error
- paragraph [ref=f7eXXX]: This field is required
```

---

## 13. Verifying Submission Success

The confirmation is unambiguous. Look for:

1. **Heading:** `"Thank you for applying."` — this is the definitive success signal
2. **Paragraph** starting with "Thank you for submitting your application to..."
3. **Links** to "View more jobs" and "Back to job post"
4. **The form fields are gone** — replaced entirely by the thank-you content

If you see any of these, the application was submitted. Record it as "submitted".

---

## 14. Handling Validation Errors

When submission fails, Greenhouse shows inline errors and the form stays open.

### Common validation errors:

| Error | Cause | Fix |
|---|---|---|
| "Select a country" | Phone country code not set | Open the phone Country toggle, select "United States +1" |
| "This field is required" | A required field was missed | Find the field in the snapshot and fill it |
| "Please select at least one option" | Checkbox group empty | Check the appropriate checkbox(es) |
| "Invalid email address" | Email format wrong | Re-fill with valid email |

### Recovery process:
1. Read the error messages in the snapshot
2. Fix the specific field(s)
3. Click "Submit application" again
4. Do NOT re-fill fields that were already correctly filled — they retain their values

---

## 15. Common Failures and How to Avoid Them

### Failure 1: Typing into a non-searchable dropdown
**Symptom:** "0 results available" or "No options" after typing
**Cause:** The dropdown doesn't support text search
**Fix:** Click the Toggle flyout button instead. If you already typed, click Toggle twice (once to close the broken state, once to reopen fresh).

### Failure 2: Text concatenation in comboboxes
**Symptom:** Field shows "USUnited States" instead of just one value
**Cause:** Typing into a combobox without clearing it first
**Fix:** Click Toggle flyout to reset to "Select...", then click Toggle again to open the clean dropdown.

### Failure 3: `fill()` doesn't trigger autocomplete
**Symptom:** Location field shows "Denver" but no dropdown options appear
**Cause:** `fill()` doesn't fire individual keystroke events
**Fix:** Use `slowly: true` parameter which uses `pressSequentially()` instead.

### Failure 4: Phone country code missed
**Symptom:** Validation error "Select a country" on submit
**Cause:** The phone country dropdown defaults to empty but doesn't look obviously wrong
**Fix:** Always explicitly set the phone country code before submitting.

### Failure 5: Conditional field not filled
**Symptom:** Validation error for a field you don't see in the snapshot
**Cause:** A field appeared conditionally (e.g., "Race" appears after answering "Hispanic/Latino")
**Fix:** Always read the response snapshot after filling each EEO field to check for new fields.

### Failure 6: Infinite retry loop on dropdowns
**Symptom:** Automation keeps clicking the dropdown over and over
**Cause:** Not checking the post-action state to confirm selection
**Fix:** After clicking an option, verify these signals in the response snapshot:
- The `log` element says "option X, selected."
- The placeholder changed from "Select..." to the value
- A "Clear selections" button appeared
- The `[expanded]` attribute is gone from the combobox

### Failure 7: Resume upload appears to succeed but didn't
**Symptom:** Form submits but resume is missing
**Cause:** File chooser was canceled or file path was wrong
**Fix:** After upload, verify the filename appears and the "Remove file" button is visible.

---

## 16. Complete Field-by-Field Walkthrough

Here is the exact order of operations for a Greenhouse application (Stripe pattern):

### Phase 1: Basic Info (parallel-safe)
```
1. browser_type  ref=FIRST_NAME   text="Nyaradzo"
2. browser_type  ref=LAST_NAME    text="Bere"
3. browser_type  ref=EMAIL        text="NayaUnityBere@gmail.com"
4. browser_type  ref=PHONE        text="7206298925"
```
These 4 can be done in parallel.

### Phase 2: Location (sequential, needs autocomplete)
```
5. browser_type  ref=LOCATION  text="Denver"  slowly=true
6. (read snapshot, find the option)
7. browser_click ref=DENVER_OPTION
```

### Phase 3: Resume Upload (sequential)
```
8.  browser_click       ref=ATTACH_BUTTON
9.  (snapshot shows file chooser modal)
10. browser_file_upload  paths=["/absolute/path/to/resume.pdf"]
11. (verify filename appears in snapshot)
```

### Phase 4: Static Dropdowns (sequential — each needs toggle + click)
```
12. browser_click ref=COUNTRY_TOGGLE         → shows options
13. browser_click ref=US_OPTION              → selects "US"

14. browser_click ref=CHECKBOX_US            → checks "US" for work countries

15. browser_click ref=AUTH_TOGGLE            → shows Yes/No
16. browser_click ref=YES_OPTION             → selects "Yes"

17. browser_click ref=SPONSOR_TOGGLE         → shows Yes/No
18. browser_click ref=NO_OPTION              → selects "No"

19. browser_click ref=REMOTE_TOGGLE          → shows options
20. browser_click ref=YES_REMOTE_OPTION      → selects "Yes, I intend to work remotely"

21. browser_click ref=PREV_EMPLOYED_TOGGLE   → shows Yes/No
22. browser_click ref=NO_OPTION              → selects "No"
```

### Phase 5: Text Fields (parallel-safe)
```
23. browser_type ref=EMPLOYER     text="The Black Female Engineer (Self-employed)"
24. browser_type ref=JOB_TITLE    text="CTO / AI Engineer"
25. browser_type ref=SCHOOL       text="University of Colorado Boulder, Leeds School of Business"
26. browser_type ref=DEGREE       text="B.S. Finance & Accounting"
27. browser_type ref=WHY_COMPANY  text="(tailored answer)"
28. browser_type ref=CITY_STATE   text="Denver, Colorado"
```
These 6 can be done in parallel.

### Phase 6: More Dropdowns
```
29. browser_click ref=WHATSAPP_TOGGLE  → shows Yes/No
30. browser_click ref=NO_OPTION        → selects "No"

31. browser_click ref=PHONE_COUNTRY_TOGGLE  → shows 244 countries
32. browser_click ref=US_PLUS_1_OPTION      → selects "United States +1"
```

### Phase 7: EEO Fields (sequential — conditional fields may appear)
```
33. browser_click ref=GENDER_TOGGLE      → shows Male/Female/Decline
34. browser_click ref=FEMALE_OPTION

35. browser_click ref=HISPANIC_TOGGLE    → shows Yes/No/Decline
36. browser_click ref=NO_OPTION
37. (CHECK SNAPSHOT — "Race" field may now appear)

38. browser_click ref=RACE_TOGGLE        → shows race options
39. browser_click ref=BLACK_OPTION

40. browser_click ref=VETERAN_TOGGLE     → shows veteran options
41. browser_click ref=NOT_VETERAN_OPTION

42. browser_click ref=DISABILITY_TOGGLE  → shows disability options
43. browser_click ref=NO_DISABILITY_OPTION
```

### Phase 8: Submit
```
44. browser_click ref=SUBMIT_BUTTON
45. (verify "Thank you for applying" in snapshot)
```

---

## 17. The browser_fill_form Shortcut

There is a `browser_fill_form` tool that can fill multiple fields in one call. It supports types: `textbox`, `checkbox`, `radio`, `combobox`, `slider`.

### Example usage for plain text fields:
```json
{
  "fields": [
    {"name": "First Name", "type": "textbox", "ref": "f7e23", "value": "Nyaradzo"},
    {"name": "Last Name", "type": "textbox", "ref": "f7e28", "value": "Bere"},
    {"name": "Email", "type": "textbox", "ref": "f7e33", "value": "NayaUnityBere@gmail.com"},
    {"name": "Phone", "type": "textbox", "ref": "f7e58", "value": "7206298925"}
  ]
}
```

### For combobox fields, set value to the option text:
```json
{
  "fields": [
    {"name": "Gender", "type": "combobox", "ref": "f7e381", "value": "Female"},
    {"name": "Veteran Status", "type": "combobox", "ref": "f7e422", "value": "I am not a protected veteran"}
  ]
}
```

### For checkboxes:
```json
{
  "fields": [
    {"name": "US", "type": "checkbox", "ref": "f7e238", "value": "true"}
  ]
}
```

### Caveats:
- This tool was NOT used in the successful session — the individual tool approach was used instead
- It may or may not handle the autocomplete Location field correctly (untested)
- For static dropdowns, it sets the combobox value which may or may not trigger the proper selection events
- **Recommendation:** Use `browser_fill_form` for batching plain text fields, but use the manual toggle+click approach for dropdowns to ensure reliability
- Always verify the snapshot after using this tool to confirm all fields were set correctly

---

## Summary of Key Rules

1. **Plain text fields** → `browser_type` with default `fill()`, can be parallelized
2. **Autocomplete fields** (Location) → `browser_type` with `slowly: true`, then click option
3. **Static dropdowns** (Country, Yes/No, EEO) → Click "Toggle flyout" button, then click option. **NEVER type into these.**
4. **Phone country code** → Same as static dropdown but nested in Phone group. Easy to miss.
5. **File uploads** → Click "Attach", then `browser_file_upload` with absolute path
6. **Checkboxes** → Simple `browser_click` on the checkbox ref
7. **After every action** → Read the response snapshot to verify success before moving on
8. **After EEO fields** → Check for conditional fields that may appear
9. **Before submitting** → Make sure phone country code is set (most common miss)
10. **After submitting** → Look for "Thank you for applying" heading to confirm success
