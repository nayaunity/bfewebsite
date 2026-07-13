import { describe, expect, it } from "vitest";

import {
  computePlannedSessionFinalStatus,
  mapPlannedDiscoveryRow,
} from "../src/planning-helpers";

describe("mapPlannedDiscoveryRow", () => {
  it("treats text payloads as custom writing text", () => {
    const result = mapPlannedDiscoveryRow({
      id: "disc_1",
      company: "Figma",
      jobTitle: "Frontend Engineer",
      applyUrl: "https://jobs.example.com/1",
      customWritingFinal: "Plain text cover letter",
      planPayload: JSON.stringify({ customWritingFormat: "text" }),
    });

    expect(result.customWritingText).toBe("Plain text cover letter");
    expect(result.reviewedAnswers).toBeUndefined();
  });

  it("treats json payloads as reviewed answers", () => {
    const json = JSON.stringify({ "Why this role?": "Because it fits." });
    const result = mapPlannedDiscoveryRow({
      id: "disc_2",
      company: "Anthropic",
      jobTitle: "Product Engineer",
      applyUrl: "https://jobs.example.com/2",
      customWritingFinal: json,
      planPayload: JSON.stringify({ customWritingFormat: "json" }),
    });

    expect(result.reviewedAnswers).toBe(json);
    expect(result.customWritingText).toBeUndefined();
  });

  it("falls back to json detection when plan payload is malformed", () => {
    const json = JSON.stringify({ prompt: "Answer" });
    const result = mapPlannedDiscoveryRow({
      id: "disc_3",
      company: "OpenAI",
      jobTitle: "Engineer",
      applyUrl: "https://jobs.example.com/3",
      customWritingFinal: json,
      planPayload: "{not-json",
    });

    expect(result.reviewedAnswers).toBe(json);
    expect(result.customWritingText).toBeUndefined();
  });
});

describe("computePlannedSessionFinalStatus", () => {
  it("stays queued when more ready jobs remain", () => {
    expect(
      computePlannedSessionFinalStatus({
        quotaBlocked: false,
        pendingReviewCount: 0,
        readyToSubmitCount: 2,
      })
    ).toBe("queued");
  });

  it("moves to awaiting review when nothing is ready but reviews remain", () => {
    expect(
      computePlannedSessionFinalStatus({
        quotaBlocked: false,
        pendingReviewCount: 1,
        readyToSubmitCount: 0,
      })
    ).toBe("awaiting_review");
  });

  it("completes when quota blocks further work and no review remains", () => {
    expect(
      computePlannedSessionFinalStatus({
        quotaBlocked: true,
        pendingReviewCount: 0,
        readyToSubmitCount: 3,
      })
    ).toBe("completed");
  });
});
