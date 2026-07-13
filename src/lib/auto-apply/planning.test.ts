import test from "node:test";
import assert from "node:assert/strict";

import {
  bucketConfidence,
  derivePlanningDecision,
  normalizeMatchScore,
} from "./planning-policy.ts";
import { detectAtsType, parseGreenhouseJob } from "./ats.ts";

test("normalizeMatchScore clamps fractional scores", () => {
  assert.equal(normalizeMatchScore(0.84), 0.84);
  assert.equal(normalizeMatchScore(-1), 0);
  assert.equal(normalizeMatchScore(2), 0.02);
  assert.equal(normalizeMatchScore(100), 1);
});

test("bucketConfidence follows the review and auto-submit thresholds", () => {
  assert.equal(bucketConfidence(0.9), "high");
  assert.equal(bucketConfidence(0.7), "medium");
  assert.equal(bucketConfidence(0.3), "low");
});

test("derivePlanningDecision auto-submits only high-confidence supported jobs", () => {
  const result = derivePlanningDecision({
    atsType: "greenhouse",
    confidenceScore: 0.91,
    personalizedWritingRequired: false,
    unresolvedRequiredQuestions: [],
  });

  assert.equal(result.decision, "auto_submit");
  assert.match(result.reasons.join(" "), /High-confidence/);
});

test("derivePlanningDecision routes personalized writing to review", () => {
  const result = derivePlanningDecision({
    atsType: "lever",
    confidenceScore: 0.88,
    personalizedWritingRequired: true,
    unresolvedRequiredQuestions: [],
  });

  assert.equal(result.decision, "review");
  assert.match(result.reasons.join(" "), /Personalized writing/);
});

test("derivePlanningDecision routes unresolved required questions to review", () => {
  const result = derivePlanningDecision({
    atsType: "ashby",
    confidenceScore: 0.81,
    personalizedWritingRequired: false,
    unresolvedRequiredQuestions: ["Why this role?"],
  });

  assert.equal(result.decision, "review");
});

test("derivePlanningDecision skips unsupported or low-confidence jobs", () => {
  assert.equal(
    derivePlanningDecision({
      atsType: "unsupported",
      confidenceScore: 0.95,
      personalizedWritingRequired: false,
      unresolvedRequiredQuestions: [],
    }).decision,
    "skip"
  );

  assert.equal(
    derivePlanningDecision({
      atsType: "workday",
      confidenceScore: 0.42,
      personalizedWritingRequired: false,
      unresolvedRequiredQuestions: [],
    }).decision,
    "skip"
  );
});

test("detectAtsType recognizes supported ATS families", () => {
  assert.equal(detectAtsType("https://boards.greenhouse.io/acme/jobs/123"), "greenhouse");
  assert.equal(detectAtsType("https://jobs.lever.co/acme/123"), "lever");
  assert.equal(detectAtsType("https://jobs.ashbyhq.com/acme/123"), "ashby");
  assert.equal(detectAtsType("https://acme.wd5.myworkdayjobs.com/job/123"), "workday");
  assert.equal(detectAtsType("https://careers.example.com/jobs/123"), "unsupported");
});

test("parseGreenhouseJob extracts board token and job id", () => {
  assert.deepEqual(
    parseGreenhouseJob("https://boards.greenhouse.io/figma/jobs/1234567"),
    { boardToken: "figma", jobId: "1234567" }
  );
  assert.deepEqual(
    parseGreenhouseJob("https://job-boards.greenhouse.io/databricks/jobs/7654321"),
    { boardToken: "databricks", jobId: "7654321" }
  );
  assert.equal(parseGreenhouseJob("https://example.com/jobs/1"), null);
});
