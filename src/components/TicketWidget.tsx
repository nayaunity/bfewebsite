"use client";

import { useState } from "react";

export function TicketWidget({ page }: { page: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bug" | "feature" | "question">("bug");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, type, page }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTitle("");
        setMessage("");
        setTimeout(() => {
          setSubmitted(false);
          setOpen(false);
        }, 2000);
      }
    } catch {} finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-[var(--foreground)] text-[var(--background)] rounded-full shadow-lg hover:opacity-90 transition-all text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Feedback
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)] bg-[var(--gray-50)]">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Send Feedback</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {submitted ? (
        <div className="px-4 py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">Thanks for your feedback!</p>
          <p className="text-xs text-[var(--gray-600)] mt-1">We&apos;ll review it shortly.</p>
        </div>
      ) : (
        <div className="px-4 py-3 space-y-3">
          {/* Type selector */}
          <div className="flex gap-2">
            {([
              { value: "bug", label: "Bug", icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              { value: "feature", label: "Feature", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
              { value: "question", label: "Question", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            ] as const).map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  type === t.value
                    ? "border-[#ef562a] bg-[#ef562a]/5 text-[#ef562a]"
                    : "border-[var(--card-border)] text-[var(--gray-600)] hover:border-[var(--gray-200)]"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                </svg>
                {t.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <input
            type="text"
            placeholder="Brief summary..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a]"
          />

          {/* Message */}
          <textarea
            placeholder="Describe the issue or idea..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/30 focus:border-[#ef562a] resize-none"
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !message.trim()}
            className="w-full py-2 text-sm font-medium rounded-lg bg-[#ef562a] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
}
