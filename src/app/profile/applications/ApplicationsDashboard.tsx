"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { friendlyError } from "@/lib/error-display";
import { TrialRequiredBanner } from "@/components/TrialRequiredBanner";
import { TrialCapReachedBanner } from "@/components/TrialCapReachedBanner";
import { PaymentFailedBanner } from "@/components/PaymentFailedBanner";
import { InternshipPreferenceBanner } from "@/components/InternshipPreferenceBanner";

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

function formatTime(dateStr: Date | string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver",
  });
}

function fmtDate(ts: Date | string | null): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtClock(ts: Date | string | null): string {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function timeAgo(ts: Date | string | null): string {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const COMPANY_PALETTE = [
  "#ef562a", "#635bff", "#ff5a5f", "#a259ff", "#1f1f1f", "#5e6ad2", "#d97757",
  "#10a37f", "#ffcc00", "#632ca6", "#ff6600", "#1db954", "#f06a6a", "#58cc02",
  "#ff7a59", "#7b189f", "#0052cc", "#2164f3", "#f38020", "#95bf47", "#29b5e8",
  "#ff3008", "#43b02a", "#0052ff", "#5865f2", "#ff4500", "#ffd02f", "#00c4cc",
  "#f22f46", "#2d8cff", "#2496ed", "#00684a", "#15c39a", "#0572ec", "#4353ff",
];

function companyColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return COMPANY_PALETTE[hash % COMPANY_PALETTE.length];
}

function initialsOf(name: string): string {
  return name
    .replace(/[^A-Za-z ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || name.slice(0, 2).toUpperCase();
}

function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return val;
}

interface Stats {
  total: number;
  applied: number;
  failed: number;
  uniqueCompanies: number;
  thisWeek: number;
  matchAvg: number;
  streak: number;
}

interface TodayActivity {
  status: string;
  totalCompanies: number;
  companiesDone: number;
  jobsFound: number;
  jobsApplied: number;
  jobsFailed: number;
  jobsSkipped: number;
  startedAt: string | null;
  discoveries: Array<{
    id: string;
    company: string;
    jobTitle: string;
    status: string;
    createdAt: string;
  }>;
}

function StepRow({ done, active, label, detail }: { done: boolean; active: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-3.5 relative py-2.5 first:pt-0 last:pb-0">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 relative z-10 ${
        done ? "bg-green-100" : active ? "bg-[#fef3ef] shadow-[0_0_0_4px_rgba(239,86,42,0.1)]" : "bg-[var(--gray-100)]"
      }`}>
        {done ? (
          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : active ? (
          <div className="w-3 h-3 border-2 border-[#fef3ef] border-t-[#ef562a] rounded-full animate-spin" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--gray-200)]" />
        )}
      </div>
      <div className="pt-0.5">
        <span className={`text-[13px] leading-tight font-medium ${
          done ? "text-green-600" : active ? "text-[var(--foreground)]" : "text-[var(--gray-600)]/70"
        }`}>
          {label}
        </span>
        {detail && (
          <p className="text-[11px] text-[var(--gray-600)] mt-0.5">{detail}</p>
        )}
      </div>
    </div>
  );
}

function Monogram({ name, size = 34 }: { name: string; size?: number }) {
  const color = companyColor(name);
  return (
    <div
      className="flex items-center justify-center font-semibold shrink-0 text-white"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: color,
        fontSize: size * 0.38,
        letterSpacing: "-0.02em",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.08)",
      }}
    >
      {initialsOf(name)}
    </div>
  );
}

function HeroStat({ label, value, accent, fill }: { label: string; value: string | number; accent?: string; fill?: boolean }) {
  return (
    <div className="text-left lg:text-right">
      <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-[var(--gray-600)]">{label}</p>
      <p
        className="font-serif text-4xl xl:text-5xl leading-none mt-1"
        style={
          fill
            ? {
                background: accent,
                color: "#1a1a1a",
                padding: "2px 10px",
                borderRadius: 6,
                display: "inline-block",
              }
            : { color: accent || "var(--foreground)", display: "block" }
        }
      >
        {value}
      </p>
    </div>
  );
}

function Stamp({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block font-mono text-[10px] font-bold tracking-[0.25em] px-2.5 py-1 shrink-0"
      style={{
        color,
        border: `1.5px solid ${color}`,
        transform: "rotate(-3deg)",
        borderRadius: 4,
        background: "transparent",
        opacity: 0.85,
      }}
    >
      {label}
    </span>
  );
}

function MatchBar({ score }: { score: number }) {
  return (
    <div className="hidden md:flex items-center gap-2 w-24">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--gray-100)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: "linear-gradient(90deg,#ef562a,#ffb65e)" }}
        />
      </div>
      <span className="font-mono text-[11px] tabular-nums text-[var(--gray-600)]">{score}</span>
    </div>
  );
}

function TornEdge({ color, top }: { color: string; top?: boolean }) {
  return (
    <svg
      className={`absolute left-0 right-0 w-full ${top ? "-top-[1px]" : "-bottom-[1px]"}`}
      viewBox="0 0 1200 14"
      preserveAspectRatio="none"
      style={{ height: 14, transform: top ? "rotate(180deg)" : "none", zIndex: 2, color }}
    >
      <path
        d={`M0,0 L0,7 ${Array.from({ length: 60 }, (_, i) => `L${(i * 20) + 10},${i % 2 === 0 ? 14 : 0}`).join(" ")} L1200,7 L1200,0 Z`}
        fill="currentColor"
      />
    </svg>
  );
}

function TailoredBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 font-mono uppercase tracking-[0.15em] rounded-md shrink-0"
      style={{
        fontSize: 9,
        padding: "2px 6px",
        background: "var(--accent-purple-bg)",
        color: "var(--accent-purple-text)",
        border: "1px solid color-mix(in srgb, var(--accent-purple-text) 25%, transparent)",
      }}
      title="Resume customized for this role"
    >
      <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.8 5.5L19 10l-5.2 1.5L12 17l-1.8-5.5L5 10l5.2-1.5L12 3z" />
      </svg>
      Tailored
    </span>
  );
}

function Ticker({ apps }: { apps: Application[] }) {
  if (apps.length === 0) return null;
  const items = [...apps, ...apps, ...apps];
  return (
    <div className="relative py-3 overflow-hidden">
      <div className="flex gap-10 whitespace-nowrap animate-marquee" style={{ width: "max-content" }}>
        {items.map((a, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: companyColor(a.company) }} />
            <span className="font-mono text-[var(--gray-600)]">APPLIED &rarr;</span>
            <span className="font-medium text-[var(--foreground)]">{a.company}</span>
            <span className="text-[var(--gray-600)]">{a.jobTitle}</span>
            <span className="font-mono text-xs text-[var(--gray-600)]">{timeAgo(a.submittedAt ?? a.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
  subscriptionTier = "free",
  subscriptionStatus = "inactive",
  freeTierEndsAt = null,
  showInternshipPreferenceBanner = false,
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
  subscriptionTier?: string;
  subscriptionStatus?: string;
  freeTierEndsAt?: string | null;
  showInternshipPreferenceBanner?: boolean;
}) {
  const showTrialBanner = subscriptionTier === "free" && !!freeTierEndsAt;
  const showPaymentFailedBanner =
    subscriptionStatus === "past_due" || subscriptionStatus === "unpaid";
  // Trial-cap conversion moment: trialing user has burned through their 5
  // trial applies. Highest-intent upgrade surface — owns the moment with
  // loss-aversion + endowment copy and one-click upgrade-now CTA.
  const showTrialCapBanner =
    subscriptionStatus === "trialing" && (usage?.used ?? 0) >= 5;
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [starting, setStarting] = useState(false);
  const [startResult, setStartResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const [liveProgress, setLiveProgress] = useState<{
    status: string;
    totalCompanies: number;
    companiesDone: number;
    jobsFound: number;
    jobsApplied: number;
    jobsSkipped: number;
  } | null>(null);

  const sessionStatus = liveProgress?.status ?? todayActivity?.status;
  const hasActiveSession = sessionStatus === "queued" || sessionStatus === "processing";
  const atLimit = usage ? usage.used >= usage.limit : false;

  useEffect(() => {
    if (!hasActiveSession) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/auto-apply/progress");
        if (!res.ok) return;
        const data = await res.json();
        if (!data.active && data.status === "completed") {
          setLiveProgress(data);
          clearInterval(poll);
          setTimeout(() => window.location.reload(), 2000);
          return;
        }
        if (data.active) setLiveProgress(data);
      } catch {}
    }, 8000);
    return () => clearInterval(poll);
  }, [hasActiveSession]);
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

  // Email deep-link: /profile/applications?startTrial=1 fires the Starter
  // trial checkout immediately. Strip the param so a refresh does not
  // re-trigger the redirect.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("startTrial") !== "1") return;
    if (subscriptionTier !== "free") return;
    params.delete("startTrial");
    const newQs = params.toString();
    const newUrl = window.location.pathname + (newQs ? `?${newQs}` : "");
    window.history.replaceState({}, "", newUrl);
    handleCheckout("starter");
  }, [handleCheckout, subscriptionTier]);

  const tips = [
    "Each application uses the resume that best matches the role. That’s why uploading role-specific resumes matters.",
    "We scan 5,000+ open roles daily and only apply to the ones that match your profile, location, and target roles.",
    "Applications go out at 3am MT each day. You can also click “Start Applying Now” anytime.",
    "The more target roles and resumes you add, the more jobs we can match you to.",
    "The average job search takes 3 to 6 months. Auto-apply keeps your pipeline full while you focus on prep.",
    "Most roles receive 250+ applications. Applying early increases your chances of being reviewed.",
    "Referred candidates are 4x more likely to be hired. Volume still matters for roles where you don’t have a referral.",
    "Companies often re-open roles after the first hire doesn’t work out. Consistent applying catches these second chances.",
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
      } else if (filter === "live") {
        if (a.status !== "applying" && a.status !== "pending") return false;
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
    live: visibleApplications.filter((a) => a.status === "applying" || a.status === "pending").length,
    skipped: visibleApplications.filter((a) => a.status === "skipped").length,
  };

  const handleCardClick = (newFilter: string) => {
    setFilter(newFilter);
    document.getElementById("application-table")?.scrollIntoView({ behavior: "smooth" });
  };

  // Group filtered rows by date for the receipt log sections
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Application[]> = {};
    filtered.forEach((a) => {
      const ts = a.submittedAt ?? a.createdAt;
      const key = fmtDate(ts);
      (groups[key] = groups[key] || []).push(a);
    });
    return Object.entries(groups);
  }, [filtered]);

  // Most-applied companies for the sidebar leaderboard
  const topCompanies = useMemo(() => {
    const map: Record<string, number> = {};
    visibleApplications
      .filter((a) => a.status === "submitted" || a.status === "applied")
      .forEach((a) => {
        map[a.company] = (map[a.company] || 0) + 1;
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [visibleApplications]);
  const topCompaniesMax = topCompanies[0]?.[1] || 1;

  // "Applying right now" — anything with applying/pending status
  const liveApps = visibleApplications.filter(
    (a) => a.status === "applying" || a.status === "pending"
  );

  const counted = useCountUp(stats.applied, 1100);

  // Short-day greeting line. Falls back to today's date if streak is 0.
  const heroDateLabel = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Pretty tier label for the usage strip
  const tierLabel =
    usage?.tier === "starter" ? "Starter" :
    usage?.tier === "pro" ? "Pro" :
    usage?.tier === "free" ? "Free" :
    usage?.tier ?? "";

  return (
    <div>
      {showPaymentFailedBanner && <PaymentFailedBanner />}
      {showTrialCapBanner && <TrialCapReachedBanner />}
      {showTrialBanner && freeTierEndsAt && (
        <TrialRequiredBanner freeTierEndsAt={freeTierEndsAt} />
      )}
      {showInternshipPreferenceBanner && <InternshipPreferenceBanner />}
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
              <p className="text-sm text-black/70 mt-0.5">We tailor your resume for every application, but it&apos;s only as strong as the original. Answer a few quick questions and we&apos;ll rewrite yours to lead with measurable impact, so every tailored version starts from a stronger foundation.</p>
            </div>
          </div>
          <svg className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      )}

      {/* Mission Log hero */}
      <div className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-x-8 gap-y-6 items-end">
          <div>
            <p className="text-[11px] font-mono tracking-[0.3em] uppercase text-[var(--gray-600)]">
              Mission Log &middot; {heroDateLabel}
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-[68px] 2xl:text-[80px] leading-[0.95] mt-2 tracking-tight text-[var(--foreground)]">
              <span>We applied to </span>
              <span className="text-[#ef562a]">{counted} jobs</span>
              <span> for you.</span>
            </h2>
            <p className="mt-3 text-base xl:text-lg text-[var(--gray-600)] max-w-3xl">
              {stats.applied > 0
                ? `Across ${stats.uniqueCompanies} ${stats.uniqueCompanies === 1 ? "company" : "companies"}. While you were doing literally anything else.`
                : "Set up your profile and we'll start applying to matching jobs every morning at 3am MT."}
            </p>
          </div>
          <div className="flex items-center gap-6 lg:gap-4 lg:justify-end flex-wrap">
            <HeroStat label="This week" value={stats.thisWeek} accent="#ef562a" />
            {stats.streak > 0 && (
              <HeroStat label="Streak" value={`${stats.streak}d`} accent="#ffe500" fill />
            )}
            {stats.matchAvg > 0 && (
              <HeroStat label="Match avg" value={`${stats.matchAvg}%`} />
            )}
          </div>
        </div>
      </div>

      {/* Ticker band — only shows when we have applied apps */}
      {visibleApplications.filter((a) => a.status === "submitted" || a.status === "applied").length > 0 && (
        <div className="border-y border-[var(--card-border)] overflow-hidden bg-[var(--gray-50)] mb-8 -mx-4 md:mx-0 md:rounded-2xl">
          <Ticker
            apps={visibleApplications
              .filter((a) => a.status === "submitted" || a.status === "applied")
              .slice(0, 14)}
          />
        </div>
      )}

      {/* Quota strip — usage + Start CTA + tip carousel */}
      <section className="mb-8">
        <div
          className="rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-[1.4fr_auto_1.2fr] gap-5 items-center bg-[var(--card-bg)] border border-[var(--card-border)]"
        >
          {/* Usage meter */}
          <div>
            {usage ? (
              <>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">
                    Monthly applications {tierLabel ? `· ${tierLabel}` : ""}
                  </span>
                  <span className="text-[12px] font-mono tabular-nums text-[var(--foreground)]">
                    <span className="font-semibold text-[#ef562a]">{usage.used}</span>
                    <span className="text-[var(--gray-600)]"> / {usage.limit}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-[var(--gray-100)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (usage.used / usage.limit) * 100)}%`,
                      background: "linear-gradient(90deg, #ef562a, #ffb65e)",
                      transition: "width 1.2s ease",
                    }}
                  />
                </div>
                <p className="text-[11px] mt-2 text-[var(--gray-600)]">
                  Every morning at 3am MT we scan 5,800+ jobs and apply to the ones that match your profile.
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--gray-600)]">
                Every morning at 3am MT we scan 5,800+ jobs and apply to the ones that match your profile.
              </p>
            )}
          </div>

          {/* Start Applying CTA — gates on payment status, profileReady, hasActiveSession, atLimit */}
          <div className="flex justify-start lg:justify-center">
            {hasActiveSession ? (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-[0.15em] rounded-xl bg-[#fef3ef] text-[#ef562a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef562a] animate-pulse" />
                Session running
              </span>
            ) : showPaymentFailedBanner ? (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-[0.15em] rounded-xl bg-red-50 text-red-700">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Applications paused
              </span>
            ) : atLimit ? (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl font-semibold px-5 py-2.5 text-sm bg-[#1a1a1a] text-[#ffe500] hover:opacity-90 transition-all"
              >
                Limit reached. See plans
              </Link>
            ) : profileReady ? (
              <button
                onClick={handleStartApplying}
                disabled={starting}
                className="inline-flex items-center gap-2 rounded-xl font-semibold px-5 py-2.5 text-sm bg-[#ef562a] text-white hover:brightness-110 disabled:opacity-80 disabled:cursor-wait transition-all"
              >
                {starting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" />
                    </svg>
                    Finding matching jobs...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
                    </svg>
                    Start Applying Now
                  </>
                )}
              </button>
            ) : (
              <Link
                href={missingRoles ? "/profile" : "/auto-apply/next-steps"}
                className="inline-flex items-center gap-2 rounded-xl font-semibold px-5 py-2.5 text-sm bg-[#1a1a1a] text-[#ffe500] hover:opacity-90 transition-all"
              >
                {missingRoles ? "Set target roles" : "Upload a resume"}
              </Link>
            )}
          </div>

          {/* Tip carousel */}
          <div
            className="flex items-start gap-3 rounded-2xl px-4 py-3 bg-[var(--accent-blue-bg)] border border-[var(--card-border)]"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#ef562a]/10 text-[#ef562a]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1 text-[var(--gray-600)]">
                Did you know?
              </p>
              <p
                className="text-[13px] leading-snug text-[var(--foreground)]"
                style={{
                  opacity: tipFade ? 1 : 0,
                  transform: tipFade ? "translateY(0)" : "translateY(-6px)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                }}
              >
                {tips[tipIndex]}
              </p>
              <div className="flex gap-1 mt-2">
                {tips.map((_, n) => (
                  <span
                    key={n}
                    className="h-[2px] rounded-full transition-all"
                    style={{
                      width: n === tipIndex ? 18 : 6,
                      background: n === tipIndex ? "#ef562a" : "var(--gray-200)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Start result feedback (success/error) */}
        {startResult?.success && (
          <p className="mt-2 text-sm text-green-600">{startResult.message}</p>
        )}
        {startResult?.error && (
          <p className="mt-2 text-sm text-red-500">{startResult.error}</p>
        )}
      </section>

      {/* Profile readiness checklist — preserved from original dashboard */}
      {!profileReady && (
        <div className="mb-8 p-4 rounded-2xl bg-[var(--gray-50)] border border-[var(--card-border)]">
          <p className="text-sm text-[var(--foreground)] font-medium mb-2">
            Almost there. Complete these to start applying:
          </p>
          <ul className="text-xs text-[var(--gray-600)] space-y-1.5 ml-1">
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

      {/* Today's Auto-Apply Activity — preserved layout */}
      {todayActivity && (() => {
        const p = liveProgress ?? todayActivity;
        const isActive = p.status === "queued" || p.status === "processing";
        const isComplete = p.status === "completed";
        const companiesTotal = p.totalCompanies || 0;
        const companiesDone = p.companiesDone || 0;
        const found = p.jobsFound || 0;
        const applied = p.jobsApplied || 0;
        const progressPct = companiesTotal > 0 ? Math.round((companiesDone / companiesTotal) * 100) : 0;

        const scanDone = companiesDone > 0;
        const scanComplete = companiesTotal > 0 && companiesDone >= companiesTotal;
        const hasMatches = found > 0;
        const applyingStarted = applied > 0 || (scanComplete && hasMatches);

        return (
          <div className="mb-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--gray-100)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#ef562a]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l3-7 4 14 3-7h5" />
                </svg>
                <h2 className="text-[15px] font-semibold text-[var(--foreground)]">
                  Today&apos;s Auto-Apply
                </h2>
              </div>
              {isActive ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full bg-[#fef3ef] text-[#ef562a]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef562a] animate-pulse" />
                  Running
                </span>
              ) : isComplete ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full bg-green-50 text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Complete
                </span>
              ) : null}
            </div>

            {isActive ? (
              <div className="px-5 py-5">
                {companiesTotal > 0 && (
                  <div className="mb-6">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs text-[var(--gray-600)]">
                        {scanComplete ? "Submitting applications" : "Scanning your target companies"}
                      </span>
                      <span className="text-xl font-bold text-[#ef562a]">{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--gray-100)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#ef562a] to-[#f97316] transition-all duration-700 ease-out"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="relative pl-4">
                  <div className={`absolute left-[23px] top-7 bottom-7 w-0.5 ${
                    scanComplete ? "bg-green-400" : scanDone ? "bg-gradient-to-b from-[#ef562a] via-[#ef562a] to-[var(--gray-200)]" : "bg-[var(--gray-200)]"
                  }`} />
                  <StepRow
                    done={scanComplete}
                    active={!scanComplete}
                    label={
                      scanComplete
                        ? `Scanned ${companiesTotal} companies`
                        : "Scanning companies for open roles"
                    }
                    detail={!scanComplete && scanDone ? `${companiesDone} of ${companiesTotal} companies checked` : undefined}
                  />
                  <StepRow
                    done={scanComplete && hasMatches}
                    active={scanDone && !scanComplete}
                    label={
                      hasMatches
                        ? `Found ${found} matching role${found !== 1 ? "s" : ""}`
                        : "Matching your profile to open positions"
                    }
                  />
                  <StepRow
                    done={false}
                    active={hasMatches && scanComplete}
                    label="Tailoring resume & submitting applications"
                    detail={applyingStarted && applied > 0 ? `${applied} of ${found} sent` : undefined}
                  />
                </div>

                <div className="mt-5 text-center text-[11px] text-[var(--gray-600)] bg-[var(--gray-100)] rounded-lg py-2.5 px-4">
                  This usually takes a few minutes. You can leave this page and come back.
                </div>
              </div>
            ) : isComplete ? (
              <div className="px-5 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Today&apos;s session complete
                    </p>
                    <p className="text-xs text-[var(--gray-600)] mt-0.5">
                      {applied > 0
                        ? `Scanned ${companiesTotal} companies, found ${found} matching role${found !== 1 ? "s" : ""}`
                        : `Scanned ${companiesTotal} companies. No matching roles found today. We scan again tomorrow at 3 AM MT.`}
                    </p>
                  </div>
                  {applied > 0 && (
                    <div className="text-right pl-4">
                      <span className="text-[28px] font-bold text-green-600 leading-none">{applied}</span>
                      <span className="block text-[11px] text-[var(--gray-600)]">applied</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-5 py-6 text-center text-sm text-[var(--gray-600)]">
                {p.status === "queued"
                  ? "Your session is queued and will start shortly..."
                  : "Session ended. We'll try again tomorrow at 3 AM MT."}
              </div>
            )}
          </div>
        );
      })()}

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
              Unlock 100 Apps/Mo for $29
            </button>
            <Link href="/pricing" className="text-xs text-[var(--gray-600)] hover:text-[var(--foreground)] hover:underline">
              See all plans
            </Link>
          </div>
        </div>
      )}

      {/* Main grid: Receipt log + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px] gap-8">
        {/* LEFT: Receipt log */}
        <section>
          {/* Filter pills + search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {([
                ["all", "All", filterCounts.all],
                ["submitted", "Applied", filterCounts.submitted],
                ...(filterCounts.live > 0 ? [["live", "Live", filterCounts.live] as const] : []),
                ...(filterCounts.skipped > 0 ? [["skipped", "Skipped", filterCounts.skipped] as const] : []),
              ] as Array<readonly [string, string, number]>).map(([k, label, n]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    filter === k
                      ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                      : "bg-transparent text-[var(--foreground)] border-[var(--card-border)] hover:bg-[var(--gray-100)]"
                  }`}
                >
                  {label} <span className="opacity-60 ml-1">{n}</span>
                </button>
              ))}
            </div>
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gray-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company or role"
                className="pl-9 pr-3 py-2 text-sm rounded-full outline-none w-full md:w-64 bg-transparent border border-[var(--card-border)] text-[var(--foreground)] focus:ring-2 focus:ring-[#ef562a]/30"
              />
            </div>
          </div>

          {/* Receipt stack */}
          <div
            id="application-table"
            className="relative overflow-hidden rounded-[14px] bg-[var(--card-bg)] border border-[var(--card-border)] scroll-mt-4"
            style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.02), 0 20px 40px -30px rgba(0,0,0,0.15)" }}
          >
            {/* torn-edge top */}
            <TornEdge color="var(--background)" top />
            <div className="px-6 pt-5 pb-3 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">
              <span>Auto-Apply Receipts</span>
              <span>#{filtered.length.toString().padStart(4, "0")}</span>
            </div>
            <div className="px-4 md:px-6 pb-6">
              {groupedByDate.length === 0 ? (
                <div className="py-16 text-center text-sm text-[var(--gray-600)]">
                  {initialApplications.length === 0
                    ? "No applications yet. We’ll start applying to matching jobs for you every morning at 3am MT."
                    : "No applications match your filter."}
                </div>
              ) : (
                groupedByDate.map(([date, rows]) => (
                  <div key={date} className="mb-5 last:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)]">{date}</span>
                      <div className="flex-1 border-t border-dashed border-[var(--card-border)]" />
                      <span className="text-[11px] font-mono text-[var(--gray-600)]">{rows.length} {rows.length === 1 ? "entry" : "entries"}</span>
                    </div>
                    <ul>
                      {rows.map((app) => {
                        const isApplied = app.status === "submitted" || app.status === "applied";
                        const isLive = app.status === "applying" || app.status === "pending";
                        const stampColor = isApplied ? "#2f7a3a" : isLive ? "#ef562a" : "#a39026";
                        const stampText = isApplied ? "APPLIED" : isLive ? "IN FLIGHT" : "SKIPPED";
                        const ts = app.submittedAt ?? app.createdAt;
                        return (
                          <li
                            key={app.id}
                            className="py-3.5 border-b border-dashed border-[var(--card-border)] last:border-b-0"
                          >
                            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                              <span className="hidden sm:block font-mono text-[11px] w-14 shrink-0 text-[var(--gray-600)]">{fmtClock(ts)}</span>
                              <Monogram name={app.company} size={34} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium truncate text-[var(--foreground)]">{app.jobTitle}</p>
                                  {app.resumeTailored && <TailoredBadge />}
                                </div>
                                <p className="text-xs truncate text-[var(--gray-600)]">
                                  <span className="sm:hidden font-mono mr-2">{fmtClock(ts)}</span>
                                  {app.company}
                                  {app.matchReason ? ` · ${app.matchReason}` : ""}
                                </p>
                                {app.status === "skipped" && (
                                  <p className="text-[10px] mt-0.5 text-[var(--gray-600)]">
                                    {friendlyError(app.errorMessage)}
                                  </p>
                                )}
                                {/* Mobile-only meta row: stamp + match + view */}
                                <div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap">
                                  <Stamp label={stampText} color={stampColor} />
                                  {typeof app.matchScore === "number" && app.matchScore > 0 && (
                                    <span className="text-[11px] font-mono tabular-nums text-[var(--gray-600)]">
                                      {app.matchScore}% match
                                    </span>
                                  )}
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
                              {/* Desktop meta column: match bar, stamp, view */}
                              <div className="hidden sm:flex items-center gap-3 flex-wrap justify-end">
                                {typeof app.matchScore === "number" && app.matchScore > 0 && (
                                  <MatchBar score={app.matchScore} />
                                )}
                                <Stamp label={stampText} color={stampColor} />
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

                            {/* Resume comparison (preserved from original) */}
                            {app.resumeTailored && app.tailoredResumeUrl ? (
                              <div className="mt-2 bg-[var(--accent-purple-bg)] border border-purple-200 rounded-lg px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                <div className="flex items-center gap-2 text-xs text-[var(--accent-purple-text)] font-medium">
                                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Resume customized for this role
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  {app.originalResumeUrl && (
                                    <a
                                      href={app.originalResumeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md border border-purple-300 bg-white text-purple-800 hover:bg-purple-100 transition-colors"
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
                              !app.resumeTailored &&
                              isApplied &&
                              usage?.tier === "free" &&
                              !dismissedTailorRows.has(app.id) && (
                                <div className="mt-2 bg-[var(--accent-purple-bg)] border border-purple-200/60 rounded-lg px-4 py-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                      <svg className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                      </svg>
                                      <p className="text-xs text-[var(--accent-purple-text)]">
                                        Your resume was submitted as-is to <span className="font-medium">{app.company}</span>. With Starter, we rewrite your resume for every job, highlighting the exact skills each company is looking for.
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => setDismissedTailorRows((prev) => new Set(prev).add(app.id))}
                                      className="text-purple-400 hover:text-purple-600 shrink-0"
                                      aria-label="Dismiss"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-3 mt-2 ml-6">
                                    <button
                                      onClick={() => handleCheckout("starter")}
                                      disabled={checkingOut}
                                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors whitespace-nowrap disabled:opacity-50"
                                    >
                                      Upgrade to Auto-Tailor for $29/mo
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
            <TornEdge color="var(--background)" />
          </div>
        </section>

        {/* RIGHT: Sidebar */}
        <aside className="space-y-6">
          {/* Applying right now */}
          <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full animate-ping bg-[#ef562a] opacity-50" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ef562a]" />
              </span>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Applying right now</h3>
            </div>
            {liveApps.length === 0 ? (
              <p className="text-sm text-[var(--gray-600)]">
                Next scan 5:00 AM ET.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {liveApps.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 text-sm">
                    <Monogram name={a.company} size={26} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[var(--foreground)]">{a.company}</p>
                      <p className="text-xs truncate text-[var(--gray-600)]">{a.jobTitle}</p>
                    </div>
                    <div className="flex gap-1">
                      <span className="w-1 h-1 rounded-full animate-bounce bg-[var(--gray-600)]" style={{ animationDelay: "0s" }} />
                      <span className="w-1 h-1 rounded-full animate-bounce bg-[var(--gray-600)]" style={{ animationDelay: "0.15s" }} />
                      <span className="w-1 h-1 rounded-full animate-bounce bg-[var(--gray-600)]" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Most-applied companies */}
          {topCompanies.length > 0 && (
            <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
              <h3 className="text-sm font-semibold mb-3 text-[var(--foreground)]">Most-applied companies</h3>
              <ul className="space-y-2.5">
                {topCompanies.map(([name, n]) => (
                  <li key={name} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-24 truncate text-[var(--foreground)]">{name}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--gray-100)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(n / topCompaniesMax) * 100}%`,
                          background: companyColor(name),
                          transition: "width 1s ease",
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono tabular-nums text-[var(--gray-600)]">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pro move tip */}
          <div className="p-5 rounded-2xl relative overflow-hidden bg-[var(--card-bg)] border border-[var(--card-border)]">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-[#ffe500]/30" />
            <div className="relative">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] mb-1 text-[var(--gray-600)]">Pro move</p>
              <p className="text-sm leading-snug text-[var(--foreground)]">
                Upload a second resume tuned for a different role family. We&apos;ll auto-route applications to whichever resume matches better.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer caption */}
      <p className="mt-10 text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--gray-600)] text-center">
        End of log &middot; Next run 5:00 AM ET
      </p>
    </div>
  );
}
