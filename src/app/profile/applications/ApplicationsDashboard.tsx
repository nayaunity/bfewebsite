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
  if (error.includes("Stuck")) return "Form didn't respond.";
  if (error.includes("max steps")) return "Form too complex.";
  if (error.includes("Login") || error.includes("authentication")) return "Login required.";
  if (error.includes("resume")) return "Resume issue.";
  if (error.includes("Verification")) return "Email verification timed out.";
  if (error.includes("iframe not found")) return "Form not found.";
  return "Couldn't complete.";
}

function formatDateTime(dateStr: Date | string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver",
  });
}

function formatDateShort(dateStr: Date | string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Denver",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    submitted: "bg-green-100 text-green-700",
    applied: "bg-green-100 text-green-700",
    skipped: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    pending: "bg-blue-100 text-blue-700",
    found: "bg-gray-100 text-gray-700",
  };

  const labels: Record<string, string> = {
    submitted: "Applied",
    applied: "Applied",
    found: "Found",
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {labels[status] || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
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

  const filtered =
    filter === "all"
      ? initialApplications
      : initialApplications.filter((a) =>
          filter === "submitted" ? a.status === "submitted" || a.status === "applied" : a.status === filter
        );

  // Group by date for visual separation
  const grouped = filtered.reduce<Record<string, Application[]>>((acc, app) => {
    const dateKey = formatDateShort(app.createdAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(app);
    return acc;
  }, {});

  return (
    <div>
      {/* Browse & Apply Form */}
      <BrowseApplyForm companies={companies} />

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4">
        {["all", "submitted", "skipped", "failed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === s
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
            }`}
          >
            {s === "submitted" ? "Applied" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications list grouped by date */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-8 text-center">
          <p className="text-[var(--gray-600)]">
            {initialApplications.length === 0
              ? "No applications yet. Select companies above and click \"Start Applying\" to get started."
              : "No applications match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([dateKey, apps]) => (
            <div key={dateKey}>
              <h3 className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider mb-2 px-1">
                {dateKey}
              </h3>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
                <div className="divide-y divide-[var(--card-border)]">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      className="px-4 py-3 hover:bg-[var(--gray-50)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {app.applyUrl ? (
                              <a
                                href={app.applyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-[var(--foreground)] hover:text-[#ef562a] transition-colors truncate"
                              >
                                {app.jobTitle}
                              </a>
                            ) : (
                              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                                {app.jobTitle}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-[var(--gray-600)] mt-0.5">
                            {app.company}
                          </p>
                          {app.errorMessage && app.status === "failed" && (
                            <p className="text-xs text-red-500 mt-0.5" title={app.errorMessage}>
                              {friendlyError(app.errorMessage)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <StatusBadge status={app.status} />
                          <span className="text-[10px] text-[var(--gray-600)] whitespace-nowrap min-w-[80px] text-right">
                            {formatDateTime(app.createdAt).split(",").pop()?.trim()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
