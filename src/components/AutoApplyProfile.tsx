"use client";

import { useState } from "react";

interface AutoApplyProfileProps {
  initialData: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    autoApplyEnabled: boolean;
    hasResume: boolean;
  };
}

export function AutoApplyProfile({ initialData }: AutoApplyProfileProps) {
  const [firstName, setFirstName] = useState(initialData.firstName || "");
  const [lastName, setLastName] = useState(initialData.lastName || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(
    initialData.autoApplyEnabled
  );
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [applyResult, setApplyResult] = useState<{
    submitted: number;
    skipped: number;
    failed: number;
  } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, autoApplyEnabled }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save");
      }

      setMessage({ type: "success", text: "Profile saved successfully" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyNow = async () => {
    if (
      !confirm(
        "This will submit your resume to all eligible Greenhouse jobs. Continue?"
      )
    )
      return;

    setApplying(true);
    setMessage(null);
    setApplyResult(null);

    try {
      const response = await fetch("/api/auto-apply", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Auto-apply failed");
      }

      setApplyResult(data.summary);
      setMessage({
        type: "success",
        text: `Applied to ${data.summary.submitted} jobs`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Auto-apply failed",
      });
    } finally {
      setApplying(false);
    }
  };

  const profileComplete =
    firstName.trim() && lastName.trim() && phone.trim() && initialData.hasResume;

  return (
    <div className="px-6 py-4 border-t border-[var(--card-border)]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-[var(--foreground)]">
          Auto-Apply Profile
        </h3>
      </div>
      <p className="text-xs text-[var(--gray-600)] mb-4">
        Fill in your details to auto-apply to Greenhouse jobs with your resume.
      </p>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--gray-600)] mb-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--gray-600)] mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[var(--gray-600)] mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
          />
        </div>

        {/* Auto-apply toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-sm text-[var(--foreground)]">
              Daily Auto-Apply
            </span>
            <p className="text-xs text-[var(--gray-600)]">
              Automatically apply to new jobs each day
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoApplyEnabled(!autoApplyEnabled)}
            disabled={!initialData.hasResume}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              autoApplyEnabled
                ? "bg-[#ef562a]"
                : "bg-[var(--gray-200)]"
            } ${!initialData.hasResume ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoApplyEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {!initialData.hasResume && (
          <p className="text-xs text-[var(--gray-600)]">
            Upload your resume above to enable auto-apply.
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>

          {profileComplete && (
            <button
              onClick={handleApplyNow}
              disabled={applying}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#ef562a] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {applying ? "Applying..." : "Apply Now"}
            </button>
          )}
        </div>
      </div>

      {/* Apply results */}
      {applyResult && (
        <div className="mt-4 p-3 bg-[var(--gray-50)] rounded-lg">
          <p className="text-sm font-medium text-[var(--foreground)] mb-2">
            Results
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-green-600">
                {applyResult.submitted}
              </p>
              <p className="text-xs text-[var(--gray-600)]">Submitted</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-600">
                {applyResult.skipped}
              </p>
              <p className="text-xs text-[var(--gray-600)]">Skipped</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">
                {applyResult.failed}
              </p>
              <p className="text-xs text-[var(--gray-600)]">Failed</p>
            </div>
          </div>
          <a
            href="/profile/applications"
            className="block mt-3 text-center text-sm text-[#ef562a] hover:underline"
          >
            View all applications
          </a>
        </div>
      )}
    </div>
  );
}
