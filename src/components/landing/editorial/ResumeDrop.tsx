"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResumeDrop({
  theme = "light",
  compact = false,
}: {
  theme?: "light" | "dark";
  compact?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const isDark = theme === "dark";

  const handleFile = () => {
    router.push("/auto-apply/get-started");
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
        handleFile();
      }}
      onClick={() => inputRef.current?.click()}
      className="cursor-pointer transition-all"
      style={{
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
        border: `1.5px dashed ${dragging ? "#ef562a" : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
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
          if (e.target.files?.[0]) handleFile();
        }}
      />
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex-shrink-0 grid place-items-center"
          style={{ background: "#ef562a", color: "#fff" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold text-base"
            style={{ color: isDark ? "#fff" : "#1a1a1a" }}
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
          style={{ background: "#ef562a", color: "#fff" }}
        >
          Upload
        </button>
      </div>
    </div>
  );
}
