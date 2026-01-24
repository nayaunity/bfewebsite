"use client";

import { useState, useRef } from "react";

interface ResumeUploadProps {
  initialResume?: {
    url: string | null;
    name: string | null;
    updatedAt: Date | null;
  };
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ResumeUpload({ initialResume }: ResumeUploadProps) {
  const [resume, setResume] = useState(initialResume);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/profile/resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload resume");
      }

      setResume({
        url: data.resume.url,
        name: data.resume.name,
        updatedAt: new Date(data.resume.updatedAt),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload resume");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your resume?")) return;

    setError(null);
    setUploading(true);

    try {
      const response = await fetch("/api/profile/resume", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete resume");
      }

      setResume({ url: null, name: null, updatedAt: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete resume");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="px-6 py-4 border-t border-[var(--card-border)]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-[var(--foreground)]">Resume</h3>
        {resume?.url && (
          <button
            onClick={handleDelete}
            disabled={uploading}
            className="text-xs text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
      <p className="text-xs text-[var(--gray-600)] mb-3">
        By submitting, you agree to have your resume shared with hiring partners.
      </p>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {resume?.url ? (
        <div className="flex items-center gap-3 p-3 bg-[var(--gray-50)] rounded-lg">
          <div className="flex-shrink-0 w-10 h-10 bg-[var(--background)] rounded-lg flex items-center justify-center border border-[var(--card-border)]">
            <svg className="w-5 h-5 text-[var(--gray-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <a
              href={resume.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--foreground)] hover:underline truncate block"
            >
              {resume.name || "Resume"}
            </a>
            {resume.updatedAt && (
              <p className="text-xs text-[var(--gray-600)]">
                Uploaded {formatDate(resume.updatedAt)}
              </p>
            )}
          </div>
          <a
            href={resume.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      ) : (
        <label className="block cursor-pointer">
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--card-border)] rounded-lg hover:border-[var(--gray-400)] transition-colors">
            {uploading ? (
              <div className="flex items-center gap-2 text-[var(--gray-600)]">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">Uploading...</span>
              </div>
            ) : (
              <>
                <svg className="w-8 h-8 text-[var(--gray-400)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-[var(--gray-600)]">
                  Click to upload your resume
                </span>
                <span className="text-xs text-[var(--gray-400)] mt-1">
                  PDF or Word document, max 5MB
                </span>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}

      {/* Replace button when resume exists */}
      {resume?.url && (
        <label className="block mt-3 cursor-pointer">
          <span className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors">
            {uploading ? "Uploading..." : "Replace with a new file"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
