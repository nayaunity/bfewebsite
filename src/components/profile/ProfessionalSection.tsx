"use client";

import { useState } from "react";
import { ProfileSection } from "./ProfileSection";
import { inputClass, selectClass, labelClass, saveProfileFields } from "./form-utils";
import { ROLE_OPTIONS } from "@/lib/role-options";

interface Props {
  initialData: {
    currentEmployer: string | null;
    currentTitle: string | null;
    yearsOfExperience: string | null;
    targetRole: string | null;
  };
}

export function ProfessionalSection({ initialData }: Props) {
  const [currentEmployer, setCurrentEmployer] = useState(initialData.currentEmployer || "");
  const [currentTitle, setCurrentTitle] = useState(initialData.currentTitle || "");
  const [yearsOfExperience, setYearsOfExperience] = useState(initialData.yearsOfExperience || "");
  const [targetRole, setTargetRole] = useState(initialData.targetRole || "");

  const fields = [currentEmployer, currentTitle, yearsOfExperience, targetRole];
  const filled = fields.filter((f) => f.trim()).length;

  const handleSave = () =>
    saveProfileFields({
      currentEmployer: currentEmployer || null,
      currentTitle: currentTitle || null,
      yearsOfExperience: yearsOfExperience || null,
      targetRole: targetRole || null,
    });

  return (
    <ProfileSection
      title="Professional Background"
      description="Your work experience and career goals"
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      }
      completionCount={{ filled, total: 4 }}
      onSave={handleSave}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Most Recent Employer</label>
          <input
            type="text"
            value={currentEmployer}
            onChange={(e) => setCurrentEmployer(e.target.value)}
            placeholder="Acme Corp"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Most Recent Title</label>
          <input
            type="text"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            placeholder="Software Engineer"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Years of Experience</label>
          <input
            type="text"
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value)}
            placeholder="5"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Target Role</label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className={selectClass}
          >
            <option value="">Select your target role...</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.label} value={role.label}>
                {role.label}
              </option>
            ))}
          </select>
          {targetRole && (
            <p className="text-xs text-[var(--gray-600)] mt-1">
              {ROLE_OPTIONS.find((r) => r.label === targetRole)?.description}
            </p>
          )}
        </div>
      </div>
    </ProfileSection>
  );
}
