"use client";

import { useState } from "react";
import { BrowseApplyForm } from "@/components/BrowseApplyForm";

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

interface Company {
  name: string;
  careersUrl: string;
  notes: string;
}

export default function ApplicationsDashboard({
  initialApplications,
  companies,
}: {
  initialApplications: Application[];
  companies: Company[];
}) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = initialApplications.filter((a) => {
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
    all: initialApplications.length,
    submitted: initialApplications.filter((a) => a.status === "submitted" || a.status === "applied").length,
    failed: initialApplications.filter((a) => a.status === "failed").length,
    skipped: initialApplications.filter((a) => a.status === "skipped").length,
  };

  return (
    <div>
      {/* Browse & Apply Form */}
      <BrowseApplyForm companies={companies} />

      {/* Application Status Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
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
              {(["all", "submitted", "failed", "skipped"] as const).map((s) => (
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
                ? "No applications yet. Select companies above and start applying."
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
