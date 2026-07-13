"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWorkdayApply = runWorkdayApply;
const tenants_js_1 = require("./tenants.js");
const auth_js_1 = require("./auth.js");
const wizard_js_1 = require("./wizard.js");
const credentials_js_1 = require("./credentials.js");
/**
 * Soft internal budget. Outer `applyToJob` enforces APPLICATION_TIMEOUT_MS
 * via Promise.race; we want to finish before that fires so the partial step
 * trace gets returned. Workday wizards typically take 5-8 min when they work;
 * 10 min gives us margin without dropping into outer-timeout territory.
 */
const WORKDAY_SOFT_BUDGET_MS = 10 * 60 * 1000;
async function runWorkdayApply(page, applicant, applyUrl, userId, applicationEmail, resumePath, steps) {
    const tenant = (0, tenants_js_1.findTenant)(applyUrl);
    if (!tenant) {
        steps.push(`Workday tenant not in WORKDAY_TENANTS for ${applyUrl} — falling back to agent loop`);
        return { success: false, error: "workday-tenant-not-supported", steps };
    }
    steps.push(`Workday tenant: ${tenant.name} (${tenant.host})`);
    const startedAt = Date.now();
    const remainingMs = () => Math.max(0, WORKDAY_SOFT_BUDGET_MS - (Date.now() - startedAt));
    // Auth gate: signs in or creates an account, lands on the apply form.
    const authResult = await (0, auth_js_1.signupOrSignin)({
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
    const wizardResult = await (0, wizard_js_1.runWorkdayWizard)({
        page,
        tenant,
        applicant,
        resumePath,
        steps,
        deadlineMs: remainingMs,
    });
    if (wizardResult.success) {
        await (0, credentials_js_1.markCredentialUsed)(userId, tenant.host).catch(() => { });
    }
    return wizardResult;
}
