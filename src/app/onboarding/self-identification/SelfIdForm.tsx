"use client";

import { useMemo, useState } from "react";
import {
  GENDER_OPTIONS,
  RACE_OPTIONS,
  YES_NO_DECLINE,
  VETERAN_OPTIONS,
  DISABILITY_OPTIONS,
  PRONOUN_OPTIONS,
} from "@/lib/eeo-options";

export interface SelfIdInitial {
  gender: string;
  race: string;
  hispanicOrLatino: string;
  veteranStatus: string;
  disabilityStatus: string;
  pronouns: string;
  workAuthorized: boolean | null;
  needsSponsorship: boolean | null;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#4d1b27]/40";
const labelClass = "block text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider mb-1";

function pronounChoiceFromStored(stored: string): string {
  if (!stored) return "";
  if ((PRONOUN_OPTIONS as readonly string[]).includes(stored) && stored !== "Other") return stored;
  return "Other";
}

export default function SelfIdForm({
  initial,
  nextUrl,
}: {
  initial: SelfIdInitial;
  nextUrl: string;
}) {
  const [gender, setGender] = useState(initial.gender);
  const [race, setRace] = useState(initial.race);
  const [hispanicOrLatino, setHispanic] = useState(initial.hispanicOrLatino);
  const [veteranStatus, setVeteran] = useState(initial.veteranStatus);
  const [disabilityStatus, setDisability] = useState(initial.disabilityStatus);

  const [pronounChoice, setPronounChoice] = useState(pronounChoiceFromStored(initial.pronouns));
  const [pronounsCustom, setPronounsCustom] = useState(
    pronounChoice === "Other" ? initial.pronouns : ""
  );

  const [workAuthorized, setWorkAuthorized] = useState<boolean | null>(initial.workAuthorized);
  const [needsSponsorship, setNeedsSponsorship] = useState<boolean | null>(initial.needsSponsorship);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allFilled = useMemo(() => {
    if (!gender || !race || !hispanicOrLatino || !veteranStatus || !disabilityStatus) return false;
    if (!pronounChoice) return false;
    if (pronounChoice === "Other" && pronounsCustom.trim().length === 0) return false;
    if (workAuthorized === null || needsSponsorship === null) return false;
    return true;
  }, [
    gender,
    race,
    hispanicOrLatino,
    veteranStatus,
    disabilityStatus,
    pronounChoice,
    pronounsCustom,
    workAuthorized,
    needsSponsorship,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allFilled || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/self-identification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender,
          race,
          hispanicOrLatino,
          veteranStatus,
          disabilityStatus,
          pronouns: pronounChoice,
          pronounsCustom: pronounChoice === "Other" ? pronounsCustom.trim() : undefined,
          workAuthorized,
          needsSponsorship,
        }),
      });
      if (!res.ok) {
        setError("Couldn't save. Please try again.");
        setSaving(false);
        return;
      }
      window.location.href = nextUrl;
    } catch {
      setError("Couldn't save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8 space-y-5"
    >
      <div className="bg-[var(--accent-blue-bg)] text-[var(--accent-blue-text)] text-xs rounded-lg px-3 py-2 leading-relaxed">
        Used to pre-fill the EEO and work-authorization sections that almost every job application asks for.
        You can pick &quot;Prefer not to say&quot; on the demographic questions if you&apos;d rather.
        Work authorization needs a real answer because most companies hard-filter on it.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
            <option value="">Select...</option>
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Race / Ethnicity</label>
          <select value={race} onChange={(e) => setRace(e.target.value)} className={inputClass}>
            <option value="">Select...</option>
            {RACE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Hispanic or Latino</label>
          <select
            value={hispanicOrLatino}
            onChange={(e) => setHispanic(e.target.value)}
            className={inputClass}
          >
            <option value="">Select...</option>
            {YES_NO_DECLINE.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Veteran Status</label>
          <select
            value={veteranStatus}
            onChange={(e) => setVeteran(e.target.value)}
            className={inputClass}
          >
            <option value="">Select...</option>
            {VETERAN_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Disability Status</label>
          <select
            value={disabilityStatus}
            onChange={(e) => setDisability(e.target.value)}
            className={inputClass}
          >
            <option value="">Select...</option>
            {DISABILITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Pronouns</label>
          <select
            value={pronounChoice}
            onChange={(e) => {
              setPronounChoice(e.target.value);
              if (e.target.value !== "Other") setPronounsCustom("");
            }}
            className={inputClass}
          >
            <option value="">Select...</option>
            {PRONOUN_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "Other" ? "Other (type below)" : opt}
              </option>
            ))}
          </select>
        </div>
        {pronounChoice === "Other" && (
          <div>
            <label className={labelClass}>Your pronouns</label>
            <input
              type="text"
              value={pronounsCustom}
              onChange={(e) => setPronounsCustom(e.target.value)}
              placeholder="e.g. xe/xem"
              maxLength={50}
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="border-t border-[var(--card-border)] pt-5 space-y-4">
        <p className="text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider">
          Work authorization
        </p>

        <div>
          <label className={labelClass}>Are you legally authorized to work in the United States?</label>
          <div className="flex gap-2">
            <YesNoButton
              active={workAuthorized === true}
              onClick={() => setWorkAuthorized(true)}
              label="Yes"
            />
            <YesNoButton
              active={workAuthorized === false}
              onClick={() => setWorkAuthorized(false)}
              label="No"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Will you now or in the future require sponsorship for employment visa status (e.g. H-1B)?
          </label>
          <div className="flex gap-2">
            <YesNoButton
              active={needsSponsorship === true}
              onClick={() => setNeedsSponsorship(true)}
              label="Yes"
            />
            <YesNoButton
              active={needsSponsorship === false}
              onClick={() => setNeedsSponsorship(false)}
              label="No"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <p className="text-xs text-[var(--gray-600)]">
          We need this filled in before we start applying.
        </p>
        <button
          type="submit"
          disabled={!allFilled || saving}
          className="px-6 py-2.5 rounded-lg font-medium text-white disabled:opacity-50"
          style={{ background: "#4d1b27" }}
        >
          {saving ? "Saving..." : "Save and start applying"}
        </button>
      </div>
    </form>
  );
}

function YesNoButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors " +
        (active
          ? "border-[var(--accent)] bg-[#4d1b27] text-white"
          : "border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--accent)]/60")
      }
    >
      {label}
    </button>
  );
}
