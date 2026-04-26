"use client";

import { useState } from "react";
import { ProfileSection } from "./ProfileSection";
import { inputClass, selectClass, labelClass, saveProfileFields } from "./form-utils";

const START_DATE_OPTIONS = [
  "Immediately",
  "In 2 weeks",
  "In 1 month",
  "In 2-3 months",
  "Flexible",
];

interface Props {
  initialData: {
    salaryExpectation: string | null;
    earliestStartDate: string | null;
    seekingInternship: boolean | null;
  };
}

export function JobPreferencesSection({ initialData }: Props) {
  const [salaryExpectation, setSalaryExpectation] = useState(initialData.salaryExpectation || "");
  const [earliestStartDate, setEarliestStartDate] = useState(initialData.earliestStartDate || "");
  const [seekingInternship, setSeekingInternship] = useState(initialData.seekingInternship === true);

  const fields = [salaryExpectation, earliestStartDate];
  const filled = fields.filter((f) => f.trim()).length;

  const handleSave = () =>
    saveProfileFields({
      salaryExpectation: salaryExpectation || null,
      earliestStartDate: earliestStartDate || null,
      seekingInternship,
    });

  return (
    <ProfileSection
      title="Job Preferences"
      description="Salary expectations, availability, and role type"
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      completionCount={{ filled, total: 2 }}
      onSave={handleSave}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Salary Expectation</label>
          <input
            type="text"
            value={salaryExpectation}
            onChange={(e) => setSalaryExpectation(e.target.value)}
            placeholder="e.g., $150,000 - $200,000 or Open to discussion"
            className={inputClass}
          />
          <p className="text-xs text-[var(--gray-600)] mt-1">
            Free text — use a range, a number, or &quot;Open to discussion&quot;
          </p>
        </div>
        <div>
          <label className={labelClass}>Earliest Start Date</label>
          <select
            value={earliestStartDate}
            onChange={(e) => setEarliestStartDate(e.target.value)}
            className={selectClass}
          >
            <option value="">Select availability...</option>
            {START_DATE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl border border-[var(--card-border)] bg-[var(--gray-50)]">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={seekingInternship}
            onChange={(e) => setSeekingInternship(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[#ef562a]"
          />
          <span>
            <span className="block font-semibold">Show me internships only</span>
            <span className="block text-xs text-[var(--gray-600)] mt-1">
              When on, the matcher only sends you Internship, Co-op, and summer-program roles.
              Turn off to receive full-time openings.
            </span>
          </span>
        </label>
      </div>
    </ProfileSection>
  );
}
