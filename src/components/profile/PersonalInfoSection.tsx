"use client";

import { useState } from "react";
import { ProfileSection } from "./ProfileSection";
import { inputClass, selectClass, labelClass, PRONOUNS_OPTIONS, saveProfileFields } from "./form-utils";

interface Props {
  initialData: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    preferredName: string | null;
    pronouns: string | null;
  };
}

export function PersonalInfoSection({ initialData }: Props) {
  const [firstName, setFirstName] = useState(initialData.firstName || "");
  const [lastName, setLastName] = useState(initialData.lastName || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [preferredName, setPreferredName] = useState(initialData.preferredName || "");
  const [pronouns, setPronouns] = useState(initialData.pronouns || "");

  const fields = [firstName, lastName, phone];
  const filled = fields.filter((f) => f.trim()).length;

  const handleSave = () =>
    saveProfileFields({
      firstName,
      lastName,
      phone,
      preferredName: preferredName || null,
      pronouns: pronouns || null,
    });

  return (
    <ProfileSection
      title="Personal Information"
      description="Your name and contact details for applications"
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      }
      defaultOpen={true}
      completionCount={{ filled, total: 3 }}
      onSave={handleSave}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>First Name *</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Last Name *</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Phone *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Preferred Name</label>
          <input
            type="text"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder="Optional nickname"
            className={inputClass}
          />
        </div>
      </div>

      <div className="max-w-xs">
        <label className={labelClass}>Pronouns</label>
        <select
          value={pronouns}
          onChange={(e) => setPronouns(e.target.value)}
          className={selectClass}
        >
          <option value="">Select pronouns...</option>
          {PRONOUNS_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </ProfileSection>
  );
}
