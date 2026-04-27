/**
 * Per-Workday-tenant configuration. Workday's API and apply UI are mostly
 * uniform across tenants, but each one has small variations: which optional
 * pages are included, custom application questions, exact siteName casing.
 *
 * Tenants here are the ones we've smoke-validated. Adding a tenant requires
 * a pass on the apply smoke (see worker/test/integration/smoke-companies.ts).
 */

export interface QuestionRule {
  pattern: RegExp;
  answer: string;
}

export interface WorkdayTenant {
  /** Hostname, e.g., "walmart.wd5.myworkdayjobs.com". Used as the lookup key. */
  host: string;
  /** Human-readable label for logs/metrics. */
  name: string;
  /** The tenant slug in the API path: `/wday/cxs/{tenant}/{siteName}/jobs`. */
  apiTenant: string;
  /** The siteName slug. */
  siteName: string;
  /** Pages we know this tenant skips entirely. Optional — wizard auto-detects too. */
  knownSkipPages?: WorkdayWizardStep[];
  /** Hand-written field overrides (data-automation-id values that differ from the cross-tenant defaults). */
  fieldOverrides?: Partial<WorkdayFieldMap>;
  /** Tenant-specific question→answer rules. Checked before generic defaults. */
  questionRules?: QuestionRule[];
}

export type WorkdayWizardStep =
  | "MyInformation"
  | "MyExperience"
  | "ApplicationQuestions"
  | "VoluntaryDisclosures"
  | "SelfIdentify"
  | "Review";

/**
 * Default field IDs Workday uses across tenants. These are stable
 * data-automation-id attribute values. Tenant overrides should be rare.
 */
export interface WorkdayFieldMap {
  // My Information page
  legalNameFirstName: string;
  legalNameLastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  // Account creation
  signupEmail: string;
  signupPassword: string;
  signupPasswordVerify: string;
  signupSubmit: string;

  // Sign in
  signinEmail: string;
  signinPassword: string;
  signinSubmit: string;

  // Wizard navigation
  saveAndContinue: string;
  reviewAndSubmit: string;
}

const DEFAULT_FIELD_MAP: WorkdayFieldMap = {
  legalNameFirstName: "legalNameSection_firstName",
  legalNameLastName: "legalNameSection_lastName",
  email: "email",
  phone: "phone-number",
  address1: "addressSection_addressLine1",
  city: "addressSection_city",
  state: "addressSection_countryRegion",
  postalCode: "addressSection_postalCode",
  country: "addressSection_country",

  signupEmail: "email",
  signupPassword: "password",
  signupPasswordVerify: "verifyPassword",
  signupSubmit: "createAccountSubmitButton",

  signinEmail: "email",
  signinPassword: "password",
  signinSubmit: "signInSubmitButton",

  saveAndContinue: "bottom-navigation-next-button",
  reviewAndSubmit: "bottom-navigation-next-button",
};

export function fieldMapFor(tenant: WorkdayTenant): WorkdayFieldMap {
  return { ...DEFAULT_FIELD_MAP, ...(tenant.fieldOverrides ?? {}) };
}

const GENERIC_QUESTION_RULES: QuestionRule[] = [
  { pattern: /sponsorship|visa|h-?1b/i, answer: "No" },
  { pattern: /authorized.*work|legally.*work|provide work auth|able to provide|eligib.*work/i, answer: "Yes" },
  { pattern: /age category|age range|18 years/i, answer: "18 years" },
  { pattern: /mobile text|sms|text message|opt.?in.*text/i, answer: "Opt-Out" },
  { pattern: /certify|certif|acknowledge|attest/i, answer: "Yes" },
  { pattern: /previously.*applied|applied.*before/i, answer: "No" },
  { pattern: /convicted|felony|misdemeanor|criminal/i, answer: "No" },
  { pattern: /disability|disabled/i, answer: "No" },
  { pattern: /veteran|military service/i, answer: "No" },
  { pattern: /citizen.*(cuba|iran|north korea|syria|crimea|sudan)|sanctions|sanctioned|embargo/i, answer: "No" },
  { pattern: /government.*entity|government.*official|owned.*controlled/i, answer: "No" },
  { pattern: /relative.*employed|family.*employed|related.*employee/i, answer: "No" },
];

const WALMART_QUESTION_RULES: QuestionRule[] = [
  { pattern: /family member|spouse.*partner|partner.*spouse|relative.*walmart|walmart.*relative/i, answer: "No" },
  { pattern: /uniformed services|military.*spouse/i, answer: "No" },
  { pattern: /walmart associate|sam.s club|affiliation/i, answer: "Have never been" },
  { pattern: /eligibility|industry/i, answer: "No" },
];

const ADOBE_QUESTION_RULES: QuestionRule[] = [
  { pattern: /previously.*adobe|adobe.*previously|former.*adobe|adobe.*employee/i, answer: "No" },
  { pattern: /referred|referral|employee.*refer/i, answer: "No" },
  { pattern: /non-?compete|restrictive.*covenant/i, answer: "No" },
];

const SALESFORCE_QUESTION_RULES: QuestionRule[] = [
  { pattern: /previously.*salesforce|salesforce.*previously|former.*salesforce/i, answer: "No" },
  { pattern: /referred|referral|employee.*refer/i, answer: "No" },
  { pattern: /non-?compete|restrictive.*covenant/i, answer: "No" },
  { pattern: /citizen.*(cuba|iran|north korea|syria|crimea|sudan)/i, answer: "No" },
  { pattern: /resident.*(cuba|iran|north korea|syria|crimea)/i, answer: "No" },
  { pattern: /government.*entity|government.*official|owned.*controlled/i, answer: "No" },
];

const CAPITALONE_QUESTION_RULES: QuestionRule[] = [
  { pattern: /previously.*capital one|capital one.*previously|former.*capital one/i, answer: "No" },
  { pattern: /referred|referral|employee.*refer/i, answer: "No" },
  { pattern: /background check|consent.*check/i, answer: "Yes" },
];

const CISCO_QUESTION_RULES: QuestionRule[] = [
  { pattern: /previously.*cisco|cisco.*previously|former.*cisco/i, answer: "No" },
  { pattern: /referred|referral|employee.*refer/i, answer: "No" },
  { pattern: /non-?compete|restrictive.*covenant/i, answer: "No" },
];

export const WORKDAY_TENANTS: WorkdayTenant[] = [
  {
    host: "walmart.wd5.myworkdayjobs.com",
    name: "Walmart",
    apiTenant: "walmart",
    siteName: "WalmartExternal",
    questionRules: WALMART_QUESTION_RULES,
  },
  {
    host: "adobe.wd5.myworkdayjobs.com",
    name: "Adobe",
    apiTenant: "adobe",
    siteName: "external_experienced",
    questionRules: ADOBE_QUESTION_RULES,
  },
  {
    host: "salesforce.wd12.myworkdayjobs.com",
    name: "Salesforce",
    apiTenant: "salesforce",
    siteName: "External_Career_Site",
    questionRules: SALESFORCE_QUESTION_RULES,
  },
  {
    host: "capitalone.wd12.myworkdayjobs.com",
    name: "Capital One",
    apiTenant: "capitalone",
    siteName: "Capital_One",
    questionRules: CAPITALONE_QUESTION_RULES,
  },
  {
    host: "cisco.wd5.myworkdayjobs.com",
    name: "Cisco",
    apiTenant: "cisco",
    siteName: "Cisco_Careers",
    questionRules: CISCO_QUESTION_RULES,
  },
  // --- New tenants (Apr 27, pending smoke validation) ---
  {
    host: "netflix.wd108.myworkdayjobs.com",
    name: "Netflix",
    apiTenant: "netflix",
    siteName: "Netflix",
  },
  {
    host: "intel.wd1.myworkdayjobs.com",
    name: "Intel",
    apiTenant: "intel",
    siteName: "External",
  },
  {
    host: "nvidia.wd5.myworkdayjobs.com",
    name: "NVIDIA",
    apiTenant: "nvidia",
    siteName: "NVIDIAExternalCareerSite",
  },
  {
    host: "hp.wd5.myworkdayjobs.com",
    name: "HP Inc",
    apiTenant: "hp",
    siteName: "ExternalCareerSite",
  },
  {
    host: "hpe.wd5.myworkdayjobs.com",
    name: "HPE",
    apiTenant: "hpe",
    siteName: "Jobsathpe",
  },
  {
    host: "broadcom.wd1.myworkdayjobs.com",
    name: "Broadcom",
    apiTenant: "broadcom",
    siteName: "External_Career",
  },
  {
    host: "visa.wd5.myworkdayjobs.com",
    name: "Visa",
    apiTenant: "visa",
    siteName: "Visa",
  },
  {
    host: "mastercard.wd1.myworkdayjobs.com",
    name: "Mastercard",
    apiTenant: "mastercard",
    siteName: "CorporateCareers",
  },
  {
    host: "ms.wd5.myworkdayjobs.com",
    name: "Morgan Stanley",
    apiTenant: "ms",
    siteName: "External",
  },
  {
    host: "ghr.wd1.myworkdayjobs.com",
    name: "Bank of America",
    apiTenant: "ghr",
    siteName: "Lateral-US",
  },
  {
    host: "pwc.wd3.myworkdayjobs.com",
    name: "PwC",
    apiTenant: "pwc",
    siteName: "Global_Experienced_Careers",
  },
  {
    host: "target.wd5.myworkdayjobs.com",
    name: "Target",
    apiTenant: "target",
    siteName: "targetcareers",
  },
  {
    host: "jj.wd5.myworkdayjobs.com",
    name: "Johnson & Johnson",
    apiTenant: "jj",
    siteName: "JJ",
  },
  {
    host: "pg.wd5.myworkdayjobs.com",
    name: "Procter & Gamble",
    apiTenant: "pg",
    siteName: "1000",
  },
  {
    host: "geaerospace.wd5.myworkdayjobs.com",
    name: "GE Aerospace",
    apiTenant: "geaerospace",
    siteName: "GE_ExternalSite",
  },
  {
    host: "gevernova.wd5.myworkdayjobs.com",
    name: "GE Vernova",
    apiTenant: "gevernova",
    siteName: "Vernova_ExternalSite",
  },
  {
    host: "gehc.wd5.myworkdayjobs.com",
    name: "GE HealthCare",
    apiTenant: "gehc",
    siteName: "GEHC_ExternalSite",
  },
  {
    host: "boeing.wd1.myworkdayjobs.com",
    name: "Boeing",
    apiTenant: "boeing",
    siteName: "EXTERNAL_CAREERS",
  },
  {
    host: "ngc.wd1.myworkdayjobs.com",
    name: "Northrop Grumman",
    apiTenant: "ngc",
    siteName: "Northrop_Grumman_External_Site",
  },
  {
    host: "globalhr.wd5.myworkdayjobs.com",
    name: "RTX",
    apiTenant: "globalhr",
    siteName: "REC_RTX_Ext_Gateway",
  },
];

export function answerForQuestion(tenant: WorkdayTenant, questionText: string): string {
  const q = questionText.toLowerCase();
  for (const rule of tenant.questionRules ?? []) {
    if (rule.pattern.test(q)) return rule.answer;
  }
  for (const rule of GENERIC_QUESTION_RULES) {
    if (rule.pattern.test(q)) return rule.answer;
  }
  return "";
}

export function findTenant(applyUrl: string): WorkdayTenant | null {
  let host: string;
  try {
    host = new URL(applyUrl).host.toLowerCase();
  } catch {
    return null;
  }
  return WORKDAY_TENANTS.find((t) => t.host === host) ?? null;
}
