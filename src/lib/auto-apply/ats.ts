import { fetchJobDetail } from "./greenhouse-submit.ts";
import type { ApplicantProfile, GreenhouseJobDetail } from "./types.ts";
import { matchQuestionAnswers } from "./question-matcher.ts";

export type SupportedAts = "greenhouse" | "lever" | "ashby" | "workday" | "unsupported";

export interface FormAnalysis {
  supportedAts: boolean;
  atsType: SupportedAts;
  coverLetterRequired: boolean;
  requiredFreeTextPrompts: string[];
  unresolvedRequiredQuestions: string[];
  reviewedAnswerHints: Record<string, string>;
  rawQuestionCount: number;
}

export function detectAtsType(applyUrl: string): SupportedAts {
  const url = applyUrl.toLowerCase();
  if (url.includes("greenhouse.io")) return "greenhouse";
  if (url.includes("lever.co")) return "lever";
  if (url.includes("ashbyhq.com")) return "ashby";
  if (url.includes("myworkdayjobs.com") || url.includes("workday.com")) return "workday";
  return "unsupported";
}

export function isSupportedAts(atsType: SupportedAts): boolean {
  return atsType !== "unsupported";
}

export function parseGreenhouseJob(applyUrl: string): { boardToken: string; jobId: string } | null {
  try {
    const url = new URL(applyUrl);
    const host = url.host.toLowerCase();
    if (!host.includes("greenhouse.io")) return null;

    const parts = url.pathname.split("/").filter(Boolean);
    const jobsIdx = parts.findIndex((part) => part === "jobs");
    if (jobsIdx < 1 || jobsIdx === parts.length - 1) return null;

    return {
      boardToken: parts[jobsIdx - 1],
      jobId: parts[jobsIdx + 1],
    };
  } catch {
    return null;
  }
}

function isTextLikeFieldType(type: string | undefined): boolean {
  if (!type) return false;
  const lower = type.toLowerCase();
  return lower.includes("textarea") || lower.includes("text");
}

function buildReviewedAnswerHint(
  label: string,
  detail: GreenhouseJobDetail
): string {
  return `Write a concise, specific response for the Greenhouse prompt "${label}" for the role "${detail.title}".`;
}

export async function analyzeAtsRequirements(
  applyUrl: string,
  applicant: ApplicantProfile
): Promise<FormAnalysis> {
  const atsType = detectAtsType(applyUrl);
  if (atsType !== "greenhouse") {
    return {
      supportedAts: isSupportedAts(atsType),
      atsType,
      coverLetterRequired: false,
      requiredFreeTextPrompts: [],
      unresolvedRequiredQuestions: [],
      reviewedAnswerHints: {},
      rawQuestionCount: 0,
    };
  }

  const parsed = parseGreenhouseJob(applyUrl);
  if (!parsed) {
    return {
      supportedAts: false,
      atsType: "unsupported",
      coverLetterRequired: false,
      requiredFreeTextPrompts: [],
      unresolvedRequiredQuestions: ["Unable to parse Greenhouse job metadata"],
      reviewedAnswerHints: {},
      rawQuestionCount: 0,
    };
  }

  try {
    const detail = await fetchJobDetail(parsed.boardToken, parsed.jobId);
    const questions = detail.questions || [];
    const { unanswered } = matchQuestionAnswers(questions, applicant);
    const unansweredSet = new Set(unanswered);
    const requiredFreeTextPrompts: string[] = [];
    const unresolvedRequiredQuestions: string[] = [];
    const reviewedAnswerHints: Record<string, string> = {};
    let coverLetterRequired = false;

    for (const question of questions) {
      const fields = question.fields || [];
      const hasCoverLetterField = fields.some((field) =>
        /cover_letter/i.test(field.name || "")
      );
      if (question.required && hasCoverLetterField) {
        coverLetterRequired = true;
      }

      if (!question.required || !unansweredSet.has(question.label)) {
        continue;
      }

      const isFreeTextPrompt = fields.some((field) => isTextLikeFieldType(field.type));
      if (isFreeTextPrompt || hasCoverLetterField) {
        requiredFreeTextPrompts.push(question.label);
        reviewedAnswerHints[question.label] = buildReviewedAnswerHint(question.label, detail);
      } else {
        unresolvedRequiredQuestions.push(question.label);
      }
    }

    return {
      supportedAts: true,
      atsType,
      coverLetterRequired,
      requiredFreeTextPrompts,
      unresolvedRequiredQuestions,
      reviewedAnswerHints,
      rawQuestionCount: questions.length,
    };
  } catch {
    return {
      supportedAts: true,
      atsType,
      coverLetterRequired: false,
      requiredFreeTextPrompts: [],
      unresolvedRequiredQuestions: [],
      reviewedAnswerHints: {},
      rawQuestionCount: 0,
    };
  }
}
