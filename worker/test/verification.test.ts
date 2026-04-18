import { describe, it, expect } from "vitest";
import { extractVerificationCode } from "../src/verification";

describe("extractVerificationCode — Greenhouse 8-char alphanumeric", () => {
  it("extracts code from <h1> tag", () => {
    const html = `<html><body><p>Your code is</p><h1>X7K2P9NM</h1></body></html>`;
    expect(extractVerificationCode("", html)).toBe("X7K2P9NM");
  });

  it("extracts code from <strong> tag", () => {
    const html = `<p>Code: <strong>ABCD1234</strong></p>`;
    expect(extractVerificationCode("", html)).toBe("ABCD1234");
  });
});

describe("extractVerificationCode — 6-digit numeric (Lever, Workday)", () => {
  it("extracts 6-digit code from <h1> tag", () => {
    const html = `<h1>483921</h1>`;
    expect(extractVerificationCode("", html)).toBe("483921");
  });

  it("extracts 6-digit code from <td> (table-based template)", () => {
    const html = `<table><tr><td>738291</td></tr></table>`;
    expect(extractVerificationCode("", html)).toBe("738291");
  });

  it("extracts 6-digit code from keyword sentence", () => {
    const text = `Your verification code: 654321\nEnter it on the page.`;
    expect(extractVerificationCode(text, "")).toBe("654321");
  });

  it("extracts 6-digit code from 'is your code' sentence", () => {
    const text = `847263 is your verification code. Do not share it.`;
    expect(extractVerificationCode(text, "")).toBe("847263");
  });

  it("extracts standalone 6-digit code with no keywords", () => {
    const text = `Hi Naya,\n\n293847\n\nThis is your one-time code.`;
    expect(extractVerificationCode(text, "")).toBe("293847");
  });
});

describe("extractVerificationCode — 8-char codes in custom tags", () => {
  it("extracts 8-char code from <td> tag", () => {
    const html = `<table><tr><td>K9M4P2Q8</td></tr></table>`;
    expect(extractVerificationCode("", html)).toBe("K9M4P2Q8");
  });

  it("extracts 8-char code from <span> tag", () => {
    const html = `<p>Code: <span>R3T7V5W2</span></p>`;
    expect(extractVerificationCode("", html)).toBe("R3T7V5W2");
  });
});

describe("extractVerificationCode — fallback safety", () => {
  it("returns null when no code present", () => {
    expect(extractVerificationCode("Hello, your application was received.", "")).toBeNull();
  });

  it("skips common 8-char English words in fallback", () => {
    const text = `Your password is required. The verification code is somewhere.`;
    expect(extractVerificationCode(text, "")).toBeNull();
  });

  it("does not pick the wrong 6-digit number when multiple are present", () => {
    // First 6-digit number wins for standalone path; keyword-anchored beats it.
    const text = `Order #123456 confirmed. Your verification code: 789012`;
    expect(extractVerificationCode(text, "")).toBe("789012");
  });
});
