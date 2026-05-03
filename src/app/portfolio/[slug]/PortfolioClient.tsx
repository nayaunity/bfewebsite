"use client";

import { PortfolioHero } from "@/components/portfolio/sections/PortfolioHero";
import { BioSection } from "@/components/portfolio/sections/BioSection";
import { ExperienceTimeline } from "@/components/portfolio/sections/ExperienceTimeline";
import { SkillsCloud } from "@/components/portfolio/sections/SkillsCloud";
import { EducationSection } from "@/components/portfolio/sections/EducationSection";
import { ContactFooter } from "@/components/portfolio/sections/ContactFooter";
import { PortfolioViewTracker } from "@/components/portfolio/PortfolioViewTracker";

interface PortfolioClientProps {
  name: string;
  headline: string;
  bio: string;
  experience: { title: string; company: string; duration: string; description: string }[];
  skills: { category: string; items: string[] }[];
  education: { degree: string; school: string; year: string }[];
  colorPalette: { primary: string; secondary: string; accent: string };
  heroImageUrl?: string | null;
  assets: Record<string, string>;
  slug: string;
}

export function PortfolioClient({
  name,
  headline,
  bio,
  experience,
  skills,
  education,
  colorPalette,
  heroImageUrl,
  assets,
  slug,
}: PortfolioClientProps) {
  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white" style={{ colorScheme: "dark" }}>
      <PortfolioViewTracker slug={slug} title={`${name}'s Portfolio`} />

      <PortfolioHero
        name={name}
        headline={headline}
        heroImageUrl={heroImageUrl}
        colorPalette={colorPalette}
      />

      {bio && <BioSection bio={bio} colorPalette={colorPalette} />}

      {experience.length > 0 && (
        <ExperienceTimeline
          experience={experience}
          colorPalette={colorPalette}
          sectionImage={assets.experience}
        />
      )}

      {skills.length > 0 && (
        <SkillsCloud
          skills={skills}
          colorPalette={colorPalette}
          sectionImage={assets.skills}
        />
      )}

      {education.length > 0 && (
        <EducationSection
          education={education}
          colorPalette={colorPalette}
        />
      )}

      <ContactFooter name={name} colorPalette={colorPalette} />
    </div>
  );
}
