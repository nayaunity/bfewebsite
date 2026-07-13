import test from "node:test";
import assert from "node:assert/strict";

import { summarizeAutoApplyGraphMetrics } from "./graph-metrics.ts";

test("summarizeAutoApplyGraphMetrics computes review, submit, and ATS buckets", () => {
  const summary = summarizeAutoApplyGraphMetrics([
    {
      atsType: "greenhouse",
      status: "applied",
      graphStatus: "applied",
      planningDecision: "auto_submit",
    },
    {
      atsType: "lever",
      status: "failed",
      graphStatus: "failed",
      planningDecision: "auto_submit",
    },
    {
      atsType: "ashby",
      status: "found",
      graphStatus: "needs_review",
      planningDecision: "review",
      reviewTaskStatus: "pending",
    },
    {
      atsType: "unsupported",
      status: "applied",
      graphStatus: "applied",
      planningDecision: "auto_submit",
    },
    {
      atsType: "workday",
      status: "skipped",
      graphStatus: "skipped",
      planningDecision: "skip",
      reviewTaskStatus: "rejected",
    },
  ]);

  assert.equal(summary.totalPlanned, 5);
  assert.equal(summary.autoSubmitCount, 3);
  assert.equal(summary.reviewRoutedCount, 2);
  assert.equal(summary.skippedCount, 1);
  assert.equal(summary.pendingReviewCount, 1);
  assert.equal(summary.rejectedReviewCount, 1);
  assert.equal(summary.approvedReviewCount, 0);
  assert.equal(summary.supportedAttemptedCount, 2);
  assert.equal(summary.supportedAppliedCount, 1);
  assert.equal(summary.supportedFailedCount, 1);
  assert.equal(summary.supportedSuccessRate, 0.5);
  assert.equal(summary.unsupportedAutoSubmitCount, 1);

  const greenhouse = summary.atsBuckets.find((item) => item.atsType === "greenhouse");
  const ashby = summary.atsBuckets.find((item) => item.atsType === "ashby");
  assert.ok(greenhouse);
  assert.equal(greenhouse?.applied, 1);
  assert.ok(ashby);
  assert.equal(ashby?.needsReview, 1);
});

test("summarizeAutoApplyGraphMetrics handles empty input", () => {
  const summary = summarizeAutoApplyGraphMetrics([]);
  assert.equal(summary.totalPlanned, 0);
  assert.equal(summary.autoSubmitRate, null);
  assert.equal(summary.supportedSuccessRate, null);
  assert.deepEqual(summary.atsBuckets, []);
});
