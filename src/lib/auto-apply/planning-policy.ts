import type { SupportedAts } from "./ats";

export type ConfidenceBucket = "high" | "medium" | "low";
export type PlanningDecision = "auto_submit" | "review" | "skip";

export const AUTO_SUBMIT_THRESHOLD = 0.8;
export const REVIEW_THRESHOLD = 0.55;

export function normalizeMatchScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score > 1) {
    return Math.max(0, Math.min(1, score / 100));
  }
  return Math.max(0, Math.min(1, score));
}

export function bucketConfidence(score: number): ConfidenceBucket {
  if (score >= AUTO_SUBMIT_THRESHOLD) return "high";
  if (score >= REVIEW_THRESHOLD) return "medium";
  return "low";
}

export function derivePlanningDecision(input: {
  atsType: SupportedAts;
  confidenceScore: number;
  personalizedWritingRequired: boolean;
  unresolvedRequiredQuestions: string[];
}): { decision: PlanningDecision; reasons: string[] } {
  const reasons: string[] = [];
  if (input.atsType === "unsupported") {
    reasons.push("Unsupported ATS");
    return { decision: "skip", reasons };
  }

  if (input.confidenceScore < REVIEW_THRESHOLD) {
    reasons.push("Low-confidence match");
    return { decision: "skip", reasons };
  }

  if (input.personalizedWritingRequired) {
    reasons.push("Personalized writing required");
    return { decision: "review", reasons };
  }

  if (input.unresolvedRequiredQuestions.length > 0) {
    reasons.push("Required questions need review");
    return { decision: "review", reasons };
  }

  if (input.confidenceScore < AUTO_SUBMIT_THRESHOLD) {
    reasons.push("Moderate-confidence match");
    return { decision: "review", reasons };
  }

  reasons.push("High-confidence supported application");
  return { decision: "auto_submit", reasons };
}
