"use client";

import { useState } from "react";
import { ProfileSection } from "./ProfileSection";
import { inputClass, labelClass, saveProfileFields } from "./form-utils";

interface Props {
  initialData: {
    linkedinUrl: string | null;
    githubUrl: string | null;
    websiteUrl: string | null;
  };
}

export function OnlinePresenceSection({ initialData }: Props) {
  const [linkedinUrl, setLinkedinUrl] = useState(initialData.linkedinUrl || "");
  const [githubUrl, setGithubUrl] = useState(initialData.githubUrl || "");
  const [websiteUrl, setWebsiteUrl] = useState(initialData.websiteUrl || "");

  const fields = [linkedinUrl];
  const filled = fields.filter((f) => f.trim()).length;

  const handleSave = () =>
    saveProfileFields({
      linkedinUrl: linkedinUrl || null,
      githubUrl: githubUrl || null,
      websiteUrl: websiteUrl || null,
    });

  return (
    <ProfileSection
      title="Online Presence"
      description="Your professional profiles and portfolio"
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      }
      completionCount={{ filled, total: 1 }}
      onSave={handleSave}
    >
      <div>
        <label className={labelClass}>LinkedIn URL</label>
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/in/yourname"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>GitHub URL</label>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/yourname"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Website / Portfolio</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yoursite.com"
            className={inputClass}
          />
        </div>
      </div>
    </ProfileSection>
  );
}
