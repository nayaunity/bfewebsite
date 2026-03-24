import type { GreenhouseQuestion, ApplicantProfile } from "./types";
import { STANDARD_FIELD_NAMES } from "./types";

interface QuestionPattern {
  pattern: RegExp;
  profileField: keyof ApplicantProfile;
  resolveValue: (
    userAnswer: string | boolean | null | undefined,
    values?: Array<{ label: string; value: number }>
  ) => number | string | null;
}

const QUESTION_PATTERNS: QuestionPattern[] = [
  {
    // "What U.S State do you currently reside in?"
    pattern: /state.*reside|reside.*state|u\.?s\.?\s*state/i,
    profileField: "usState",
    resolveValue: (answer, values) => {
      if (!answer || typeof answer !== "string") return null;
      if (!values?.length) return answer;
      // Match by state name
      const match = values.find(
        (v) => v.label.toLowerCase() === answer.toLowerCase()
      );
      return match?.value ?? null;
    },
  },
  {
    // "Are you currently authorized to work for X in the country..."
    pattern: /authorized to work/i,
    profileField: "workAuthorized",
    resolveValue: (answer, values) => {
      if (answer === null || answer === undefined) return null;
      const label = answer ? "Yes" : "No";
      if (!values?.length) return label;
      return values.find((v) => v.label === label)?.value ?? null;
    },
  },
  {
    // "Will you require our assistance with work authorization..."
    pattern: /require.*assistance.*authorization|assistance.*work.*auth|sponsorship/i,
    profileField: "needsSponsorship",
    resolveValue: (answer, values) => {
      if (answer === null || answer === undefined) return null;
      const label = answer ? "Yes" : "No";
      if (!values?.length) return label;
      return values.find((v) => v.label === label)?.value ?? null;
    },
  },
  {
    // "Please select your country of residence..."
    pattern: /country.*resid|select.*country|country of residence/i,
    profileField: "countryOfResidence",
    resolveValue: (answer, values) => {
      if (!answer || typeof answer !== "string") return null;
      if (!values?.length) return answer;

      const normalized = answer.toLowerCase().trim();

      // Common aliases: "United States" -> also try "USA", "US"
      const aliases: Record<string, string[]> = {
        "united states": ["usa", "us", "united states of america"],
        "united kingdom": ["uk", "great britain", "england"],
      };

      // Build a list of terms to try
      const terms = [normalized];
      for (const [key, alts] of Object.entries(aliases)) {
        if (normalized === key || alts.includes(normalized)) {
          terms.push(key, ...alts);
        }
      }

      for (const term of terms) {
        const match = values.find(
          (v) => v.label.toLowerCase() === term
        );
        if (match) return match.value;
      }

      // Partial match as last resort
      const partial = values.find(
        (v) =>
          v.label.toLowerCase().includes(normalized) ||
          normalized.includes(v.label.toLowerCase())
      );
      return partial?.value ?? null;
    },
  },
];

export interface MatchResult {
  /** Field name -> resolved value, ready to include in POST body */
  answeredFields: Record<string, number | string>;
  /** Labels of required questions we couldn't answer */
  unanswered: string[];
}

/**
 * Match a job's custom questions against the user's profile answers.
 * Returns fields to include in the submission and any unanswered required questions.
 */
export function matchQuestionAnswers(
  questions: GreenhouseQuestion[],
  profile: ApplicantProfile
): MatchResult {
  const answeredFields: Record<string, number | string> = {};
  const unanswered: string[] = [];

  for (const question of questions) {
    // Skip standard fields — those are handled separately
    const isStandard = question.fields.every((f) =>
      STANDARD_FIELD_NAMES.has(f.name)
    );
    if (isStandard) continue;

    // Skip optional questions
    if (!question.required) continue;

    // Try to match against known patterns
    let matched = false;
    for (const pattern of QUESTION_PATTERNS) {
      if (!pattern.pattern.test(question.label)) continue;

      const userAnswer = profile[pattern.profileField];
      const field = question.fields[0]; // Custom questions typically have one field
      if (!field) continue;

      const resolvedValue = pattern.resolveValue(
        userAnswer as string | boolean | null | undefined,
        field.values
      );

      if (resolvedValue !== null) {
        answeredFields[field.name] = resolvedValue;
        matched = true;
        break;
      }
    }

    if (!matched) {
      unanswered.push(question.label);
    }
  }

  return { answeredFields, unanswered };
}
