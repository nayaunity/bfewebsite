/**
 * Per-Workday-tenant configuration. Workday's API and apply UI are mostly
 * uniform across tenants, but each one has small variations: which optional
 * pages are included, custom application questions, exact siteName casing.
 *
 * Tenants here are the ones we've smoke-validated. Adding a tenant requires
 * a pass on the apply smoke (see worker/test/integration/smoke-companies.ts).
 */

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

export const WORKDAY_TENANTS: WorkdayTenant[] = [
  {
    host: "walmart.wd5.myworkdayjobs.com",
    name: "Walmart",
    apiTenant: "walmart",
    siteName: "WalmartExternal",
  },
  // Sprint 2 will add Salesforce + Adobe.
  // Sprint 3 will add Snowflake/ServiceNow/Cisco/Capital One/Intuit (after siteName discovery).
];

export function findTenant(applyUrl: string): WorkdayTenant | null {
  let host: string;
  try {
    host = new URL(applyUrl).host.toLowerCase();
  } catch {
    return null;
  }
  return WORKDAY_TENANTS.find((t) => t.host === host) ?? null;
}
