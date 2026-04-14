"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

interface Application {
  id: string;
  company: string;
  jobTitle: string;
  applyUrl: string | null;
  status: string;
  errorMessage: string | null;
  submittedAt: Date | string | null;
  createdAt: Date | string;
  source: "browse" | "api";
  targetRole: string | null;
  resumeTailored?: boolean;
  tailoredResumeUrl?: string | null;
  originalResumeUrl?: string | null;
  matchScore?: number | null;
  matchReason?: string | null;
}

function friendlyError(error: string): string {
  // Tagged statuses we set ourselves
  if (error.startsWith("[refunded")) return "We refunded this — service was down";
  if (/\[skipped — anti-bot/i.test(error)) return "Company blocked our submission, retrying later";
  if (/\[skipped — company on cooldown\]/i.test(error)) return "Skipped — recently blocked, will retry tomorrow";
  if (/\[skipped — Anthropic/i.test(error)) return "Briefly paused — service has resumed";
  // Common form-failure categories
  if (/credit balance is too low/i.test(error)) return "Briefly paused — service has resumed";
  if (/flagged as spam|spam by the platform/i.test(error)) return "Company blocked our submission";
  if (/could not open dropdown/i.test(error)) return "Form dropdown wouldn't open";
  if (/timed out|timeout/i.test(error)) return "Form took too long to load";
  if (/Stuck/i.test(error)) return "Form didn't respond";
  if (/max steps/i.test(error)) return "Form too complex";
  if (/Cannot proceed/i.test(error)) return "Role conflicts with your preferences";
  if (/Login|authentication/i.test(error)) return "Login required";
  if (/resume/i.test(error)) return "Resume issue";
  if (/Verification/i.test(error)) return "Verification timed out";
  if (/iframe not found|not right/i.test(error)) return "Form not found";
  return "Couldn't complete";
}

function formatTime(dateStr: Date | string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver",
  });
}

interface Stats {
  total: number;
  applied: number;
  failed: number;
  uniqueCompanies: number;
}

interface TodayActivity {
  status: string;
  jobsFound: number;
  jobsApplied: number;
  jobsFailed: number;
  discoveries: Array<{
    id: string;
    company: string;
    jobTitle: string;
    status: string;
    createdAt: string;
  }>;
}

export default function ApplicationsDashboard({
  initialApplications,
  stats,
  usage,
  totalActiveJobs,
  appliedCompanies,
  todayActivity,
  profileReady = false,
  missingRoles = false,
  missingResume = false,
  showResumeQuiz = false,
}: {
  initialApplications: Application[];
  stats: Stats;
  usage?: { used: number; limit: number; tier: string } | null;
  totalActiveJobs?: number;
  appliedCompanies?: string[];
  todayActivity?: TodayActivity | null;
  profileReady?: boolean;
  missingRoles?: boolean;
  missingResume?: boolean;
  showResumeQuiz?: boolean;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [starting, setStarting] = useState(false);
  const [startResult, setStartResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const hasActiveSession = todayActivity?.status === "queued" || todayActivity?.status === "processing";
  const atLimit = usage ? usage.used >= usage.limit : false;
  const [checkingOut, setCheckingOut] = useState(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const [dismissedTailorRows, setDismissedTailorRows] = useState<Set<string>>(new Set());

  const handleCheckout = useCallback(async (tier: "starter" | "pro") => {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {}
    setCheckingOut(false);
  }, []);

  const tips = [
    "Each application uses the resume that best matches the role — that\u2019s why uploading role-specific resumes matters.",
    "We scan 5,000+ open roles daily and only apply to the ones that match your profile, location, and target roles.",
    "Applications go out at 3am MT each day. You can also click \u201cStart Applying Now\u201d anytime.",
    "The more target roles and resumes you add, the more jobs we can match you to.",
    "The average job search takes 3\u20136 months. Auto-apply keeps your pipeline full while you focus on prep.",
    "Most roles receive 250+ applications. Applying early increases your chances of being reviewed.",
    "Referred candidates are 4x more likely to be hired — but volume still matters for roles where you don\u2019t have a referral.",
    "Companies often re-open roles after the first hire doesn\u2019t work out. Consistent applying catches these second chances.",
  ];
  const [tipIndex, setTipIndex] = useState(0);
  const [tipFade, setTipFade] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setTipFade(false);
      setTimeout(() => {
        setTipIndex((i) => (i + 1) % tips.length);
        setTipFade(true);
      }, 300);
    }, 8000);
    return () => clearInterval(interval);
  }, [tips.length]);

  const handleStartApplying = useCallback(async () => {
    setStarting(true);
    setStartResult(null);
    try {
      const res = await fetch("/api/auto-apply/start", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStartResult({ success: true, message: data.message });
        // Reload after a moment so the Today's Activity section picks up the new session
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setStartResult({ error: data.error || "Something went wrong" });
      }
    } catch {
      setStartResult({ error: "Network error. Please try again." });
    } finally {
      setStarting(false);
    }
  }, []);

  // Hide failed applications from users
  const visibleApplications = initialApplications.filter((a) => a.status !== "failed");

  const filtered = visibleApplications.filter((a) => {
    if (filter !== "all") {
      if (filter === "submitted") {
        if (a.status !== "submitted" && a.status !== "applied") return false;
      } else if (a.status !== filter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!a.company.toLowerCase().includes(q) && !a.jobTitle.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filterCounts = {
    all: visibleApplications.length,
    submitted: visibleApplications.filter((a) => a.status === "submitted" || a.status === "applied").length,
    skipped: visibleApplications.filter((a) => a.status === "skipped").length,
  };

  const handleCardClick = (newFilter: string) => {
    setFilter(newFilter);
    document.getElementById("application-table")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      {/* Resume Quiz CTA — only shown to specific users */}
      {showResumeQuiz && (
        <Link
          href="/profile/resume-quiz"
          className="group flex items-center justify-between w-full mb-6 px-5 py-4 bg-gradient-to-r from-[#ffe500] to-[#f0d000] text-black rounded-2xl hover:opacity-95 transition-all hover:shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-black/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-base font-serif font-bold">Boost Your Resume</span>
              <p className="text-sm text-black/70 mt-0.5">Answer 10 quick questions and we&apos;ll optimize your resume for PM roles</p>
            </div>
          </div>
          <svg className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => handleCardClick("all")}
          className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all hover:scale-[1.02] cursor-pointer ${
            filter === "all"
              ? "bg-gradient-to-br from-[#ef562a] to-[#d44a22] text-white ring-2 ring-[#ef562a] ring-offset-2 ring-offset-[var(--background)]"
              : "bg-gradient-to-br from-[#ef562a] to-[#d44a22] text-white"
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Total</span>
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-xs text-white/70 mt-1">Across {stats.uniqueCompanies} companies</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        </button>

        <button
          onClick={() => handleCardClick("submitted")}
          className={`rounded-2xl p-5 text-left transition-all hover:scale-[1.02] cursor-pointer border ${
            filter === "submitted"
              ? "bg-green-50 border-green-300 ring-2 ring-green-400 ring-offset-2 ring-offset-[var(--background)]"
              : "bg-[var(--card-bg)] border-[var(--card-border)]"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider">Applied</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.applied}</p>
          <p className="text-xs text-[var(--gray-600)] mt-1">Successfully submitted</p>
        </button>

      </div>

      {/* Rotating Tip */}
      <div className="mb-8 flex items-start gap-3 px-5 py-4 rounded-2xl bg-[var(--accent-blue-bg)] border border-[var(--card-border)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--card-bg)] flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider mb-1">Did you know?</p>
          <p
            className="text-sm text-[var(--foreground)]"
            style={{
              opacity: tipFade ? 1 : 0,
              transform: tipFade ? "translateY(0)" : "translateY(-8px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            {tips[tipIndex]}
          </p>
        </div>
      </div>

      {/* Today's Auto-Apply Activity */}
      {todayActivity && (
        <div className="mb-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                todayActivity.status === "processing" || todayActivity.status === "queued"
                  ? "bg-blue-500 animate-pulse"
                  : todayActivity.status === "completed"
                    ? "bg-green-500"
                    : "bg-red-500"
              }`} />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Today&apos;s Auto-Apply
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--gray-600)]">
              <span>{todayActivity.jobsFound} found</span>
              <span className="text-green-600 font-medium">{todayActivity.jobsApplied} applied</span>
            </div>
          </div>

          {todayActivity.discoveries.filter((d) => d.status !== "failed").length > 0 ? (
            <div className="divide-y divide-[var(--card-border)] max-h-64 overflow-y-auto">
              {todayActivity.discoveries.filter((d) => d.status !== "failed").map((d) => (
                <div key={d.id} className="px-5 py-2.5 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--foreground)] truncate">{d.jobTitle}</p>
                    <p className="text-xs text-[var(--gray-600)]">{d.company}</p>
                  </div>
                  <span className={`ml-3 shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${
                    d.status === "applied"
                      ? "bg-green-100 text-green-700"
                      : d.status === "applying"
                        ? "bg-blue-50 text-blue-600"
                        : d.status === "failed"
                          ? "bg-red-50 text-red-600"
                          : "bg-[var(--gray-100)] text-[var(--gray-600)]"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      d.status === "applied"
                        ? "bg-green-500"
                        : d.status === "applying"
                          ? "bg-blue-500 animate-pulse"
                          : d.status === "failed"
                            ? "bg-red-500"
                            : "bg-[var(--gray-600)]"
                    }`} />
                    {d.status === "applied" ? "Applied" :
                     d.status === "applying" ? "Applying..." :
                     d.status === "failed" ? "Failed" : d.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-6 text-center text-sm text-[var(--gray-600)]">
              {todayActivity.status === "queued"
                ? "Your jobs are queued and will be processed shortly..."
                : todayActivity.status === "processing"
                  ? "Scanning for matching jobs..."
                  : "No matching jobs found today. We'll check again tomorrow."}
            </div>
          )}
        </div>
      )}

      {/* Celebration Banner — shown after first success, before hitting limit */}
      {usage && usage.tier === "free" && stats.applied >= 1 && !atLimit && !celebrationDismissed && (
        <div className="mb-8 relative bg-gradient-to-r from-[#ef562a]/5 to-[#ef562a]/10 border border-[#ef562a]/20 rounded-2xl p-5">
          <button
            onClick={() => setCelebrationDismissed(true)}
            className="absolute top-3 right-3 text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h3 className="font-serif text-lg text-[var(--foreground)] mb-1">
            Your first applications are out there
          </h3>
          <p className="text-sm text-[var(--gray-600)] mb-1">
            {stats.applied} application{stats.applied !== 1 ? "s" : ""} submitted
            {appliedCompanies && appliedCompanies.length > 0 && (
              <> to {appliedCompanies.slice(0, 3).join(", ")}{appliedCompanies.length > 3 ? ` and ${appliedCompanies.length - 3} more` : ""}</>
            )}.
          </p>
          {totalActiveJobs && totalActiveJobs > 0 && (
            <p className="text-sm font-medium text-[#ef562a] mb-3">
              {totalActiveJobs.toLocaleString()}+ more matching jobs are waiting. Starter members apply to 100/month.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleCheckout("starter")}
              disabled={checkingOut}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#ef562a] rounded-lg hover:bg-[#d44a22] transition-colors disabled:opacity-50"
            >
              Unlock 100 Apps/Mo — $29
            </button>
            <Link href="/pricing" className="text-xs text-[var(--gray-600)] hover:text-[var(--foreground)] hover:underline">
              See all plans
            </Link>
          </div>
        </div>
      )}

      {/* Auto-Apply Status */}
      <div className="mb-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#ef562a]/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Apply While You Sleep</h2>
            <p className="text-sm text-[var(--gray-600)] mt-1">
              Every morning at 3am MT, we scan 5,800+ jobs across tech companies and automatically apply to the ones that best match your profile, role preferences, and location.
            </p>
            {usage && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-[var(--gray-600)] mb-1.5">
                  <span>Monthly applications</span>
                  <span className="font-medium">{usage.used} / {usage.limit}</span>
                </div>
                <div className="w-full h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ef562a] rounded-full transition-all"
                    style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                  />
                </div>
                {!atLimit && !hasActiveSession && (
                  <div className="mt-4">
                    {profileReady ? (
                      <>
                        <button
                          onClick={handleStartApplying}
                          disabled={starting}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#ef562a] rounded-lg hover:bg-[#d44a22] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {starting ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Finding matching jobs...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Start Applying Now
                            </>
                          )}
                        </button>
                        {startResult?.success && (
                          <p className="mt-2 text-sm text-green-600">{startResult.message}</p>
                        )}
                        {startResult?.error && (
                          <p className="mt-2 text-sm text-red-500">{startResult.error}</p>
                        )}
                      </>
                    ) : (
                      <div className="p-3 rounded-xl bg-[var(--gray-50)] border border-[var(--card-border)]">
                        <p className="text-sm text-[var(--foreground)] font-medium mb-1">Almost there! Complete these to start applying:</p>
                        <ul className="text-xs text-[var(--gray-600)] mb-3 space-y-1.5 ml-1">
                          {missingRoles && (
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ef562a]" />
                              <Link href="/profile" className="hover:text-[#ef562a] hover:underline">Set your target roles</Link>
                            </li>
                          )}
                          {missingResume && (
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ef562a]" />
                              <Link href="/auto-apply/next-steps" className="hover:text-[#ef562a] hover:underline">Upload a resume</Link>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {usage.used >= usage.limit && usage.tier === "free" && (
                  <div className="mt-6 p-5 rounded-2xl bg-[var(--card-bg)] border-2 border-[#ef562a]/30">
                    <h3 className="font-serif text-lg text-[var(--foreground)] mb-2">
                      You&apos;ve used all {usage.limit} free applications this month
                    </h3>

                    {stats.applied > 0 && (
                      <p className="text-sm text-[var(--gray-600)] mb-1">
                        Your results so far: {stats.applied} application{stats.applied !== 1 ? "s" : ""} submitted
                        {appliedCompanies && appliedCompanies.length > 0 && (
                          <> to {appliedCompanies.slice(0, 3).join(", ")}{appliedCompanies.length > 3 ? ` and ${appliedCompanies.length - 3} more` : ""}</>
                        )}
                      </p>
                    )}

                    {totalActiveJobs && totalActiveJobs > 0 && (
                      <p className="text-sm font-medium text-[#ef562a] mb-4">
                        {totalActiveJobs.toLocaleString()}+ matching jobs are waiting for you.
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="p-4 rounded-xl bg-[var(--gray-50)] border border-[var(--card-border)]">
                        <p className="text-sm font-medium text-[var(--foreground)]">Starter</p>
                        <p className="text-2xl font-bold text-[var(--foreground)] mt-1">$29<span className="text-sm font-normal text-[var(--gray-600)]">/mo</span></p>
                        <ul className="mt-2 space-y-1 text-xs text-[var(--gray-600)]">
                          <li>100 applications/month</li>
                          <li>Tailored resumes for every role</li>
                        </ul>
                        <button
                          onClick={() => handleCheckout("starter")}
                          disabled={checkingOut}
                          className="mt-3 w-full py-2 text-sm font-medium text-white bg-[#ef562a] rounded-lg hover:bg-[#d44a22] transition-colors disabled:opacity-50"
                        >
                          {checkingOut ? "Loading..." : "Start Starter"}
                        </button>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--gray-50)] border border-[var(--card-border)]">
                        <p className="text-sm font-medium text-[var(--foreground)]">Pro</p>
                        <p className="text-2xl font-bold text-[var(--foreground)] mt-1">$59<span className="text-sm font-normal text-[var(--gray-600)]">/mo</span></p>
                        <ul className="mt-2 space-y-1 text-xs text-[var(--gray-600)]">
                          <li>300 applications/month</li>
                          <li>Everything in Starter</li>
                          <li>Priority application processing</li>
                        </ul>
                        <button
                          onClick={() => handleCheckout("pro")}
                          disabled={checkingOut}
                          className="mt-3 w-full py-2 text-sm font-medium text-white bg-[var(--foreground)] rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
                        >
                          {checkingOut ? "Loading..." : "Start Pro"}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-center text-[var(--gray-600)]">
                      Continue with Free — your limit resets next month
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Status Table */}
      <div id="application-table" className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden scroll-mt-4">
        {/* Table Header */}
        <div className="px-5 py-4 border-b border-[var(--card-border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Application Status</h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--gray-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 w-44"
              />
            </div>
            {/* Filter */}
            <div className="flex gap-1">
              {(["all", "submitted", "skipped"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filter === s
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                  }`}
                >
                  {s === "submitted" ? "Applied" : s.charAt(0).toUpperCase() + s.slice(1)}
                  <span className="ml-1 opacity-60">{filterCounts[s]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[var(--gray-600)]">
              {initialApplications.length === 0
                ? "No applications yet. We\u2019ll start applying to matching jobs for you every morning at 3am MT."
                : "No applications match your filter."}
            </p>
          </div>
        ) : (
          <>
            {/* Column headers (desktop) */}
            <div className="hidden md:grid grid-cols-[1fr_140px_100px_120px] gap-4 px-5 py-2 bg-[var(--gray-50)] text-[10px] font-semibold text-[var(--gray-600)] uppercase tracking-wider">
              <span>Company & Position</span>
              <span>Status</span>
              <span>Applied On</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-[var(--card-border)]">
              {filtered.map((app) => (
                <div
                  key={app.id}
                  className="px-5 py-3 md:grid md:grid-cols-[1fr_140px_100px_120px] md:gap-4 md:items-center hover:bg-[var(--gray-50)] transition-colors"
                >
                  {/* Company & Position */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {app.jobTitle}
                    </p>
                    <p className="text-xs text-[var(--gray-600)] mt-0.5">{app.company}</p>
                    {app.matchReason && (
                      <p className="text-[10px] text-[var(--gray-600)] mt-0.5">{app.matchReason}</p>
                    )}
                    {app.errorMessage && (app.status === "failed" || app.status === "skipped") && (
                      <p
                        className={`text-[10px] mt-0.5 ${app.status === "skipped" ? "text-[var(--gray-600)]" : "text-red-500"}`}
                        title={app.errorMessage}
                      >
                        {friendlyError(app.errorMessage)}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="mt-2 md:mt-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                        app.status === "submitted" || app.status === "applied"
                          ? "bg-green-100 text-green-700"
                          : app.status === "failed"
                            ? "bg-red-50 text-red-600"
                            : app.status === "skipped"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        app.status === "submitted" || app.status === "applied"
                          ? "bg-green-500"
                          : app.status === "failed"
                            ? "bg-red-500"
                            : app.status === "skipped"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                      }`} />
                      {app.status === "submitted" || app.status === "applied" ? "Applied" :
                       app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="mt-1 md:mt-0">
                    <span className="text-xs text-[var(--gray-600)]">
                      {formatTime(app.createdAt)}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="mt-2 md:mt-0 md:text-right">
                    {app.applyUrl && (
                      <a
                        href={app.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#ef562a] hover:underline"
                      >
                        View Job
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>

                  {/* Resume comparison row — spans full width */}
                  {app.resumeTailored && app.tailoredResumeUrl ? (
                    <div className="md:col-span-4 mt-2 md:mt-0 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <div className="flex items-center gap-2 text-xs text-purple-800 font-medium">
                        <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Resume customized for this role
                      </div>
                      <div className="flex items-center gap-3">
                        {app.originalResumeUrl && (
                          <a
                            href={app.originalResumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md border border-[var(--gray-200)] bg-[var(--card-bg)] text-[var(--gray-800)] hover:bg-[var(--gray-50)] transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Original Resume
                          </a>
                        )}
                        <a
                          href={app.tailoredResumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Tailored Resume
                        </a>
                      </div>
                    </div>
                  ) : (
                    !app.resumeTailored && (app.status === "submitted" || app.status === "applied") && usage?.tier === "free" && !dismissedTailorRows.has(app.id) && (
                      <div className="md:col-span-4 mt-2 md:mt-0 bg-purple-50 border border-purple-200/60 rounded-lg px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <svg className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            <div>
                              <p className="text-xs text-purple-900">
                                Your resume was submitted as-is to <span className="font-medium">{app.company}</span>. With Starter, we rewrite your resume for every job — highlighting the exact skills each company is looking for.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setDismissedTailorRows(prev => new Set(prev).add(app.id))}
                            className="text-purple-400 hover:text-purple-600 shrink-0"
                            aria-label="Dismiss"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-2 ml-6.5">
                          <button
                            onClick={() => handleCheckout("starter")}
                            disabled={checkingOut}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            Upgrade to Auto-Tailor — $29/mo
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
