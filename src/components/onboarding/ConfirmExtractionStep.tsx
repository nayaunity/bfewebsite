"use client";

import { useMemo, useState } from "react";
import { ROLE_OPTIONS } from "@/lib/role-options";
import type { ResumeExtraction } from "@/lib/resume-extraction";

interface Props {
  extraction: ResumeExtraction;
  tempId: string | null;
  onConfirmed: () => void;
}

const REMOTE_OPTIONS = ["Remote", "Hybrid", "On-site"] as const;

export default function ConfirmExtractionStep({ extraction, tempId, onConfirmed }: Props) {
  const defaultRoles = useMemo(() => {
    const valid = extraction.inferredTargetRoles.filter((r) =>
      ROLE_OPTIONS.some((opt) => opt.label === r),
    );
    return valid.length > 0 ? valid : [];
  }, [extraction.inferredTargetRoles]);

  const [selectedRoles, setSelectedRoles] = useState<string[]>(defaultRoles);
  const [remote, setRemote] = useState<typeof REMOTE_OPTIONS[number]>("Remote");
  const [workAuth, setWorkAuth] = useState<boolean | null>(
    extraction.hasUSWorkHistory ? true : null,
  );
  const [city, setCity] = useState(extraction.city ?? "");
  const [state, setState] = useState(extraction.state ?? "");
  const [country, setCountry] = useState(extraction.country ?? "United States");

  // Default-on if the resume looks like a current student: future graduation
  // year OR low YoE (under 2). User can still uncheck.
  const currentYear = new Date().getFullYear();
  const looksLikeStudent =
    (extraction.graduationYear !== null && extraction.graduationYear >= currentYear) ||
    (typeof extraction.yearsOfExperience === "number" && extraction.yearsOfExperience < 2);
  const [seekingInternship, setSeekingInternship] = useState<boolean>(looksLikeStudent);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRole(label: string) {
    setSelectedRoles((prev) =>
      prev.includes(label) ? prev.filter((r) => r !== label) : [...prev, label],
    );
  }

  async function submit() {
    setError(null);
    if (selectedRoles.length === 0) { setError("Pick at least one target role."); return; }
    if (workAuth === null) { setError("Let us know about work authorization."); return; }

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
          city: city.trim() || null,
          state: state.trim() || null,
          country: country.trim() || null,
          seekingInternship,
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

  const displayName = extraction.firstName ?? "there";

  return (
    <section>
      <h1 className="font-serif text-3xl sm:text-4xl">
        Nice to meet you, <span className="italic text-[#ef562a]">{displayName}</span>.
      </h1>
      <p className="mt-3 text-[var(--gray-600)]">
        We pulled a few things from your resume. Confirm these and we&apos;ll show you matched jobs.
      </p>

      {extraction.confidence === "medium" && (
        <p className="mt-3 rounded-xl bg-[var(--gray-50)] px-3 py-2 text-sm text-[var(--gray-600)]">
          Something off? Edit anything below.
        </p>
      )}

      <div className="mt-8 space-y-8">
        <div>
          <label className="block text-sm font-semibold">What kind of roles are you targeting?</label>
          <p className="mt-1 text-xs text-[var(--gray-600)]">Pick all that apply.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((opt) => {
              const on = selectedRoles.includes(opt.label);
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => toggleRole(opt.label)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
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
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  remote === opt
                    ? "border-[#ef562a] bg-[#ef562a] text-white"
                    : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[#ef562a]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {remote !== "Remote" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>

        <div>
          <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[var(--card-border)] bg-[var(--gray-50)] px-4 py-3">
            <input
              type="checkbox"
              checked={seekingInternship}
              onChange={(e) => setSeekingInternship(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#ef562a]"
            />
            <span>
              <span className="block text-sm font-semibold">I&apos;m only looking for internships</span>
              <span className="block text-xs text-[var(--gray-600)] mt-1">
                Turn this on if you&apos;re a student looking for summer or co-op roles. We&apos;ll skip full-time openings.
              </span>
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold">Are you authorized to work in the US?</label>
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
          className="rounded-full bg-[#ef562a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#d84a21] disabled:opacity-60"
        >
          {submitting ? "Finding matches..." : "Show my matches"}
        </button>
      </div>
    </section>
  );
}
