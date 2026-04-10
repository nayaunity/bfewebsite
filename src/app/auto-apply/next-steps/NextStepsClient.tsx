"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface Resume {
  id: string;
  name: string;
  fileName: string;
  blobUrl: string;
  keywords: string;
  isFallback: boolean;
  uploadedAt: string | Date;
}

import { ROLE_OPTIONS } from "@/lib/role-options";

export default function NextStepsClient({
  userName,
  initialResumes,
  tier = "free",
}: {
  userName: string;
  initialResumes: Resume[];
  tier?: string;
}) {
  const [resumes, setResumes] = useState<Resume[]>(initialResumes);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resumeCount = resumes.length;
  const goal = 1;
  const goalMet = resumeCount >= goal;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRole) {
      setError("Please select a role first.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const roleOption = ROLE_OPTIONS.find((r) => r.label === selectedRole);
      const keywords = roleOption
        ? roleOption.searchTerms.split(",").map((k) => k.trim()).filter(Boolean)
        : [];

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", selectedRole);
      formData.append("keywords", JSON.stringify(keywords));

      const res = await fetch("/api/profile/resumes", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResumes([data.resume, ...resumes]);
      setSelectedRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
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

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
        <Link href="/" className="font-serif text-xl font-bold">
          the<span className="text-[#ef562a]">BFE</span>
        </Link>
        <Link
          href="/"
          className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors"
        >
          Home
        </Link>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 md:py-16">
        {/* Welcome */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)] mb-3">
            Welcome{userName ? `, ${userName}` : ""}!
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ef562a]/10 text-[#ef562a] text-sm font-bold">
            Last step!
          </div>
          <p className="mt-4 text-[var(--gray-600)] max-w-md mx-auto">
            Upload at least one resume, then you can start auto-applying to jobs.
          </p>
        </div>

        {/* Task: Upload Resumes */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          {/* Task header */}
          <div className="px-6 py-5 border-b border-[var(--card-border)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#ffe500] text-black text-xs font-bold">
                    1
                  </span>
                  <h2 className="font-serif text-xl text-[var(--foreground)]">
                    Upload your resume
                  </h2>
                </div>
                <p className="text-sm text-[var(--gray-600)] ml-8">
                  When we apply to a job for you, we automatically pick the resume that best fits that role. A Backend Engineer resume goes to backend jobs, your PM resume goes to PM roles — so each application puts your strongest foot forward.
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4 ml-8">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[var(--gray-600)]">
                  {resumeCount} of {goal} resumes
                </span>
                {goalMet && (
                  <span className="text-green-600 font-medium">Complete!</span>
                )}
              </div>
              <div className="h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((resumeCount / goal) * 100, 100)}%`,
                    backgroundColor: goalMet ? "#22c55e" : "#ef562a",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Uploaded resumes */}
          <div className="px-6 py-4">
            {resumes.length > 0 && (
              <div className="space-y-2 mb-4">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center gap-3 p-3 bg-[var(--gray-50)] rounded-lg"
                  >
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <a
                        href={resume.blobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[var(--foreground)] hover:underline truncate block"
                      >
                        {resume.name}
                      </a>
                      <p className="text-xs text-[var(--gray-600)] truncate">
                        {resume.fileName}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="text-xs text-red-500 hover:text-red-600 flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload form */}
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Role selection */}
            <div>
              <p className="text-xs font-medium text-[var(--gray-600)] mb-2">
                What role is this resume for?
              </p>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => r.label).filter(
                  (r) => !resumes.some((res) => res.name === r)
                ).map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(selectedRole === role ? null : role)}
                    className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                      selectedRole === role
                        ? "border-[#ef562a] bg-[#ef562a]/10 text-[#ef562a] font-medium"
                        : "border-[var(--card-border)] text-[var(--foreground)] hover:border-[#ef562a]"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload button — only shows after role selected */}
            {selectedRole && (
              <label className="block cursor-pointer mt-3">
                <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[#ef562a] rounded-lg bg-[#ef562a]/5 hover:bg-[#ef562a]/10 transition-colors">
                  <svg className="w-5 h-5 text-[#ef562a]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm font-medium text-[#ef562a]">
                    {uploading ? "Uploading..." : `Upload ${selectedRole} resume (PDF)`}
                  </span>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Plan Awareness Card — shown to free users after resume upload */}
        {goalMet && tier === "free" && (
          <div className="mt-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <p className="text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider mb-3">Your Free Plan</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[var(--gray-50)] border border-[var(--card-border)]">
                <p className="text-xs font-medium text-[var(--gray-600)] mb-1">Free</p>
                <p className="text-lg font-bold text-[var(--foreground)]">5</p>
                <p className="text-[10px] text-[var(--gray-600)]">apps/month</p>
              </div>
              <div className="p-3 rounded-xl bg-[#ef562a]/5 border border-[#ef562a]/20">
                <p className="text-xs font-medium text-[#ef562a] mb-1">Starter</p>
                <p className="text-lg font-bold text-[var(--foreground)]">100</p>
                <p className="text-[10px] text-[var(--gray-600)]">apps/month</p>
                <p className="text-[10px] text-[#ef562a] font-medium mt-0.5">+ tailored resumes</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--gray-50)] border border-[var(--card-border)]">
                <p className="text-xs font-medium text-[var(--gray-600)] mb-1">Pro</p>
                <p className="text-lg font-bold text-[var(--foreground)]">300</p>
                <p className="text-[10px] text-[var(--gray-600)]">apps/month</p>
                <p className="text-[10px] text-[var(--gray-600)] font-medium mt-0.5">+ priority queue</p>
              </div>
            </div>
            <div className="mt-3 text-center">
              <Link href="/pricing" className="text-xs text-[#ef562a] hover:underline">
                Unlock more from day one →
              </Link>
            </div>
          </div>
        )}

        {/* Applications CTA */}
        {resumes.length > 0 && (
          <Link
            href="/profile/applications"
            className="flex items-center justify-between w-full mt-6 px-6 py-4 bg-gradient-to-r from-[#ef562a] to-[#d44a22] text-white rounded-2xl hover:opacity-95 transition-opacity"
          >
            <div>
              <span className="text-lg font-serif">Start Applying to Jobs</span>
              <p className="text-sm text-white/80 mt-0.5">We&apos;ll match you to the best jobs and apply with your strongest resume</p>
            </div>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        )}

        {/* Bottom message */}
        <div className="mt-6 text-center">
          {goalMet ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
              <div className="text-3xl mb-3">&#127881;</div>
              <h3 className="font-serif text-xl text-[var(--foreground)] mb-2">
                You&apos;re all set!
              </h3>
              <p className="text-sm text-[var(--gray-600)]">
                Your resumes are uploaded. Head to the applications page to start applying!
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--gray-600)]">
              Upload {goal - resumeCount} more resume{goal - resumeCount !== 1 ? "s" : ""} to complete this step.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
