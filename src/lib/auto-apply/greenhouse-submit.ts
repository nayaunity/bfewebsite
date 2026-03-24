import {
  ApplicantProfile,
  GreenhouseJobDetail,
  SubmitResult,
} from "./types";
import { matchQuestionAnswers } from "./question-matcher";

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
 * Submit an application to a Greenhouse job via the public API.
 * Automatically fills common custom questions from the applicant's profile.
 */
export async function submitApplication(
  boardToken: string,
  jobId: string,
  applicant: ApplicantProfile
): Promise<SubmitResult> {
  try {
    // Fetch job detail with questions
    const detail = await fetchJobDetail(boardToken, jobId);

    // Match custom questions against user's profile answers
    const { answeredFields, unanswered } = matchQuestionAnswers(
      detail.questions || [],
      applicant
    );

    if (unanswered.length > 0) {
      return {
        success: false,
        status: "skipped",
        error: `Required custom questions: ${unanswered.join(", ")}`,
      };
    }

    // Build submission body: standard fields + matched custom answers
    const body: Record<string, unknown> = {
      first_name: applicant.firstName,
      last_name: applicant.lastName,
      email: applicant.email,
      phone: applicant.phone,
      resume_url: applicant.resumeUrl,
      resume_url_filename: applicant.resumeName || "resume.pdf",
      ...answeredFields,
    };

    // Submit the application
    // Greenhouse requires HTTP Basic auth for submissions on most boards
    const apiKey = process.env.GREENHOUSE_API_KEY;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Basic ${Buffer.from(apiKey + ":").toString("base64")}`;
    }

    const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}`;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return { success: true, status: "submitted" };
    }

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
