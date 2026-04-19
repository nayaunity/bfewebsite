"use client";

import { useState } from "react";
import Link from "next/link";

interface ReviewFields {
  firstName: string;
  lastName: string;
  phone: string;
  linkedinUrl: string;
  currentTitle: string;
  currentEmployer: string;
  yearsOfExperience: string;
  school: string;
  degree: string;
}

export default function ReviewForm({
  initial,
  firstTime,
}: {
  initial: ReviewFields;
  firstTime: boolean;
}) {
  const [fields, setFields] = useState<ReviewFields>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof ReviewFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not save. Please try again.");
        setSaving(false);
        return;
      }
      window.location.href = "/profile/applications";
    } catch {
      setError("Could not save. Please try again.");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/40";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8 space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First name" value={fields.firstName} onChange={set("firstName")} className={inputClass} />
        <Field label="Last name" value={fields.lastName} onChange={set("lastName")} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone" value={fields.phone} onChange={set("phone")} placeholder="+1 555 555 5555" className={inputClass} />
        <Field label="LinkedIn URL" value={fields.linkedinUrl} onChange={set("linkedinUrl")} placeholder="linkedin.com/in/..." className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Current title" value={fields.currentTitle} onChange={set("currentTitle")} placeholder="Software Engineer" className={inputClass} />
        <Field label="Current employer" value={fields.currentEmployer} onChange={set("currentEmployer")} placeholder="Acme Corp" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Years of experience" value={fields.yearsOfExperience} onChange={set("yearsOfExperience")} placeholder="5" className={inputClass} />
        <div />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="School" value={fields.school} onChange={set("school")} placeholder="University of..." className={inputClass} />
        <Field label="Degree" value={fields.degree} onChange={set("degree")} placeholder="BS Computer Science" className={inputClass} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        {firstTime ? (
          <p className="text-xs text-[var(--gray-600)]">
            We need this confirmed before we start applying.
          </p>
        ) : (
          <Link
            href="/profile/applications"
            className="text-xs text-[var(--gray-600)] underline hover:text-[var(--foreground)]"
          >
            Skip for now
          </Link>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-lg font-medium text-white disabled:opacity-50"
          style={{ background: "#ef562a" }}
        >
          {saving ? "Saving..." : firstTime ? "Looks good. Start applying" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--gray-600)] mb-1">{label}</span>
      <input type="text" value={value} onChange={onChange} placeholder={placeholder} className={className} />
    </label>
  );
}
