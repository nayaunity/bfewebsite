import {
  ApplicantProfile,
  GreenhouseJobDetail,
  SubmitResult,
  STANDARD_FIELD_NAMES,
} from "./types";

/**
 * Fetch a job's details including required questions from the Greenhouse API.
 */
export async function fetchJobDetail(
  boardToken: string,
  jobId: string
): Promise<GreenhouseJobDetail> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}?questions=true`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Greenhouse API returned ${response.status} for job ${jobId}`);
  }

  return response.json();
}

/**
 * Check if a job has required custom questions we can't automatically answer.
 * Returns the list of unsupported required field names.
 */
export function getUnsupportedRequiredFields(
  detail: GreenhouseJobDetail
): string[] {
  if (!detail.questions) return [];

  const unsupported: string[] = [];

  for (const question of detail.questions) {
    if (!question.required) continue;

    for (const field of question.fields) {
      if (!STANDARD_FIELD_NAMES.has(field.name)) {
        unsupported.push(question.label || field.name);
      }
    }
  }

  return unsupported;
}

/**
 * Submit an application to a Greenhouse job via the public API.
 */
export async function submitApplication(
  boardToken: string,
  jobId: string,
  applicant: ApplicantProfile
): Promise<SubmitResult> {
  try {
    // First, fetch the job to check for required custom questions
    const detail = await fetchJobDetail(boardToken, jobId);

    const unsupported = getUnsupportedRequiredFields(detail);
    if (unsupported.length > 0) {
      return {
        success: false,
        status: "skipped",
        error: `Required custom questions: ${unsupported.join(", ")}`,
      };
    }

    // Submit the application
    const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        first_name: applicant.firstName,
        last_name: applicant.lastName,
        email: applicant.email,
        phone: applicant.phone,
        resume_url: applicant.resumeUrl,
        resume_url_filename: applicant.resumeName || "resume.pdf",
      }),
    });

    if (response.ok) {
      return { success: true, status: "submitted" };
    }

    // Handle specific error codes
    if (response.status === 429) {
      return {
        success: false,
        status: "failed",
        error: "Rate limited by Greenhouse API",
      };
    }

    const errorText = await response.text().catch(() => "Unknown error");
    return {
      success: false,
      status: "failed",
      error: `HTTP ${response.status}: ${errorText.slice(0, 200)}`,
    };
  } catch (error) {
    return {
      success: false,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
