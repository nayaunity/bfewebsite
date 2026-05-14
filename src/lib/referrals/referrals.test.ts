import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReferralPacket,
  cleanLinkedInConnectionHeadline,
  dedupeLinkedInConnections,
  getReferralAccessSummary,
  inferCompanyFromHeadline,
  normalizeLinkedInProfileUrl,
  resolveLinkedInConnectionCompany,
  scoreWarmMatch,
  slugifyCompanyName,
} from "./core.ts";
import {
  createLinkedInSyncToken,
  verifyLinkedInSyncToken,
} from "./token.ts";
import {
  parseLinkedInConnectionsCsv,
  csvRowToConnectionInput,
} from "./csv.ts";

test("slugifyCompanyName strips corporate suffixes and normalizes punctuation", () => {
  assert.equal(slugifyCompanyName("OpenAI, Inc."), "openai");
  assert.equal(slugifyCompanyName("The Walt Disney Company"), "walt-disney");
  assert.equal(slugifyCompanyName("Figma, LLC"), "figma");
});

test("headline cleanup strips full-name prefixes and LinkedIn connection metadata", () => {
  assert.equal(
    cleanLinkedInConnectionHeadline(
      "Kellyne StephensAssociate Software Engineer @NYT Wirecutter Connected on May 6, 2026",
      "Kellyne Stephens"
    ),
    "Associate Software Engineer @NYT Wirecutter"
  );
});

test("company inference supports both @Company and at Company patterns", () => {
  assert.equal(
    inferCompanyFromHeadline(
      "Associate Software Engineer @NYT Wirecutter",
      "Kellyne Stephens"
    ),
    "NYT Wirecutter"
  );
  assert.equal(
    inferCompanyFromHeadline(
      "Senior Recruiter at Figma",
      "Amara Okonkwo"
    ),
    "Figma"
  );
  assert.equal(
    resolveLinkedInConnectionCompany(
      null,
      "Associate Software Engineer @NYT Wirecutter Connected on May 6, 2026",
      "Kellyne Stephens"
    ),
    "NYT Wirecutter"
  );
});

test("dedupeLinkedInConnections canonicalizes LinkedIn profile URLs", () => {
  const deduped = dedupeLinkedInConnections([
    {
      fullName: "Ada Lovelace",
      profileUrl: "https://www.linkedin.com/in/ada-lovelace/?trk=123",
      headline: "Software Engineer at Stripe",
    },
    {
      fullName: "Ada Lovelace",
      profileUrl: "https://linkedin.com/in/ada-lovelace/",
      headline: "Software Engineer at Stripe",
    },
  ]);

  assert.equal(deduped.length, 1);
  assert.equal(
    normalizeLinkedInProfileUrl("https://www.linkedin.com/in/ada-lovelace/?trk=123"),
    "https://www.linkedin.com/in/ada-lovelace"
  );
});

test("scoreWarmMatch favors fresh role-aligned jobs", () => {
  const strong = scoreWarmMatch({
    jobTitle: "Senior Frontend Engineer",
    connectionHeadline: "Frontend Engineer at Figma",
    targetRoles: ["Frontend Engineer"],
    postedAt: new Date().toISOString(),
  });

  const weak = scoreWarmMatch({
    jobTitle: "Product Marketing Manager",
    connectionHeadline: "Sales Operations at Figma",
    targetRoles: ["Frontend Engineer"],
    postedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  });

  assert.ok(strong.score > weak.score);
  assert.match(strong.matchReason, /role match/i);
});

test("buildReferralPacket produces a usable outreach draft", () => {
  const packet = buildReferralPacket({
    userFirstName: "Naya",
    userLastName: "Bere",
    userCurrentTitle: "Frontend Engineer",
    userCurrentEmployer: "Example Corp",
    yearsOfExperience: "4",
    city: "Denver",
    targetRoles: ["Frontend Engineer"],
    linkedinUrl: "https://linkedin.com/in/naya",
    jobTitle: "Frontend Engineer",
    company: "Figma",
    applyUrl: "https://figma.com/jobs/123",
    connectionFirstName: "Amara",
    connectionFullName: "Amara Okonkwo",
    connectionHeadline: "Senior Engineer at Figma",
    resumeName: "frontend-resume.pdf",
  });

  assert.match(packet.subjectLine, /Figma/);
  assert.match(packet.subjectLine, /Frontend Engineer/);
  assert.equal(packet.whyMeBullets.length, 3);
  assert.match(packet.suggestedMessage, /Hi Amara/);
  assert.match(packet.suggestedMessage, /quick chat/i);
});

test("getReferralAccessSummary gates live requests during trial and enforces plan caps", () => {
  const trial = getReferralAccessSummary({
    tier: "starter",
    subscriptionStatus: "trialing",
    monthlyUsed: 0,
    concurrentUsed: 0,
  });
  assert.equal(trial.canPreview, true);
  assert.equal(trial.canSubmitLive, false);
  assert.match(trial.liveReason || "", /trial converts/i);

  const pro = getReferralAccessSummary({
    tier: "pro",
    subscriptionStatus: "active",
    monthlyUsed: 5,
    concurrentUsed: 1,
  });
  assert.equal(pro.canSubmitLive, false);
  assert.match(pro.liveReason || "", /used all referral requests/i);
});

test("LinkedIn sync tokens round-trip and reject tampering", () => {
  const { token } = createLinkedInSyncToken(
    { userId: "user_123", origin: "https://www.theblackfemaleengineer.com", ttlMs: 60_000 },
    "unit-test-secret"
  );
  const verified = verifyLinkedInSyncToken(token, "unit-test-secret");

  assert.equal(verified?.userId, "user_123");
  assert.equal(verified?.origin, "https://www.theblackfemaleengineer.com");

  const tampered = `${token.slice(0, -1)}x`;
  assert.equal(verifyLinkedInSyncToken(tampered, "unit-test-secret"), null);
});

test("parseLinkedInConnectionsCsv parses standard LinkedIn export format", () => {
  const csv = [
    "First Name,Last Name,Email Address,Company,Position,Connected On",
    'Jane,Doe,jane@example.com,Stripe,Software Engineer,"15 Mar 2024"',
    "John,Smith,john@example.com,Anthropic,Product Manager,01 Jan 2025",
    "Alice,Johnson,,Google,,10 Feb 2023",
  ].join("\n");

  const rows = parseLinkedInConnectionsCsv(csv);
  assert.equal(rows.length, 3);
  assert.equal(rows[0]!.firstName, "Jane");
  assert.equal(rows[0]!.lastName, "Doe");
  assert.equal(rows[0]!.emailAddress, "jane@example.com");
  assert.equal(rows[0]!.company, "Stripe");
  assert.equal(rows[0]!.position, "Software Engineer");
  assert.equal(rows[1]!.company, "Anthropic");
  assert.equal(rows[2]!.emailAddress, null);
  assert.equal(rows[2]!.position, null);
});

test("parseLinkedInConnectionsCsv handles BOM prefix", () => {
  const csv = "﻿First Name,Last Name,Email Address,Company,Position,Connected On\nBob,Lee,,Meta,SRE,";
  const rows = parseLinkedInConnectionsCsv(csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.firstName, "Bob");
  assert.equal(rows[0]!.company, "Meta");
});

test("parseLinkedInConnectionsCsv rejects empty names", () => {
  const csv = "First Name,Last Name,Email Address,Company,Position,Connected On\n,,,Google,,";
  const rows = parseLinkedInConnectionsCsv(csv);
  assert.equal(rows.length, 0);
});

test("csvRowToConnectionInput generates synthetic csv:// profile URL", () => {
  const input = csvRowToConnectionInput({
    firstName: "Jane",
    lastName: "Doe",
    emailAddress: "jane@example.com",
    company: "Stripe",
    position: "Software Engineer",
    connectedOn: "15 Mar 2024",
  });

  assert.ok(input);
  assert.equal(input.fullName, "Jane Doe");
  assert.equal(input.headline, "Software Engineer");
  assert.equal(input.currentCompany, "Stripe");
  assert.ok(input.profileUrl.startsWith("csv://"));
  assert.ok(input.profileUrl.includes("jane-doe"));
  assert.ok(input.profileUrl.includes("stripe"));
});

test("csvRowToConnectionInput returns null for empty name", () => {
  const input = csvRowToConnectionInput({
    firstName: "",
    lastName: "",
    emailAddress: null,
    company: "Google",
    position: null,
    connectedOn: null,
  });
  assert.equal(input, null);
});
