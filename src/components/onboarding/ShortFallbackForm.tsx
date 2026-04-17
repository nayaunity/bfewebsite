"use client";

import { useState } from "react";
import { ROLE_OPTIONS } from "@/lib/role-options";
import type { ResumeExtraction } from "@/lib/resume-extraction";

interface Props {
  tempId: string | null;
  extraction: ResumeExtraction | null;
  onConfirmed: () => void;
}

const REMOTE_OPTIONS = ["Remote", "Hybrid", "On-site"] as const;

export default function ShortFallbackForm({ tempId, extraction, onConfirmed }: Props) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [remote, setRemote] = useState<typeof REMOTE_OPTIONS[number]>("Remote");
  const [workAuth, setWorkAuth] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(label: string) {
    setSelectedRoles((prev) =>
      prev.includes(label) ? prev.filter((r) => r !== label) : [...prev, label],
    );
  }

  async function submit() {
    setError(null);
    if (selectedRoles.length === 0) { setError("Pick at least one target role."); return; }
    if (workAuth === null) { setError("Answer work authorization."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/confirm-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempId,
          roles: selectedRoles,
          remote,
          workAuth,
          city: extraction?.city ?? null,
          state: extraction?.state ?? null,
          country: extraction?.country ?? "United States",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't save. Try again.");
        setSubmitting(false);
        return;
      }
      onConfirmed();
    } catch {
      setError("Network hiccup. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h1 className="font-serif text-3xl sm:text-4xl">
        We couldn&apos;t read that resume well.
      </h1>
      <p className="mt-3 text-[var(--gray-600)]">
        No worries — three quick questions and we&apos;ll get you set up.
      </p>

      <div className="mt-8 space-y-8">
        <div>
          <label className="block text-sm font-semibold">What roles are you targeting?</label>
          <div className="mt-3 flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((opt) => {
              const on = selectedRoles.includes(opt.label);
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => toggle(opt.label)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    on
                      ? "border-[#ef562a] bg-[#ef562a] text-white"
                      : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[#ef562a]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold">Where do you want to work?</label>
          <div className="mt-3 flex gap-2">
            {REMOTE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setRemote(opt)}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  remote === opt
                    ? "border-[#ef562a] bg-[#ef562a] text-white"
                    : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[#ef562a]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold">Authorized to work in the US?</label>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setWorkAuth(true)}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                workAuth === true
                  ? "border-[#ef562a] bg-[#ef562a] text-white"
                  : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[#ef562a]"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setWorkAuth(false)}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                workAuth === false
                  ? "border-[#ef562a] bg-[#ef562a] text-white"
                  : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[#ef562a]"
              }`}
            >
              No
            </button>
          </div>
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      <div className="mt-10 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="rounded-full bg-[#ef562a] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Finding matches..." : "Show my matches"}
        </button>
      </div>
    </section>
  );
}
