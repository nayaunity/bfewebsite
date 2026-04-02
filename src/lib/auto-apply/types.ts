export interface ApplicantProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  resumeName: string;
  preferredName?: string | null;
  pronouns?: string | null;
  usState?: string | null;
  workAuthorized?: boolean | null;
  needsSponsorship?: boolean | null;
  countryOfResidence?: string | null;
  willingToRelocate?: boolean | null;
  remotePreference?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  currentEmployer?: string | null;
  currentTitle?: string | null;
  school?: string | null;
  degree?: string | null;
  graduationYear?: string | null;
  additionalCerts?: string | null;
  city?: string | null;
  yearsOfExperience?: string | null;
  salaryExpectation?: string | null;
  earliestStartDate?: string | null;
  gender?: string | null;
  race?: string | null;
  hispanicOrLatino?: string | null;
  veteranStatus?: string | null;
  disabilityStatus?: string | null;
  applicationAnswers?: string | null;
}

export interface GreenhouseQuestion {
  required: boolean;
  label: string;
  fields: Array<{
    name: string;
    type: string;
    values?: Array<{ label: string; value: number }>;
  }>;
}

export interface GreenhouseJobDetail {
  id: number;
  title: string;
  questions?: GreenhouseQuestion[];
}

export interface SubmitResult {
  success: boolean;
  status: "submitted" | "skipped" | "failed";
  error?: string;
}

export interface BatchApplyResult {
  totalEligible: number;
  submitted: number;
  skipped: number;
  failed: number;
  results: Array<{
    jobId: string;
    jobTitle: string;
    company: string;
    status: "submitted" | "skipped" | "failed";
    error?: string;
  }>;
}

// Standard fields that Greenhouse always includes — we can fill these
export const STANDARD_FIELD_NAMES = new Set([
  "first_name",
  "last_name",
  "email",
  "phone",
  "resume",
  "resume_text",
  "cover_letter",
  "cover_letter_text",
]);
