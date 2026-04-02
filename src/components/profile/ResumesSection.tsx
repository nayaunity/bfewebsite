"use client";

import { ProfileSection } from "./ProfileSection";
import { ResumeUpload } from "@/components/ResumeUpload";
import { ResumeManager } from "@/components/ResumeManager";

interface ResumeData {
  id: string;
  name: string;
  fileName: string;
  blobUrl: string;
  keywords: string;
  isFallback: boolean;
  uploadedAt: string;
}

interface Props {
  primaryResume: {
    url: string | null;
    name: string | null;
    updatedAt: string | null;
  };
  resumes: ResumeData[];
  maxResumes: number;
  tier: string;
}

export function ResumesSection({ primaryResume, resumes, maxResumes, tier }: Props) {
  return (
    <ProfileSection
      title="Resumes"
      description="Upload your primary resume and role-specific versions"
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      defaultOpen={!primaryResume.url}
      hideSave
    >
      <div className="-mx-6">
        <ResumeUpload
          initialResume={{
            url: primaryResume.url,
            name: primaryResume.name,
            updatedAt: primaryResume.updatedAt,
          }}
        />
        <ResumeManager
          initialResumes={resumes}
          maxResumes={maxResumes}
          tier={tier}
        />
      </div>
    </ProfileSection>
  );
}
