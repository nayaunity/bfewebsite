"use client";

import { useState, ReactNode } from "react";

interface ProfileSectionProps {
  title: string;
  description?: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  completionCount?: { filled: number; total: number };
  onSave?: () => Promise<{ ok: boolean; error?: string }>;
  children: ReactNode;
  hideSave?: boolean;
}

export function ProfileSection({
  title,
  description,
  icon,
  defaultOpen = false,
  completionCount,
  onSave,
  children,
  hideSave,
}: ProfileSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    setSaveState("saving");
    setMessage(null);
    const result = await onSave();
    if (result.ok) {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 3000);
    } else {
      setSaveState("idle");
      setMessage({ type: "error", text: result.error || "Failed to save" });
    }
    setSaving(false);
  };

  const isComplete =
    completionCount &&
    completionCount.filled === completionCount.total &&
    completionCount.total > 0;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-[var(--gray-50)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-[var(--gray-600)] w-5 h-5 flex-shrink-0">
            {icon}
          </span>
          <div className="text-left">
            <h3 className="font-serif text-lg text-[var(--foreground)]">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[var(--gray-600)] mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {completionCount && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isComplete
                  ? "bg-[var(--accent-green-bg)] text-[var(--accent-green-text)]"
                  : "bg-[var(--gray-100)] text-[var(--gray-600)]"
              }`}
            >
              {completionCount.filled}/{completionCount.total}
            </span>
          )}
          <svg
            className={`w-5 h-5 text-[var(--gray-600)] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-[var(--card-border)]">
          <div className="pt-5 space-y-4">{children}</div>

          {!hideSave && onSave && (
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[var(--card-border)]">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 disabled:opacity-50 ${
                  saveState === "saved"
                    ? "bg-green-600 text-white"
                    : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
                }`}
              >
                {saveState === "saving" ? (
                  "Saving..."
                ) : saveState === "saved" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </span>
                ) : (
                  "Save"
                )}
              </button>
              {message && message.type === "error" && (
                <span className="text-sm text-red-500">
                  {message.text}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
