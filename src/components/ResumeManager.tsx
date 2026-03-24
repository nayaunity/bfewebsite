"use client";

import { useState, useRef } from "react";

interface Resume {
  id: string;
  name: string;
  fileName: string;
  blobUrl: string;
  keywords: string;
  isFallback: boolean;
  uploadedAt: string | Date;
}

export function ResumeManager({
  initialResumes,
  maxResumes,
  tier,
}: {
  initialResumes: Resume[];
  maxResumes: number;
  tier: string;
}) {
  const [resumes, setResumes] = useState<Resume[]>(initialResumes);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const isUnlimited = maxResumes > 9999;
  const atLimit = !isUnlimited && resumes.length >= maxResumes;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newName.trim()) {
      setError("Please enter a resume name before uploading");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", newName.trim());
      formData.append(
        "keywords",
        JSON.stringify(
          newKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        )
      );

      const res = await fetch("/api/profile/resumes", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResumes([data.resume, ...resumes]);
      setNewName("");
      setNewKeywords("");
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
    <div className="px-6 py-4 border-t border-[var(--card-border)]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-[var(--foreground)]">
          Resumes
        </h3>
        <span className="text-xs text-[var(--gray-600)]">
          {resumes.length} {isUnlimited ? "" : `/ ${maxResumes}`} used
        </span>
      </div>
      <p className="text-xs text-[var(--gray-600)] mb-3">
        Upload role-specific resumes. Add keywords so the system picks the right
        one for each job.
      </p>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Existing resumes */}
      <div className="space-y-2 mb-4">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className="flex items-center gap-3 p-3 bg-[var(--gray-50)] rounded-lg"
          >
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
              className="text-xs text-red-600 hover:text-red-700 flex-shrink-0"
            >
              Delete
            </button>
          </div>
        ))}
        {resumes.length === 0 && (
          <p className="text-sm text-[var(--gray-600)] text-center py-4">
            No resumes uploaded yet
          </p>
        )}
      </div>

      {/* Upload form */}
      {atLimit ? (
        <p className="text-xs text-[var(--gray-600)]">
          Resume limit reached on {tier} plan.{" "}
          <a href="/pricing" className="text-[#ef562a] underline">
            Upgrade
          </a>{" "}
          for more.
        </p>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Resume name (e.g. Software Engineer)"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)]"
          />
          <input
            type="text"
            value={newKeywords}
            onChange={(e) => setNewKeywords(e.target.value)}
            placeholder="Keywords, comma-separated (e.g. software engineer, backend, full stack)"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)]"
          />
          <label className="block cursor-pointer">
            <div className="flex items-center justify-center p-4 border-2 border-dashed border-[var(--card-border)] rounded-lg hover:border-[var(--gray-400)] transition-colors">
              <span className="text-sm text-[var(--gray-600)]">
                {uploading ? "Uploading..." : "Click to upload PDF"}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={uploading || !newName.trim()}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}
