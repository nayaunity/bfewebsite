"use client";

import { useRef, useState } from "react";

interface Props {
  onUploaded: (tempId: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ResumeUploadStep({ onUploaded }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Max 5MB.");
      return;
    }

    const form = new FormData();
    form.append("resume", file);

    setUploading(true);
    try {
      const res = await fetch("/api/onboarding/upload-resume", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed. Try again.");
        setUploading(false);
        return;
      }
      onUploaded(data.tempId as string);
    } catch {
      setError("Upload failed. Check your connection and try again.");
      setUploading(false);
    }
  }

  return (
    <section className="text-center">
      <h1 className="font-serif text-3xl sm:text-5xl leading-tight">
        Upload your resume.
        <br />
        <span className="italic text-[#ef562a]">We&apos;ll find you jobs in 10 seconds.</span>
      </h1>
      <p className="mt-4 text-[var(--gray-600)] sm:text-lg">
        We read your resume, match you to thousands of open roles, and apply for you.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (uploading) return;
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`mt-8 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 transition-colors ${
          dragOver
            ? "border-[#ef562a] bg-[var(--accent-blue-bg,#fff4ee)]"
            : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[#ef562a]"
        }`}
      >
        <div className="text-4xl" aria-hidden>📄</div>
        <p className="text-base font-medium">
          {uploading ? "Uploading..." : "Drop your resume here or click to browse"}
        </p>
        <p className="text-sm text-[var(--gray-600)]">PDF, DOC, or DOCX. Max 5MB.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-8 text-xs text-[var(--gray-600)]">
        Don&apos;t have a resume handy? <a href="/auto-apply/get-started?legacy=1" className="underline hover:text-[#ef562a]">Fill out a quick form instead</a>.
      </p>
    </section>
  );
}
