import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

interface ResumeProfile {
  name: string;
  file: string;
  matchKeywords: string[];
  fallback?: boolean;
  description: string;
}

const RESUMES_CONFIG = resolve(__dirname, "../job-assets/resumes.json");
const JOB_ASSETS_DIR = resolve(__dirname, "../job-assets");

function loadResumes(): ResumeProfile[] {
  const raw = readFileSync(RESUMES_CONFIG, "utf-8");
  return JSON.parse(raw);
}

function matchResume(
  jobTitle: string,
  resumes: ResumeProfile[]
): ResumeProfile | null {
  const title = jobTitle.toLowerCase();

  // Score each resume by how many keywords match
  let bestMatch: ResumeProfile | null = null;
  let bestScore = 0;

  for (const resume of resumes) {
    if (resume.fallback) continue;

    let score = 0;
    for (const keyword of resume.matchKeywords) {
      if (title.includes(keyword.toLowerCase())) {
        // Longer keyword matches are worth more (more specific)
        score += keyword.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = resume;
    }
  }

  // If no keyword match, use fallback if one exists
  if (!bestMatch) {
    bestMatch = resumes.find((r) => r.fallback) || null;
  }

  return bestMatch;
}

// CLI usage: npx tsx scripts/match-resume.ts "Software Engineer"
const jobTitle = process.argv[2];

if (!jobTitle) {
  // If no arg, output the full config for the skill to read
  const resumes = loadResumes();
  const result = resumes.map((r) => {
    const fullPath = resolve(JOB_ASSETS_DIR, r.file);
    return {
      ...r,
      fullPath,
      exists: existsSync(fullPath),
    };
  });
  console.log(JSON.stringify(result, null, 2));
} else {
  const resumes = loadResumes();
  const match = matchResume(jobTitle, resumes);

  if (match) {
    const fullPath = resolve(JOB_ASSETS_DIR, match.file);
    const exists = existsSync(fullPath);
    console.log(
      JSON.stringify({
        matched: true,
        resume: match.name,
        file: fullPath,
        exists,
        description: match.description,
        isFallback: !!match.fallback,
      })
    );
  } else {
    console.log(JSON.stringify({ matched: false, reason: "No matching resume and no fallback configured" }));
  }
}
