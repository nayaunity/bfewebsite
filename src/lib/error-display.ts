// Single source of truth for translating raw worker / apply-engine error
// strings into user-facing copy. Raw text must NEVER be shown to users —
// see feedback memory: "No user-facing error messages". Operators see the
// raw error in /admin/auto-apply, /admin/errors, and the DB columns.

export function friendlyError(error: string | null | undefined): string {
  if (!error) return "Couldn't complete this one — we'll retry";

  // Tagged statuses we set ourselves
  if (error.startsWith("[refunded")) return "We refunded this — service was down";
  if (/\[skipped — anti-bot/i.test(error)) return "Company blocked our submission, retrying later";
  if (/\[skipped — company on cooldown\]/i.test(error)) return "Skipped — recently blocked, will retry tomorrow";
  if (/\[skipped — Anthropic/i.test(error)) return "Briefly paused — service has resumed";

  // Anti-bot / verification family (broader matchers added)
  if (/anti.?bot|cloudflare|turnstile|captcha|recaptcha/i.test(error)) return "Company blocked our submission, retrying later";
  if (/flagged as spam|spam by the platform/i.test(error)) return "Company blocked our submission";

  // Service / capacity
  if (/credit balance is too low/i.test(error)) return "Briefly paused — service has resumed";

  // Form-shape failures
  if (/could not open dropdown|dropdown is non-functional|dropdown.*toggle/i.test(error)) return "Form dropdown wouldn't open";
  if (/Required field/i.test(error)) return "Form needs info we don't have yet — update your profile";
  if (/session timed out|application timed out|timed out|timeout/i.test(error)) return "Session ran long — we'll continue tomorrow";
  if (/Stuck/i.test(error)) return "Form didn't respond";
  if (/max steps/i.test(error)) return "Form too complex";
  if (/Cannot proceed/i.test(error)) return "Role conflicts with your preferences";
  if (/Login|authentication/i.test(error)) return "Login required";
  if (/resume/i.test(error)) return "Resume issue";
  if (/Verification/i.test(error)) return "Verification timed out";
  if (/iframe not found|not right/i.test(error)) return "Form not found";

  return "Couldn't complete this one — we'll retry";
}
