"use client";

import { useCallback, useRef, useState } from "react";

interface CsvUploadResult {
  success: boolean;
  seen: number;
  upserted: number;
  hidden: number;
}

export default function CsvUploadPanel({
  onComplete,
}: {
  onComplete?: (result: CsvUploadResult) => void;
}) {
  const [state, setState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [result, setResult] = useState<CsvUploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setState("uploading");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/referrals/linkedin/csv-upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setState("error");
        setErrorMessage(data.error || "Upload failed");
        return;
      }

      setState("success");
      setResult(data);
      onComplete?.(data);
    } catch {
      setState("error");
      setErrorMessage("Upload failed. Please try again.");
    }
  }, [onComplete]);

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setState("error");
      setErrorMessage("Please upload a .csv file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setState("error");
      setErrorMessage("File too large (max 5 MB)");
      return;
    }
    upload(file);
  }, [upload]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (state === "success" && result) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="text-2xl mb-2">&#10003;</div>
        <p className="font-medium text-green-800">
          {result.upserted} connection{result.upserted !== 1 ? "s" : ""} imported
        </p>
        <p className="text-sm text-green-600 mt-1">
          {result.seen} total found in CSV
          {result.hidden > 0 && ` (${result.hidden} previously hidden)`}
        </p>
        <button
          onClick={() => {
            setState("idle");
            setResult(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="mt-4 text-sm text-green-700 hover:underline"
        >
          Upload another file
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-[#ef562a] bg-[#ef562a]/5"
            : "border-[var(--card-border)] hover:border-[#ef562a]/50"
        } ${state === "uploading" ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
        />

        {state === "uploading" ? (
          <div className="space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-[#ef562a] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--gray-600)]">Importing connections...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl">&#128196;</div>
            <p className="font-medium text-[var(--foreground)]">
              Drop your LinkedIn CSV here or click to browse
            </p>
            <p className="text-sm text-[var(--gray-600)]">
              .csv file, max 5 MB
            </p>
          </div>
        )}
      </div>

      {state === "error" && errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      <div className="rounded-xl bg-[var(--gray-50)] p-4 text-sm text-[var(--gray-600)] space-y-2">
        <p className="font-medium text-[var(--foreground)]">How to export your LinkedIn connections:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Go to LinkedIn Settings &gt; Data Privacy &gt; Get a copy of your data</li>
          <li>Select &quot;Connections&quot; and request the archive</li>
          <li>Download the CSV file when ready (usually takes a few minutes)</li>
          <li>Upload it here</li>
        </ol>
      </div>
    </div>
  );
}
