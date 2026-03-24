"use client";

import { useState } from "react";
import { BrowseApplyForm } from "@/components/BrowseApplyForm";

interface Application {
  id: string;
  company: string;
  jobTitle: string;
  status: string;
  errorMessage: string | null;
  submittedAt: Date | string | null;
  createdAt: Date | string;
}

function formatDate(dateStr: Date | string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    submitted: "bg-green-100 text-green-700",
    skipped: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    pending: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
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
  const [applying, setApplying] = useState(false);
  const [applications, setApplications] =
    useState<Application[]>(initialApplications);
  const [message, setMessage] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

  const handleApplyNow = async () => {
    if (
      !confirm(
        "This will queue your resume for auto-apply to all eligible jobs. Continue?"
      )
    )
      return;

    setApplying(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auto-apply", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Auto-apply failed");
      }

      setMessage(
        `Queued ${data.summary.queued} jobs for auto-apply, skipped ${data.summary.skipped}. ${data.summary.remainingThisMonth} applications remaining this month.`
      );

      // Refresh applications list
      const statusRes = await fetch("/api/auto-apply/status?limit=50");
      const statusData = await statusRes.json();
      if (statusRes.ok && statusData.applications) {
        setApplications(statusData.applications);
      }
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Auto-apply failed"
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <div>
      {/* Browse & Apply Form */}
      <BrowseApplyForm companies={companies} />

      {/* Filter bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
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
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Applications table */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-8 text-center">
          <p className="text-[var(--gray-600)]">
            {applications.length === 0
              ? "No applications yet. Click \"Apply to New Jobs\" to get started."
              : "No applications match this filter."}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          <div className="divide-y divide-[var(--card-border)]">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {app.jobTitle}
                  </p>
                  <p className="text-xs text-[var(--gray-600)]">
                    {app.company}
                  </p>
                  {app.errorMessage && (
                    <p className="text-xs text-red-500 mt-0.5 truncate">
                      {app.errorMessage}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={app.status} />
                  <span className="text-xs text-[var(--gray-600)] whitespace-nowrap">
                    {formatDate(app.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
