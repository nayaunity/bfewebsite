"use client";

import { useState, useRef } from "react";
import { ProfileSection } from "./ProfileSection";
import { labelClass, saveProfileFields } from "./form-utils";
import { ROLE_OPTIONS } from "@/lib/role-options";
import { ResumeUpload } from "@/components/ResumeUpload";

interface ResumeData {
  id: string;
  name: string;
  fileName: string;
  blobUrl: string;
  keywords: string;
  isFallback: boolean;
  uploadedAt: string;
}

interface Props {
  initialRoles: string[];
  resumes: ResumeData[];
  primaryResume: {
    url: string | null;
    name: string | null;
    updatedAt: string | null;
  };
  maxResumes: number;
  tier: string;
}

function parseRoles(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* not JSON */ }
  return raw.trim() ? [raw.trim()] : [];
}

export function RolesAndResumesSection({
  initialRoles,
  resumes: initialResumes,
  primaryResume,
  maxResumes,
  tier,
}: Props) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialRoles);
  const [resumes, setResumes] = useState<ResumeData[]>(initialResumes);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingRoles, setSavingRoles] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingForRole, setUploadingForRole] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(false);

  const isUnlimited = maxResumes > 9999;
  const atLimit = !isUnlimited && resumes.length >= maxResumes;

  // Map role name → resume (if uploaded)
  const resumeForRole = (role: string) =>
    resumes.find((r) => r.name.toLowerCase().trim() === role.toLowerCase().trim());

  const rolesWithResumes = selectedRoles.filter((r) => resumeForRole(r));
  const rolesMissingResumes = selectedRoles.filter((r) => !resumeForRole(r));

  const filled = selectedRoles.length > 0 ? rolesWithResumes.length : 0;
  const total = Math.max(selectedRoles.length, 1);

  const toggleRole = async (role: string) => {
    const updated = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role];
    setSelectedRoles(updated);

    // Auto-save role selections
    setSavingRoles(true);
    await saveProfileFields({
      targetRole: updated.length > 0 ? JSON.stringify(updated) : null,
    });
    setSavingRoles(false);
  };

  const handleUploadForRole = (role: string) => {
    if (atLimit) return;
    setUploadingForRole(role);
    fileRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingForRole) return;

    setError(null);
    setUploading(uploadingForRole);

    try {
      const roleOption = ROLE_OPTIONS.find((r) => r.label === uploadingForRole);
      const keywords = roleOption
        ? roleOption.searchTerms.split(",").map((k) => k.trim()).filter(Boolean)
        : [];

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", uploadingForRole);
      formData.append("keywords", JSON.stringify(keywords));

      const res = await fetch("/api/profile/resumes", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResumes([data.resume, ...resumes]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
      setUploadingForRole(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm("Delete this resume?")) return;
    try {
      await fetch("/api/profile/resumes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setResumes(resumes.filter((r) => r.id !== id));
    } catch {
      setError("Failed to delete resume");
    }
  };

  // Resumes not tied to any selected role (orphaned or from old data)
  const orphanedResumes = resumes.filter(
    (r) => !selectedRoles.some((role) => r.name.toLowerCase().trim() === role.toLowerCase().trim())
  );

  return (
    <ProfileSection
      title="Roles & Resumes"
      id="roles-resumes"
      description="Select your target roles and upload a resume for each one"
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      defaultOpen={rolesMissingResumes.length > 0}
      completionCount={{ filled, total }}
      hideSave
    >
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileSelected}
        className="hidden"
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Why is this important */}
      <div>
        <button
          type="button"
          onClick={() => setShowWhy(!showWhy)}
          className="inline-flex items-center gap-1.5 text-sm text-[#ef562a] hover:underline cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Why is this important?
        </button>
        {showWhy && (
          <div className="mt-2 p-4 bg-[var(--accent-blue-bg)] text-[var(--accent-blue-text)] text-sm rounded-lg leading-relaxed space-y-2">
            <p>
              One of the fastest ways to land a job is to apply to multiple role types at the same time.
              But here&apos;s the catch — a generic resume won&apos;t get you interviews for any of them.
            </p>
            <p>
              Recruiters spend seconds scanning your resume. If it&apos;s not tailored to the specific role,
              you look like a long shot instead of the obvious choice. A resume optimized for Product Manager
              highlights completely different strengths than one for Software Engineer.
            </p>
            <p>
              By uploading a resume for each target role, BFE makes sure you&apos;re not just casting a wide net —
              you&apos;re always showing up as the right person for the job. More roles, more applications, better fit.
            </p>
          </div>
        )}
      </div>

      {/* Role selection */}
      <div>
        <label className={labelClass}>
          Target Roles
          <span className="font-normal text-[var(--gray-600)] ml-1">
            — select all that apply{savingRoles ? " (saving...)" : ""}
          </span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {ROLE_OPTIONS.map((role) => {
            const hasResume = !!resumeForRole(role.label);
            const isSelected = selectedRoles.includes(role.label);
            return (
              <label
                key={role.label}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? hasResume
                      ? "border-[var(--accent-green-text)] bg-[var(--accent-green-bg)]"
                      : "border-[#ef562a] bg-[var(--accent-orange-bg)]"
                    : "border-[var(--card-border)] hover:border-[var(--gray-200)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleRole(role.label)}
                  className="accent-[#ef562a] mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {role.label}
                    </span>
                    {isSelected && (
                      hasResume ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-green-bg)] text-[var(--accent-green-text)]">
                          Resume uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-orange-bg)] text-[var(--accent-orange-text)]">
                          Needs resume
                        </span>
                      )
                    )}
                  </div>
                  <p className="text-xs text-[var(--gray-600)] mt-0.5">
                    {role.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Resume status per selected role */}
      {selectedRoles.length > 0 && (
        <div>
          <label className={labelClass}>
            Resumes by Role
            <span className="font-normal text-[var(--gray-600)] ml-1">
              — {rolesWithResumes.length} of {selectedRoles.length} roles have a resume
            </span>
          </label>

          <div className="space-y-2 mt-2">
            {selectedRoles.map((role) => {
              const resume = resumeForRole(role);
              const isUploading = uploading === role;

              return (
                <div
                  key={role}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    resume
                      ? "bg-[var(--gray-50)] border-[var(--card-border)]"
                      : "bg-[var(--accent-orange-bg)] border-dashed border-[var(--accent-orange-text)]/30"
                  }`}
                >
                  {resume ? (
                    <>
                      <svg className="w-5 h-5 text-[var(--accent-green-text)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <a
                          href={resume.blobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[var(--foreground)] hover:underline"
                        >
                          {role}
                        </a>
                        <p className="text-xs text-[var(--gray-600)] truncate">
                          {resume.fileName}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteResume(resume.id)}
                        className="text-xs text-red-600 hover:text-red-700 flex-shrink-0"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-[var(--accent-orange-text)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)]">{role}</p>
                        <p className="text-xs text-[var(--accent-orange-text)]">No resume uploaded</p>
                      </div>
                      <button
                        onClick={() => handleUploadForRole(role)}
                        disabled={isUploading || atLimit}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#ef562a] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
                      >
                        {isUploading ? "Uploading..." : "Upload PDF"}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {atLimit && rolesMissingResumes.length > 0 && (
            <p className="text-xs text-[var(--gray-600)] mt-2">
              Resume limit reached on {tier} plan.{" "}
              <a href="/pricing" className="text-[#ef562a] underline">Upgrade</a> for more.
            </p>
          )}
        </div>
      )}

      {/* Orphaned resumes (uploaded for roles no longer selected) */}
      {orphanedResumes.length > 0 && (
        <div>
          <label className={labelClass}>
            Other Resumes
            <span className="font-normal text-[var(--gray-600)] ml-1">
              — not linked to a selected role
            </span>
          </label>
          <div className="space-y-2 mt-2">
            {orphanedResumes.map((resume) => (
              <div
                key={resume.id}
                className="flex items-center gap-3 p-3 bg-[var(--gray-50)] rounded-lg border border-[var(--card-border)]"
              >
                <div className="flex-1 min-w-0">
                  <a
                    href={resume.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[var(--foreground)] hover:underline"
                  >
                    {resume.name}
                  </a>
                  <p className="text-xs text-[var(--gray-600)] truncate">
                    {resume.fileName}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteResume(resume.id)}
                  className="text-xs text-red-600 hover:text-red-700 flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary / fallback resume */}
      <div>
        <label className={labelClass}>
          Primary Resume
          <span className="font-normal text-[var(--gray-600)] ml-1">
            — used as fallback when no role-specific resume matches
          </span>
        </label>
        <div className="-mx-6 mt-1">
          <ResumeUpload initialResume={primaryResume} />
        </div>
      </div>
    </ProfileSection>
  );
}
