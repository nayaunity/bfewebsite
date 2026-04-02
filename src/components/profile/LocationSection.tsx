"use client";

import { useState } from "react";
import { ProfileSection } from "./ProfileSection";
import { inputClass, selectClass, labelClass, US_STATES, REMOTE_OPTIONS, saveProfileFields } from "./form-utils";

interface Props {
  initialData: {
    city: string | null;
    usState: string | null;
    countryOfResidence: string | null;
    workAuthorized: boolean | null;
    needsSponsorship: boolean | null;
    willingToRelocate: boolean | null;
    remotePreference: string | null;
  };
}

function BooleanToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
        <p className="text-xs text-[var(--gray-600)]">{description}</p>
      </div>
      <div className="flex gap-2">
        {[true, false].map((val) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange(val)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              value === val
                ? "bg-[#ef562a] text-white"
                : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
            }`}
          >
            {val ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LocationSection({ initialData }: Props) {
  const [city, setCity] = useState(initialData.city || "");
  const [usState, setUsState] = useState(initialData.usState || "");
  const [countryOfResidence, setCountryOfResidence] = useState(initialData.countryOfResidence || "");
  const [workAuthorized, setWorkAuthorized] = useState<boolean | null>(initialData.workAuthorized);
  const [needsSponsorship, setNeedsSponsorship] = useState<boolean | null>(initialData.needsSponsorship);
  const [willingToRelocate, setWillingToRelocate] = useState<boolean | null>(initialData.willingToRelocate);
  const [remotePreference, setRemotePreference] = useState(initialData.remotePreference || "");

  const fields = [city, usState, countryOfResidence, workAuthorized !== null, needsSponsorship !== null];
  const filled = fields.filter(Boolean).length;

  const handleSave = () =>
    saveProfileFields({
      city: city || null,
      usState: usState || null,
      countryOfResidence: countryOfResidence || null,
      workAuthorized,
      needsSponsorship,
      willingToRelocate,
      remotePreference: remotePreference || null,
    });

  return (
    <ProfileSection
      title="Location & Work Authorization"
      description="Where you're based and your work eligibility"
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      }
      completionCount={{ filled, total: 5 }}
      onSave={handleSave}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Denver"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>U.S. State</label>
          <select
            value={usState}
            onChange={(e) => setUsState(e.target.value)}
            className={selectClass}
          >
            <option value="">Select state...</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Country of Residence</label>
          <input
            type="text"
            value={countryOfResidence}
            onChange={(e) => setCountryOfResidence(e.target.value)}
            placeholder="United States"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Remote Preference</label>
          <select
            value={remotePreference}
            onChange={(e) => setRemotePreference(e.target.value)}
            className={selectClass}
          >
            <option value="">Select preference...</option>
            {REMOTE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <BooleanToggle
          label="Authorized to Work in the U.S."
          description="Are you currently authorized to work in the United States?"
          value={workAuthorized}
          onChange={setWorkAuthorized}
        />
        <BooleanToggle
          label="Need Sponsorship"
          description="Will you require work authorization assistance?"
          value={needsSponsorship}
          onChange={setNeedsSponsorship}
        />
        <BooleanToggle
          label="Willing to Relocate"
          description="Are you open to relocating for a job?"
          value={willingToRelocate}
          onChange={setWillingToRelocate}
        />
      </div>
    </ProfileSection>
  );
}
