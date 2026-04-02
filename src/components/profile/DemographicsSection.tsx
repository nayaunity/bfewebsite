"use client";

import { useState } from "react";
import { ProfileSection } from "./ProfileSection";
import { selectClass, labelClass, saveProfileFields } from "./form-utils";

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
];

const RACE_OPTIONS = [
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Hispanic or Latino",
  "Native Hawaiian or Other Pacific Islander",
  "White",
  "Two or More Races",
  "Prefer not to say",
];

const YES_NO_DECLINE = ["Yes", "No", "Prefer not to say"];

const VETERAN_OPTIONS = [
  "I am not a protected veteran",
  "I identify as one or more of the classifications of a protected veteran",
  "Prefer not to say",
];

const DISABILITY_OPTIONS = [
  "Yes, I have a disability (or previously had a disability)",
  "No, I do not have a disability",
  "Prefer not to say",
];

interface Props {
  initialData: {
    gender: string | null;
    race: string | null;
    hispanicOrLatino: string | null;
    veteranStatus: string | null;
    disabilityStatus: string | null;
  };
}

export function DemographicsSection({ initialData }: Props) {
  const [gender, setGender] = useState(initialData.gender || "");
  const [race, setRace] = useState(initialData.race || "");
  const [hispanicOrLatino, setHispanicOrLatino] = useState(initialData.hispanicOrLatino || "");
  const [veteranStatus, setVeteranStatus] = useState(initialData.veteranStatus || "");
  const [disabilityStatus, setDisabilityStatus] = useState(initialData.disabilityStatus || "");

  const fields = [gender, race, hispanicOrLatino, veteranStatus, disabilityStatus];
  const filled = fields.filter((f) => f.trim()).length;

  const handleSave = () =>
    saveProfileFields({
      gender: gender || null,
      race: race || null,
      hispanicOrLatino: hispanicOrLatino || null,
      veteranStatus: veteranStatus || null,
      disabilityStatus: disabilityStatus || null,
    });

  return (
    <ProfileSection
      title="Demographics"
      description="Voluntary self-identification — used for EEO compliance on applications. You can select 'Prefer not to say' for any field."
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      completionCount={{ filled, total: 5 }}
      onSave={handleSave}
    >
      <div className="bg-[var(--accent-blue-bg)] text-[var(--accent-blue-text)] text-xs rounded-lg px-3 py-2">
        These questions are voluntary and used only to pre-fill Equal Employment Opportunity (EEO) forms on job applications. Your answers will never affect your experience on this platform.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={selectClass}
          >
            <option value="">Select...</option>
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Race / Ethnicity</label>
          <select
            value={race}
            onChange={(e) => setRace(e.target.value)}
            className={selectClass}
          >
            <option value="">Select...</option>
            {RACE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Hispanic or Latino</label>
          <select
            value={hispanicOrLatino}
            onChange={(e) => setHispanicOrLatino(e.target.value)}
            className={selectClass}
          >
            <option value="">Select...</option>
            {YES_NO_DECLINE.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Veteran Status</label>
          <select
            value={veteranStatus}
            onChange={(e) => setVeteranStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">Select...</option>
            {VETERAN_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Disability Status</label>
          <select
            value={disabilityStatus}
            onChange={(e) => setDisabilityStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">Select...</option>
            {DISABILITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
    </ProfileSection>
  );
}
