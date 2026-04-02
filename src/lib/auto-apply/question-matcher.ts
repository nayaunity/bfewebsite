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

// Helper for string answer matching against dropdown values
function matchStringToValue(
  answer: string | boolean | null | undefined,
  values?: Array<{ label: string; value: number }>
): number | string | null {
  if (!answer || typeof answer !== "string") return null;
  if (!values?.length) return answer;
  const norm = answer.toLowerCase().trim();
  const exact = values.find((v) => v.label.toLowerCase() === norm);
  if (exact) return exact.value;
  const partial = values.find(
    (v) => v.label.toLowerCase().includes(norm) || norm.includes(v.label.toLowerCase())
  );
  return partial?.value ?? null;
}

// Helper for yes/no boolean matching
function matchBoolToValue(
  answer: boolean | null | undefined,
  values?: Array<{ label: string; value: number }>
): number | string | null {
  if (answer === null || answer === undefined) return null;
  const label = answer ? "Yes" : "No";
  if (!values?.length) return label;
  return values.find((v) => v.label === label)?.value ?? null;
}

const QUESTION_PATTERNS: QuestionPattern[] = [
  // --- Location & Work Authorization ---
  {
    pattern: /state.*reside|reside.*state|u\.?s\.?\s*state/i,
    profileField: "usState",
    resolveValue: (answer, values) => matchStringToValue(answer, values),
  },
  {
    pattern: /authorized to work/i,
    profileField: "workAuthorized",
    resolveValue: (answer, values) => matchBoolToValue(answer as boolean | null | undefined, values),
  },
  {
    pattern: /require.*assistance.*authorization|assistance.*work.*auth|sponsorship/i,
    profileField: "needsSponsorship",
    resolveValue: (answer, values) => matchBoolToValue(answer as boolean | null | undefined, values),
  },
  {
    pattern: /country.*resid|select.*country|country of residence/i,
    profileField: "countryOfResidence",
    resolveValue: (answer, values) => {
      if (!answer || typeof answer !== "string") return null;
      if (!values?.length) return answer;
      const normalized = answer.toLowerCase().trim();
      const aliases: Record<string, string[]> = {
        "united states": ["usa", "us", "united states of america"],
        "united kingdom": ["uk", "great britain", "england"],
      };
      const terms = [normalized];
      for (const [key, alts] of Object.entries(aliases)) {
        if (normalized === key || alts.includes(normalized)) {
          terms.push(key, ...alts);
        }
      }
      for (const term of terms) {
        const match = values.find((v) => v.label.toLowerCase() === term);
        if (match) return match.value;
      }
      const partial = values.find(
        (v) => v.label.toLowerCase().includes(normalized) || normalized.includes(v.label.toLowerCase())
      );
      return partial?.value ?? null;
    },
  },
  {
    pattern: /willing.*relocat|open.*relocat|relocat/i,
    profileField: "willingToRelocate",
    resolveValue: (answer, values) => matchBoolToValue(answer as boolean | null | undefined, values),
  },
  {
    pattern: /remote.*work|work.*remote|remote.*hybrid|on.?site/i,
    profileField: "remotePreference",
    resolveValue: (answer, values) => matchStringToValue(answer, values),
  },

  // --- Online Presence ---
  {
    pattern: /linkedin/i,
    profileField: "linkedinUrl",
    resolveValue: (answer) => (typeof answer === "string" && answer ? answer : null),
  },
  {
    pattern: /github/i,
    profileField: "githubUrl",
    resolveValue: (answer) => (typeof answer === "string" && answer ? answer : null),
  },
  {
    pattern: /website|portfolio|personal.*url/i,
    profileField: "websiteUrl",
    resolveValue: (answer) => (typeof answer === "string" && answer ? answer : null),
  },

  // --- Professional ---
  {
    pattern: /salary|compensation|pay.*expect/i,
    profileField: "salaryExpectation",
    resolveValue: (answer) => (typeof answer === "string" && answer ? answer : null),
  },
  {
    pattern: /start.*date|earliest.*start|when.*start|available.*start/i,
    profileField: "earliestStartDate",
    resolveValue: (answer, values) => matchStringToValue(answer, values),
  },
  {
    pattern: /pronoun/i,
    profileField: "pronouns",
    resolveValue: (answer, values) => matchStringToValue(answer, values),
  },

  // --- Demographics / EEO ---
  {
    pattern: /\bgender\b/i,
    profileField: "gender",
    resolveValue: (answer, values) => matchStringToValue(answer, values),
  },
  {
    pattern: /\brace\b|ethnicity/i,
    profileField: "race",
    resolveValue: (answer, values) => matchStringToValue(answer, values),
  },
  {
    pattern: /hispanic|latino/i,
    profileField: "hispanicOrLatino",
    resolveValue: (answer, values) => matchStringToValue(answer, values),
  },
  {
    pattern: /veteran/i,
    profileField: "veteranStatus",
    resolveValue: (answer, values) => matchStringToValue(answer, values),
  },
  {
    pattern: /disabilit/i,
    profileField: "disabilityStatus",
    resolveValue: (answer, values) => matchStringToValue(answer, values),
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
