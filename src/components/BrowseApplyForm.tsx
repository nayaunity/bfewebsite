"use client";

import { useState, useEffect, useCallback } from "react";

interface Company {
  name: string;
  careersUrl: string;
  notes: string;
}

interface ProgressEntry {
  company: string;
  status: string;
  found: number;
  applied: number;
  skipped?: number;
  failed?: number;
  error?: string;
  debugLog?: string[];
}

interface SessionData {
  id: string;
  status: string;
  targetRole: string;
  totalCompanies: number;
  companiesDone: number;
  jobsFound: number;
  jobsApplied: number;
  jobsSkipped: number;
  jobsFailed: number;
  progressLog: ProgressEntry[];
  errorMessage: string | null;
}

interface Discovery {
  id: string;
  company: string;
  jobTitle: string;
  applyUrl: string;
  status: string;
  errorMessage: string | null;
}

const ROLE_OPTIONS = [
  {
    label: "AI Engineer / Software Engineer",
    searchTerms: "AI Engineer, Software Engineer, Backend Engineer, Full Stack Engineer",
    description: "Software, backend, frontend, full stack, AI, ML, data science, DevOps",
  },
  {
    label: "Developer Advocate",
    searchTerms: "Developer Advocate, Developer Relations, Technical Evangelist, Solutions Architect",
    description: "DevRel, community engineer, technical writer, solutions architect",
  },
  {
    label: "Content Creator",
    searchTerms: "Content Strategist, Social Media Manager, Copywriter, Marketing Manager",
    description: "Content strategy, social media, copywriting, video, brand",
  },
  {
    label: "Storyteller / Product Manager",
    searchTerms: "Product Manager, Program Manager, Producer, Creative Director",
    description: "Producer, PM, creative director, narrative designer, curriculum",
  },
];

export function BrowseApplyForm({ companies }: { companies: Company[] }) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const isRunning =
    sessionData?.status === "queued" || sessionData?.status === "processing";
  const isDone =
    sessionData?.status === "completed" || sessionData?.status === "failed";

  const toggleCompany = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === companies.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(companies.map((c) => c.name)));
    }
  };

  const handleStart = async () => {
    setError(null);
    setStarting(true);

    try {
      const roleOption = ROLE_OPTIONS.find((r) => r.label === selectedRole);
      const res = await fetch("/api/auto-apply/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: roleOption?.searchTerms || selectedRole,
          companies: Array.from(selected),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start");

      setSessionId(data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setStarting(false);
    }
  };

  const pollSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      const res = await fetch(`/api/auto-apply/browse/${sessionId}`);
      const data = await res.json();
      if (res.ok) {
        setSessionData(data.session);
        setDiscoveries(data.discoveries);
      }
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    pollSession();
    const interval = setInterval(pollSession, 5000);
    return () => clearInterval(interval);
  }, [sessionId, pollSession]);

  // Stop polling when done
  useEffect(() => {
    if (isDone) return;
  }, [isDone]);

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-[var(--card-border)]">
        <h2 className="text-lg font-serif text-[var(--foreground)]">
          Browse & Apply
        </h2>
        <p className="text-sm text-[var(--gray-600)] mt-1">
          Select companies and a target role. The system will browse their
          career pages and apply to matching jobs.
        </p>
      </div>

      {!sessionId && (
        <div className="px-6 py-4 space-y-4">
          {/* Target Role */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Target Role
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((role) => (
                <label
                  key={role.label}
                  className={`flex items-start gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole === role.label
                      ? "border-[#ef562a] bg-orange-50 dark:bg-orange-950/20"
                      : "border-[var(--card-border)] hover:border-[var(--gray-400)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetRole"
                    checked={selectedRole === role.label}
                    onChange={() => setSelectedRole(role.label)}
                    className="accent-[#ef562a] mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {role.label}
                    </span>
                    <p className="text-xs text-[var(--gray-600)] mt-0.5">
                      {role.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Company Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Companies ({selected.size}/{companies.length})
              </label>
              <button
                onClick={toggleAll}
                className="text-xs text-[#ef562a] hover:underline"
              >
                {selected.size === companies.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {companies.map((c) => (
                <label
                  key={c.name}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                    selected.has(c.name)
                      ? "border-[#ef562a] bg-orange-50 dark:bg-orange-950/20"
                      : "border-[var(--card-border)] hover:border-[var(--gray-400)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.name)}
                    onChange={() => toggleCompany(c.name)}
                    className="accent-[#ef562a]"
                  />
                  <span className="text-[var(--foreground)] truncate">
                    {c.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Validation hint */}
          {(!selectedRole || selected.size === 0) && (
            <p className="text-xs text-[var(--gray-600)]">
              {!selectedRole && selected.size === 0
                ? "Select a target role and at least one company to start."
                : !selectedRole
                  ? "Select a target role above to start."
                  : "Select at least one company to start."}
            </p>
          )}

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={
              starting || !selectedRole || selected.size === 0
            }
            className="w-full py-3 text-sm font-medium rounded-lg bg-[#ef562a] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {starting
              ? "Starting..."
              : !selectedRole
                ? "Select a Target Role to Start"
                : selected.size === 0
                  ? "Select Companies to Start"
                  : `Start Applying to ${selected.size} ${selected.size === 1 ? "Company" : "Companies"}`}
          </button>
        </div>
      )}

      {/* Progress Panel */}
      {sessionData && (
        <div className="px-6 py-4 space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--foreground)] font-medium">
                {isRunning ? "Browsing career pages..." : sessionData.status === "completed" ? "Complete" : "Failed"}
              </span>
              <span className="text-[var(--gray-600)]">
                {sessionData.companiesDone}/{sessionData.totalCompanies}{" "}
                companies
              </span>
            </div>
            <div className="w-full bg-[var(--gray-100)] rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  sessionData.status === "failed"
                    ? "bg-red-500"
                    : sessionData.status === "completed"
                      ? "bg-green-500"
                      : "bg-[#ef562a]"
                }`}
                style={{
                  width: `${
                    sessionData.totalCompanies > 0
                      ? (sessionData.companiesDone /
                          sessionData.totalCompanies) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-[var(--gray-50)] rounded-lg">
              <p className="text-lg font-bold text-[var(--foreground)]">
                {sessionData.jobsFound}
              </p>
              <p className="text-xs text-[var(--gray-600)]">Found</p>
            </div>
            <div className="text-center p-2 bg-[var(--gray-50)] rounded-lg">
              <p className="text-lg font-bold text-green-600">
                {sessionData.jobsApplied}
              </p>
              <p className="text-xs text-[var(--gray-600)]">Applied</p>
            </div>
            <div className="text-center p-2 bg-[var(--gray-50)] rounded-lg">
              <p className="text-lg font-bold text-red-600">
                {sessionData.jobsFailed}
              </p>
              <p className="text-xs text-[var(--gray-600)]">Failed</p>
            </div>
          </div>

          {/* Per-Company Progress */}
          {sessionData.progressLog.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wide">
                Company Progress
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {sessionData.progressLog.map((entry, i) => (
                  <div key={i} className="py-1.5 px-2 bg-[var(--gray-50)] rounded text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>
                          {entry.status === "done"
                            ? "\u2713"
                            : entry.status === "error"
                              ? "\u2717"
                              : "\u2022"}
                        </span>
                        <span className="text-[var(--foreground)]">
                          {entry.company}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--gray-600)]">
                        {entry.status === "error"
                          ? entry.error
                          : `${entry.applied} applied, ${entry.found} found`}
                      </span>
                    </div>
                    {entry.debugLog && entry.debugLog.length > 0 && (
                      <details className="mt-1">
                        <summary className="text-xs text-[var(--gray-600)] cursor-pointer hover:text-[var(--foreground)]">
                          Debug log ({entry.debugLog.length} steps)
                        </summary>
                        <pre className="mt-1 text-[10px] text-[var(--gray-600)] whitespace-pre-wrap break-all bg-[var(--background)] p-2 rounded border border-[var(--card-border)] max-h-48 overflow-y-auto">
                          {entry.debugLog.join("\n")}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discoveries */}
          {discoveries.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wide">
                Jobs Discovered ({discoveries.length})
              </p>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {discoveries.map((d) => (
                  <div
                    key={d.id}
                    className="py-1.5 px-2 bg-[var(--gray-50)] rounded text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-[var(--foreground)] truncate">
                          {d.jobTitle}
                        </p>
                        <p className="text-xs text-[var(--gray-600)]">
                          {d.company}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                          d.status === "applied"
                            ? "bg-green-100 text-green-700"
                            : d.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : d.status === "skipped"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                    {d.errorMessage && (
                      <p className="text-[10px] text-red-500 mt-0.5 truncate">
                        {d.errorMessage}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Session Button */}
          {isDone && (
            <button
              onClick={() => {
                setSessionId(null);
                setSessionData(null);
                setDiscoveries([]);
              }}
              className="w-full py-2 text-sm font-medium rounded-lg border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--gray-50)] transition-colors"
            >
              Start New Session
            </button>
          )}
        </div>
      )}
    </div>
  );
}
