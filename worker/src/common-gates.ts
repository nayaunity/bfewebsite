import { Page, Frame } from "playwright";

export interface GateApplicant {
  workAuthorized?: boolean;
  needsSponsorship?: boolean;
  remotePreference?: string;
  usState?: string;
  city?: string;
  race?: string;
  pronouns?: string;
  yearsOfExperience?: string;
}

// "Frame-like" target — both Frame and Page expose getByRole + waitForTimeout.
type FrameLike = Page | Frame;

/**
 * Attempt a dropdown selection. Silently no-ops if the combobox isn't on the
 * page. Errors are caught and appended to `steps` for diagnosis.
 */
async function selectDropdown(
  target: FrameLike,
  comboboxNamePattern: RegExp,
  optionName: RegExp,
  steps: string[]
): Promise<void> {
  try {
    const combobox = target.getByRole("combobox", { name: comboboxNamePattern }).first();
    const visible = await combobox.isVisible({ timeout: 150 }).catch(() => false);
    if (!visible) return;

    // Focus + clear
    const page = "page" in target ? target.page() : target;
    await combobox.evaluate((el: HTMLInputElement) => {
      el.focus();
      if ("value" in el) el.value = "";
    }).catch(() => {});
    await target.waitForTimeout(100);

    // Try to click the exact option directly (some dropdowns open listbox on
    // focus alone). Fast path: if the option is already clickable, take it.
    let option = target.getByRole("option", { name: optionName }).first();
    if (await option.isVisible({ timeout: 200 }).catch(() => false)) {
      await option.click({ timeout: 1500 }).catch(() => {});
      steps.push(`Gate dropdown set (direct): ${comboboxNamePattern.source}`);
      return;
    }

    // Type a filter derived from the option regex
    const valueText = optionName.source
      .replace(/\\/g, "")
      .replace(/[\^$.*+?()[\]{}|]/g, " ")
      .split(" ")
      .filter(Boolean)[0] || "";
    const search = valueText.slice(0, 12);
    if (!search) {
      await page.keyboard.press("Enter").catch(() => {});
      return;
    }
    await page.keyboard.type(search, { delay: 35 });
    await target.waitForTimeout(350);

    option = target.getByRole("option", { name: optionName }).first();
    if (await option.isVisible({ timeout: 500 }).catch(() => false)) {
      await option.click({ timeout: 1500 }).catch(() => {});
      steps.push(`Gate dropdown set: ${comboboxNamePattern.source} → ${optionName.source}`);
    } else {
      await page.keyboard.press("Enter").catch(() => {});
    }
    await target.waitForTimeout(150);
  } catch (e) {
    steps.push(
      `Gate dropdown failed ${comboboxNamePattern.source}: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

/**
 * Click a yes/no radio button matching the label pattern. Used for radio-group
 * gates (work authorization, sponsorship, in-office acknowledgement) that are
 * more common on Ashby and Lever than dropdowns.
 */
async function clickRadio(
  target: FrameLike,
  labelPattern: RegExp,
  choice: "Yes" | "No",
  steps: string[]
): Promise<void> {
  try {
    const group = target.getByRole("radiogroup", { name: labelPattern }).first();
    const groupVisible = await group.isVisible({ timeout: 150 }).catch(() => false);
    if (!groupVisible) return;
    // Find the specific Yes/No option inside this group.
    const option = group
      .getByRole("radio", { name: new RegExp(`^${choice}$`, "i") })
      .first();
    if (await option.isVisible({ timeout: 200 }).catch(() => false)) {
      await option.check({ timeout: 1500, force: true }).catch(() => {});
      steps.push(`Gate radio: ${labelPattern.source} → ${choice}`);
    }
  } catch (e) {
    steps.push(`Gate radio failed ${labelPattern.source}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Check a required attestation/consent checkbox.
 */
async function checkCheckbox(
  target: FrameLike,
  labelPattern: RegExp,
  steps: string[]
): Promise<void> {
  try {
    const box = target.getByRole("checkbox", { name: labelPattern }).first();
    if (!(await box.isVisible({ timeout: 150 }).catch(() => false))) return;
    if (await box.isChecked().catch(() => false)) return;
    await box.check({ timeout: 1500, force: true }).catch(() => {});
    steps.push(`Gate checkbox checked: ${labelPattern.source}`);
  } catch (e) {
    steps.push(`Gate checkbox failed ${labelPattern.source}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Run the common gate handlers on any form that's already navigated to. Safe
 * to call as a pre-pass before the Claude loop: every action is guarded by
 * visibility checks and is silent if the field isn't on the page. The `steps`
 * array captures the trace for the caller.
 *
 * Designed for non-Greenhouse forms (Ashby, Lever, Workday, raw). Greenhouse
 * has its own deterministic handler with overlapping patterns.
 */
export async function fillCommonGates(
  target: FrameLike,
  applicant: GateApplicant,
  steps: string[]
): Promise<void> {
  // --- Work authorization ---
  const workAuth = applicant.workAuthorized ? /^Yes/i : /^No/i;
  await selectDropdown(target, /authori[sz]ed to work|work authori[sz]ation|eligib.*work.*US/i, workAuth, steps);
  await clickRadio(target, /authori[sz]ed to work|work authori[sz]ation|eligib.*work/i, applicant.workAuthorized ? "Yes" : "No", steps);

  // --- Sponsorship ---
  const needsSponsor = applicant.needsSponsorship ? /^Yes/i : /^No/i;
  await selectDropdown(target, /require.*sponsor|visa.*sponsor|sponsor.*visa/i, needsSponsor, steps);
  await clickRadio(target, /require.*sponsor|visa.*sponsor/i, applicant.needsSponsorship ? "Yes" : "No", steps);

  // --- In-office / anchor days acknowledgement ---
  // Most companies phrase this as a required "I acknowledge" / "I understand".
  // Default to "Yes" / check-it behavior since declining usually blocks the app.
  const inOfficePattern = /anchor.*days|anchor days|three anchor|hybrid.*model|in.office.*day|days per week.*office|acknowledge.*in.office|understand.*in.office/i;
  await selectDropdown(target, inOfficePattern, /^Yes|I acknowledge|I understand|confirm|agree/i, steps);
  await clickRadio(target, inOfficePattern, "Yes", steps);
  await checkCheckbox(target, /anchor.*days|three anchor|in.office.*requirement|understand.*in.office|acknowledge.*office/i, steps);

  // --- Country of residence ---
  await selectDropdown(target, /country of residence|current country/i, /^US$|United States/i, steps);

  // --- Generic consent + attestation checkboxes (universal) ---
  await checkCheckbox(target, /certify.*accurate|information.*truthful|information.*accurate|acknowledge.*truthful/i, steps);
  await checkCheckbox(target, /privacy policy|privacy notice|candidate privacy/i, steps);
  await checkCheckbox(target, /consent.*use of AI|AI.*evaluat|recording consent/i, steps);

  // --- Pronouns (use Prefer not to say if not provided) ---
  const pronouns = applicant.pronouns || "Prefer not to say";
  const pronounPattern = new RegExp(pronouns.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "|Prefer not|Decline", "i");
  await selectDropdown(target, /^pronouns$|preferred pronouns/i, pronounPattern, steps);

  // --- Race/Ethnicity demographic dropdown (the cross-company stuck cluster) ---
  const racePattern = applicant.race
    ? new RegExp(applicant.race.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "|Decline|Prefer not", "i")
    : /Decline|Prefer not|don.t wish/i;
  await selectDropdown(target, /please identify your race|race.*ethnicity|racial.*ethnic|what is your race|ethnic(?:ity)?/i, racePattern, steps);

  // --- Veteran / disability (decline to self-identify is always safe default) ---
  await selectDropdown(target, /veteran status|are you.*veteran/i, /Decline|Prefer not|I don.t|No$/i, steps);
  await selectDropdown(target, /disability status|disability.*self/i, /Decline|Prefer not|don.t wish|No$/i, steps);

  // --- Gender (similarly safe default) ---
  await selectDropdown(target, /^gender$|gender identity/i, /Decline|Prefer not|Decline to self-identify/i, steps);

  // --- State of residence ---
  if (applicant.usState) {
    const state = new RegExp("^" + applicant.usState.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i");
    await selectDropdown(target, /state of residence|which state|current state|state.*reside/i, state, steps);
  }

  // --- Previously applied / previously worked (universal "No" for new candidates) ---
  await selectDropdown(target, /previously.*applied|previously.*worked for|have you.*applied before/i, /^No/i, steps);
}

/**
 * Best-effort core identity fill for Ashby forms. Ashby uses stable
 * `[name="_systemfield_name"]` / `[name="_systemfield_email"]` etc. attributes
 * on inputs inside a normal page (no iframe). Safe to call as a pre-pass.
 */
export async function ashbyIdentityFill(
  page: Page,
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    linkedinUrl?: string;
    city?: string;
  },
  steps: string[]
): Promise<void> {
  const fields: { sel: string; value: string; label: string }[] = [
    { sel: 'input[name="_systemfield_name"]', value: `${applicant.firstName} ${applicant.lastName}`.trim(), label: "Name" },
    { sel: 'input[name="_systemfield_email"]', value: applicant.email, label: "Email" },
    { sel: 'input[name="_systemfield_phoneNumber"]', value: applicant.phone, label: "Phone" },
    { sel: 'input[name*="linkedin" i]', value: applicant.linkedinUrl || "", label: "LinkedIn" },
    { sel: 'input[name="_systemfield_location"]', value: applicant.city || "", label: "Location" },
  ];
  for (const f of fields) {
    if (!f.value) continue;
    try {
      const el = page.locator(f.sel).first();
      if (await el.isVisible({ timeout: 300 }).catch(() => false)) {
        await el.fill(f.value).catch(() => {});
        steps.push(`Ashby identity: ${f.label} = ${f.value.slice(0, 20)}`);
      }
    } catch {
      /* skip */
    }
  }
}

/**
 * Best-effort core identity fill for Lever forms. Lever uses `name=name`,
 * `name=email`, `name=phone`, etc. on inputs.
 */
export async function leverIdentityFill(
  page: Page,
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    linkedinUrl?: string;
  },
  steps: string[]
): Promise<void> {
  const fields: { sel: string; value: string; label: string }[] = [
    { sel: 'input[name="name"]', value: `${applicant.firstName} ${applicant.lastName}`.trim(), label: "Name" },
    { sel: 'input[name="email"]', value: applicant.email, label: "Email" },
    { sel: 'input[name="phone"]', value: applicant.phone, label: "Phone" },
    { sel: 'input[name="urls[LinkedIn]" i]', value: applicant.linkedinUrl || "", label: "LinkedIn" },
  ];
  for (const f of fields) {
    if (!f.value) continue;
    try {
      const el = page.locator(f.sel).first();
      if (await el.isVisible({ timeout: 300 }).catch(() => false)) {
        await el.fill(f.value).catch(() => {});
        steps.push(`Lever identity: ${f.label} = ${f.value.slice(0, 20)}`);
      }
    } catch {
      /* skip */
    }
  }
}
