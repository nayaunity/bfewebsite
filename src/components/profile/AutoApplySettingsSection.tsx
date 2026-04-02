"use client";

import { useState } from "react";
import { ProfileSection } from "./ProfileSection";
import { UsageMeter } from "@/components/UsageMeter";
import { saveProfileFields } from "./form-utils";

interface Props {
  initialData: {
    autoApplyEnabled: boolean;
    hasResume: boolean;
  };
  usage: { used: number; limit: number };
}

export function AutoApplySettingsSection({ initialData, usage }: Props) {
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(initialData.autoApplyEnabled);

  const handleSave = () => saveProfileFields({ autoApplyEnabled });

  return (
    <ProfileSection
      title="Auto-Apply Settings"
      description="Configure automatic job applications"
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
      onSave={handleSave}
    >
      <div className="flex items-center justify-between py-2">
        <div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            Daily Auto-Apply
          </span>
          <p className="text-xs text-[var(--gray-600)]">
            Automatically apply to new jobs each day
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAutoApplyEnabled(!autoApplyEnabled)}
          disabled={!initialData.hasResume}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            autoApplyEnabled
              ? "bg-[#ef562a]"
              : "bg-[var(--gray-200)]"
          } ${!initialData.hasResume ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              autoApplyEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {!initialData.hasResume && (
        <p className="text-xs text-[var(--gray-600)]">
          Upload your resume in the Resumes section above to enable auto-apply.
        </p>
      )}

      <div className="pt-2 border-t border-[var(--card-border)]">
        <UsageMeter used={usage.used} limit={usage.limit} />
      </div>
    </ProfileSection>
  );
}
