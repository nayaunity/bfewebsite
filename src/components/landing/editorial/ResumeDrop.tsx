"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function ResumeDrop({
  theme = "light",
  compact = false,
}: {
  theme?: "light" | "dark";
  compact?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const isDark = theme === "dark";

  const handleFile = async (file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a PDF or Word document.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("resume", file);
      const res = await fetch("/api/onboarding/upload-resume", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Upload failed. Please try again.");
        setUploading(false);
        return;
      }
      router.push(`/start?tempId=${data.tempId}`);
    } catch {
      setError("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`cursor-pointer transition-all ${uploading ? "pointer-events-none opacity-70" : ""}`}
      style={{
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
        border: `1.5px dashed ${dragging ? "#4d1b27" : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
        borderRadius: 16,
        padding: compact ? "20px 22px" : "28px 28px",
        backdropFilter: "blur(8px)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex-shrink-0 grid place-items-center"
          style={{ background: "#4d1b27", color: "#fff" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold text-base"
            style={{ color: isDark ? "#fff" : "#2a2828" }}
          >
            Drop your resume to get matched
          </div>
          <div
            className="text-[13px] mt-0.5"
            style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)" }}
          >
            PDF or DOCX. We'll match you to 50+ open roles in 8 seconds.
          </div>
        </div>
        <button
          className="flex-shrink-0 px-5 py-2.5 rounded-full font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ background: "#4d1b27", color: "#fff" }}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-600 text-center">{error}</div>
      )}
    </div>
  );
}
