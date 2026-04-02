"use client";

import { useState } from "react";
import { ProfileSection } from "./ProfileSection";
import { textareaClass, labelClass, saveProfileFields } from "./form-utils";

const ANSWER_FIELDS = [
  { key: "tellMeAboutYourself", label: "Tell me about yourself", placeholder: "A concise overview of your background, skills, and what you bring..." },
  { key: "whyThisRole", label: "Why are you interested in this role?", placeholder: "What draws you to this type of work and how your experience aligns..." },
  { key: "whyThisCompany", label: "Why are you interested in this company?", placeholder: "What excites you about the company, its mission, or products..." },
  { key: "greatestStrength", label: "What is your greatest strength?", placeholder: "Your standout skill or quality, with a concrete example..." },
  { key: "greatestWeakness", label: "What is your greatest weakness?", placeholder: "A real area of growth and what you've done to improve..." },
  { key: "whyLeaving", label: "Why are you leaving your current role?", placeholder: "Your motivation for the next step in your career..." },
  { key: "technicalChallenge", label: "Describe a technical challenge you solved", placeholder: "A specific problem, your approach, and the outcome..." },
  { key: "managementStyle", label: "What is your management / leadership style?", placeholder: "How you lead, motivate, and support a team..." },
  { key: "conflictResolution", label: "How do you handle conflict at work?", placeholder: "Your approach to resolving disagreements with colleagues..." },
  { key: "whatMakesYouUnique", label: "What makes you unique?", placeholder: "What sets you apart from other candidates..." },
  { key: "whereDoYouSeeYourself", label: "Where do you see yourself in 5 years?", placeholder: "Your career vision and how this role fits into it..." },
  { key: "howDoYouHandleFailure", label: "How do you handle failure?", placeholder: "A time you failed and what you learned from it..." },
  { key: "diversityAndInclusion", label: "What does diversity & inclusion mean to you?", placeholder: "Your perspective on DEI and how you contribute to inclusive environments..." },
  { key: "howDoYouStayCurrent", label: "How do you stay current in your field?", placeholder: "How you keep your skills sharp and stay up to date..." },
];

interface Props {
  initialData: {
    applicationAnswers: string | null;
  };
}

export function ApplicationAnswersSection({ initialData }: Props) {
  const parsed: Record<string, string> = (() => {
    try {
      return initialData.applicationAnswers
        ? JSON.parse(initialData.applicationAnswers)
        : {};
    } catch {
      return {};
    }
  })();

  const [answers, setAnswers] = useState<Record<string, string>>(
    ANSWER_FIELDS.reduce(
      (acc, field) => ({ ...acc, [field.key]: parsed[field.key] || "" }),
      {} as Record<string, string>
    )
  );

  const filled = ANSWER_FIELDS.filter((f) => answers[f.key]?.trim()).length;

  const updateAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const nonEmpty: Record<string, string> = {};
    for (const [key, val] of Object.entries(answers)) {
      if (val.trim()) nonEmpty[key] = val.trim();
    }
    return saveProfileFields({
      applicationAnswers: Object.keys(nonEmpty).length > 0 ? JSON.stringify(nonEmpty) : null,
    });
  };

  return (
    <ProfileSection
      title="Application Answers"
      description="Pre-fill common application questions — these get used when auto-applying"
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      completionCount={{ filled, total: ANSWER_FIELDS.length }}
      onSave={handleSave}
    >
      <div className="bg-[var(--accent-orange-bg)] text-[var(--accent-orange-text)] text-xs rounded-lg px-3 py-2">
        These answers are used to auto-fill free-form questions on job applications. Write them in first person as you&apos;d want them to appear on an application.
      </div>

      <div className="space-y-5">
        {ANSWER_FIELDS.map((field) => (
          <div key={field.key}>
            <label className={labelClass}>{field.label}</label>
            <textarea
              value={answers[field.key]}
              onChange={(e) => updateAnswer(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={textareaClass}
              rows={3}
            />
          </div>
        ))}
      </div>
    </ProfileSection>
  );
}
