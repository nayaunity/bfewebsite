"use client";

import { useState } from "react";
import Link from "next/link";
import { ROLE_OPTIONS } from "@/lib/role-options";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

interface AutoApplyProfileProps {
  initialData: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    autoApplyEnabled: boolean;
    hasResume: boolean;
    usState: string | null;
    workAuthorized: boolean | null;
    needsSponsorship: boolean | null;
    countryOfResidence: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    websiteUrl: string | null;
    currentEmployer: string | null;
    currentTitle: string | null;
    school: string | null;
    degree: string | null;
    city: string | null;
    preferredName: string | null;
    yearsOfExperience: string | null;
    targetRole: string | null;
  };
}

export function AutoApplyProfile({ initialData }: AutoApplyProfileProps) {
  const [firstName, setFirstName] = useState(initialData.firstName || "");
  const [lastName, setLastName] = useState(initialData.lastName || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [usState, setUsState] = useState(initialData.usState || "");
  const [workAuthorized, setWorkAuthorized] = useState<boolean | null>(
    initialData.workAuthorized
  );
  const [needsSponsorship, setNeedsSponsorship] = useState<boolean | null>(
    initialData.needsSponsorship
  );
  const [countryOfResidence, setCountryOfResidence] = useState(
    initialData.countryOfResidence || ""
  );
  const [linkedinUrl, setLinkedinUrl] = useState(initialData.linkedinUrl || "");
  const [githubUrl, setGithubUrl] = useState(initialData.githubUrl || "");
  const [websiteUrl, setWebsiteUrl] = useState(initialData.websiteUrl || "");
  const [currentEmployer, setCurrentEmployer] = useState(initialData.currentEmployer || "");
  const [currentTitle, setCurrentTitle] = useState(initialData.currentTitle || "");
  const [school, setSchool] = useState(initialData.school || "");
  const [degree, setDegree] = useState(initialData.degree || "");
  const [city, setCity] = useState(initialData.city || "");
  const [preferredName, setPreferredName] = useState(initialData.preferredName || "");
  const [yearsOfExperience, setYearsOfExperience] = useState(initialData.yearsOfExperience || "");
  const [targetRole, setTargetRole] = useState(initialData.targetRole || "");
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

  const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]";

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          autoApplyEnabled,
          usState: usState || null,
          workAuthorized,
          needsSponsorship,
          countryOfResidence: countryOfResidence || null,
          linkedinUrl: linkedinUrl || null,
          githubUrl: githubUrl || null,
          websiteUrl: websiteUrl || null,
          currentEmployer: currentEmployer || null,
          currentTitle: currentTitle || null,
          school: school || null,
          degree: degree || null,
          city: city || null,
          preferredName: preferredName || null,
          yearsOfExperience: yearsOfExperience || null,
          targetRole: targetRole || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save");
      }

      // Sync form state with saved values to prevent stale data on next save
      if (data.user) {
        setFirstName(data.user.firstName || "");
        setLastName(data.user.lastName || "");
        setPhone(data.user.phone || "");
        setUsState(data.user.usState || "");
        setWorkAuthorized(data.user.workAuthorized);
        setNeedsSponsorship(data.user.needsSponsorship);
        setCountryOfResidence(data.user.countryOfResidence || "");
        setLinkedinUrl(data.user.linkedinUrl || "");
        setGithubUrl(data.user.githubUrl || "");
        setWebsiteUrl(data.user.websiteUrl || "");
        setCurrentEmployer(data.user.currentEmployer || "");
        setCurrentTitle(data.user.currentTitle || "");
        setSchool(data.user.school || "");
        setDegree(data.user.degree || "");
        setCity(data.user.city || "");
        setPreferredName(data.user.preferredName || "");
        setYearsOfExperience(data.user.yearsOfExperience || "");
        setTargetRole(data.user.targetRole || "");
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


      <div className="space-y-3">
        {/* Name fields */}
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
              className={inputClass}
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
              className={inputClass}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs text-[var(--gray-600)] mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className={inputClass}
          />
        </div>

        {/* Common application questions */}
        <div className="pt-2 border-t border-[var(--card-border)]">
          <p className="text-xs font-medium text-[var(--foreground)] mb-3">
            Common Application Questions
          </p>

          {/* US State */}
          <div className="mb-3">
            <label className="block text-xs text-[var(--gray-600)] mb-1">
              U.S. State of Residence
            </label>
            <select
              value={usState}
              onChange={(e) => setUsState(e.target.value)}
              className={inputClass}
            >
              <option value="">Select state...</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Country */}
          <div className="mb-3">
            <label className="block text-xs text-[var(--gray-600)] mb-1">
              Country of Residence
            </label>
            <input
              type="text"
              value={countryOfResidence}
              onChange={(e) => setCountryOfResidence(e.target.value)}
              placeholder="United States"
              className={inputClass}
            />
          </div>

          {/* Work Authorization */}
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm text-[var(--foreground)]">
                Authorized to Work
              </span>
              <p className="text-xs text-[var(--gray-600)]">
                Currently authorized to work in the U.S.?
              </p>
            </div>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setWorkAuthorized(val)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    workAuthorized === val
                      ? "bg-[#ef562a] text-white"
                      : "bg-[var(--gray-100)] text-[var(--gray-600)]"
                  }`}
                >
                  {val ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>

          {/* Sponsorship */}
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm text-[var(--foreground)]">
                Need Sponsorship
              </span>
              <p className="text-xs text-[var(--gray-600)]">
                Will you need work authorization assistance?
              </p>
            </div>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setNeedsSponsorship(val)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    needsSponsorship === val
                      ? "bg-[#ef562a] text-white"
                      : "bg-[var(--gray-100)] text-[var(--gray-600)]"
                  }`}
                >
                  {val ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Professional details */}
        <div className="pt-2 border-t border-[var(--card-border)]">
          <p className="text-xs font-medium text-[var(--foreground)] mb-3">
            Professional Details
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-[var(--gray-600)] mb-1">
                Current Employer
              </label>
              <input
                type="text"
                value={currentEmployer}
                onChange={(e) => setCurrentEmployer(e.target.value)}
                placeholder="Acme Corp"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--gray-600)] mb-1">
                Current Title
              </label>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder="Software Engineer"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-[var(--gray-600)] mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Denver"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--gray-600)] mb-1">
                Years of Experience
              </label>
              <input
                type="text"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                placeholder="5"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-[var(--gray-600)] mb-1">
                Preferred Name
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="Optional nickname"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--gray-600)] mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-[var(--gray-600)] mb-1">
                GitHub URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--gray-600)] mb-1">
                Website / Portfolio
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--gray-600)] mb-1">
                School
              </label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="University of..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--gray-600)] mb-1">
                Degree
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="B.S. Computer Science"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Target Role */}
        <div className="pt-2 border-t border-[var(--card-border)]">
          <p className="text-xs font-medium text-[var(--foreground)] mb-2">
            Target Role
          </p>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className={inputClass}
          >
            <option value="">Select your target role...</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.label} value={role.label}>
                {role.label}
              </option>
            ))}
          </select>
          {targetRole && (
            <p className="text-[10px] text-[var(--gray-600)] mt-1">
              {ROLE_OPTIONS.find((r) => r.label === targetRole)?.description}
            </p>
          )}
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

        {/* Success/Error Message */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>

          {message?.type === "success" && (
            <Link
              href="/profile/applications"
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#ef562a] text-white hover:opacity-90 transition-opacity text-center"
            >
              Start Applying
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
