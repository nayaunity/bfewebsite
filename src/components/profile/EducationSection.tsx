"use client";

import { useState } from "react";
import { ProfileSection } from "./ProfileSection";
import { inputClass, textareaClass, labelClass, saveProfileFields } from "./form-utils";

interface Props {
  initialData: {
    school: string | null;
    degree: string | null;
    graduationYear: string | null;
    additionalCerts: string | null;
  };
}

export function EducationSection({ initialData }: Props) {
  const [school, setSchool] = useState(initialData.school || "");
  const [degree, setDegree] = useState(initialData.degree || "");
  const [graduationYear, setGraduationYear] = useState(initialData.graduationYear || "");
  const [additionalCerts, setAdditionalCerts] = useState(initialData.additionalCerts || "");

  const fields = [school, degree];
  const filled = fields.filter((f) => f.trim()).length;

  const handleSave = () =>
    saveProfileFields({
      school: school || null,
      degree: degree || null,
      graduationYear: graduationYear || null,
      additionalCerts: additionalCerts || null,
    });

  return (
    <ProfileSection
      title="Education"
      description="Your academic background"
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      }
      completionCount={{ filled, total: 2 }}
      onSave={handleSave}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>School / University</label>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="University of Colorado Boulder"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Degree</label>
          <input
            type="text"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="B.S. Computer Science"
            className={inputClass}
          />
        </div>
      </div>

      <div className="max-w-xs">
        <label className={labelClass}>Graduation Year</label>
        <input
          type="text"
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
          placeholder="2020"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Additional Certifications</label>
        <textarea
          value={additionalCerts}
          onChange={(e) => setAdditionalCerts(e.target.value)}
          placeholder="e.g., Full Stack Software Engineering Certificate, Flatiron School (2020)"
          className={textareaClass}
          rows={2}
        />
      </div>
    </ProfileSection>
  );
}
