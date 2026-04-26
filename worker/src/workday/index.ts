/**
 * Workday auto-apply handler entry point.
 *
 * Workday gates the apply form behind a "Sign In or Create Account" screen,
 * then drives a 5-7 page wizard. The generic Claude agent loop fails on both
 * — it can't navigate the auth gate, and the wizard's per-page Save & Continue
 * pattern blows past the agent's step budget.
 *
 * This module short-circuits the agent loop: it detects the tenant, signs in
 * or creates an account using the user's `applicationEmail`, and drives the
 * wizard deterministically using stable `data-automation-id` selectors.
 *
 * Integration: called from `apply-engine.ts` when `detectATS()` returns
 * "Workday". Falls back to the generic agent loop only if the tenant isn't in
 * `WORKDAY_TENANTS` (i.e., we haven't smoke-validated it yet).
 */

import type { Page } from "playwright";
import type { ApplicantData, ApplyResult } from "../apply-engine.js";
import { findTenant, type WorkdayTenant } from "./tenants.js";
import { signupOrSignin } from "./auth.js";
import { runWorkdayWizard } from "./wizard.js";
import { markCredentialUsed } from "./credentials.js";

/**
 * Soft internal budget. Outer `applyToJob` enforces APPLICATION_TIMEOUT_MS
 * via Promise.race; we want to finish before that fires so the partial step
 * trace gets returned. Workday wizards typically take 5-8 min when they work;
 * 10 min gives us margin without dropping into outer-timeout territory.
 */
const WORKDAY_SOFT_BUDGET_MS = 10 * 60 * 1000;

export async function runWorkdayApply(
  page: Page,
  applicant: ApplicantData,
  applyUrl: string,
  userId: string,
  applicationEmail: string,
  resumePath: string,
  steps: string[],
): Promise<ApplyResult> {
  const tenant = findTenant(applyUrl);
  if (!tenant) {
    steps.push(`Workday tenant not in WORKDAY_TENANTS for ${applyUrl} — falling back to agent loop`);
    return { success: false, error: "workday-tenant-not-supported", steps };
  }
  steps.push(`Workday tenant: ${tenant.name} (${tenant.host})`);

  const startedAt = Date.now();
  const remainingMs = () => Math.max(0, WORKDAY_SOFT_BUDGET_MS - (Date.now() - startedAt));

  // Auth gate: signs in or creates an account, lands on the apply form.
  const authResult = await signupOrSignin({
    page,
    tenant,
    userId,
    applicationEmail,
    applicant,
    steps,
    deadlineMs: remainingMs,
  });
  if (!authResult.success) {
    return { success: false, error: authResult.error ?? "workday-auth-failed", steps };
  }

  const wizardResult = await runWorkdayWizard({
    page,
    tenant,
    applicant,
    resumePath,
    steps,
    deadlineMs: remainingMs,
  });
  if (wizardResult.success) {
    await markCredentialUsed(userId, tenant.host).catch(() => {});
  }
  return wizardResult;
}

export type { WorkdayTenant };
