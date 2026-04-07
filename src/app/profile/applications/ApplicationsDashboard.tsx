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
}

function friendlyError(error: string): string {
  if (error.includes("Stuck")) return "Form didn't respond";
  if (error.includes("max steps")) return "Form too complex";
  if (error.includes("Login") || error.includes("authentication")) return "Login required";
  if (error.includes("resume")) return "Resume issue";
  if (error.includes("Verification")) return "Verification timed out";
  if (error.includes("iframe not found") || error.includes("not right")) return "Form not found";
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
  todayActivity,
  profileReady = false,
  missingRoles = false,
  missingResume = false,
}: {
  initialApplications: Application[];
  stats: Stats;
  usage?: { used: number; limit: number; tier: string } | null;
  todayActivity?: TodayActivity | null;
  profileReady?: boolean;
  missingRoles?: boolean;
  missingResume?: boolean;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [starting, setStarting] = useState(false);
  const [startResult, setStartResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const hasActiveSession = todayActivity?.status === "queued" || todayActivity?.status === "processing";
  const atLimit = usage ? usage.used >= usage.limit : false;

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
                  <div className="mt-4 p-3 rounded-xl bg-[#ef562a]/5 border border-[#ef562a]/20">
                    <p className="text-sm text-[var(--foreground)]">
                      You&apos;ve used all {usage.limit} free applications. Upgrade to apply to up to 100 jobs/month automatically.
                    </p>
                    <Link
                      href="/pricing"
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#ef562a] rounded-lg hover:bg-[#d44a22] transition-colors"
                    >
                      Upgrade Now
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
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
                    {app.errorMessage && app.status === "failed" && (
                      <p className="text-[10px] text-red-500 mt-0.5" title={app.errorMessage}>
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
                    {app.resumeTailored && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-100 text-purple-700">
                        Tailored
                      </span>
                    )}
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
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
