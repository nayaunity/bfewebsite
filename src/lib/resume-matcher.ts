import "server-only";
import { prisma } from "./prisma";

interface MatchedResume {
  id: string;
  name: string;
  blobUrl: string;
  fileName: string;
  isFallback: boolean;
}

/**
 * Find the best matching resume for a job.
 *
 * Priority:
 * 1. Exact role match — resume.name matches the user's selected targetRole
 * 2. Keyword match — resume keywords appear in the job title
 * 3. Fallback resume — marked isFallback
 * 4. Single resume — only one exists
 */
export async function matchUserResume(
  userId: string,
  jobTitle: string,
  targetRole?: string
): Promise<MatchedResume | null> {
  const resumes = await prisma.userResume.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      blobUrl: true,
      fileName: true,
      keywords: true,
      isFallback: true,
    },
  });

  if (resumes.length === 0) {
    // Fall back to legacy single resume if no UserResume records exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { resumeUrl: true, resumeName: true },
    });
    if (user?.resumeUrl) {
      return {
        id: "legacy",
        name: user.resumeName || "Resume",
        blobUrl: user.resumeUrl,
        fileName: user.resumeName || "resume.pdf",
        isFallback: true,
      };
    }
    return null;
  }

  // 1. Exact role match — resume name matches the selected target role
  if (targetRole) {
    // Support both plain string and JSON array
    let roles: string[] = [];
    try {
      const parsed = JSON.parse(targetRole);
      if (Array.isArray(parsed)) roles = parsed;
    } catch { /* not JSON */ }
    if (roles.length === 0) roles = [targetRole];

    for (const role of roles) {
      const roleNorm = role.toLowerCase().trim();
      const roleMatch = resumes.find(
        (r) => !r.isFallback && r.name.toLowerCase().trim() === roleNorm
      );
      if (roleMatch) return roleMatch;
    }
  }

  // 2. Keyword match — resume keywords appear in the job title
  const title = jobTitle.toLowerCase();
  let bestMatch: MatchedResume | null = null;
  let bestScore = 0;

  for (const resume of resumes) {
    if (resume.isFallback) continue;

    const keywords: string[] = JSON.parse(resume.keywords || "[]");
    let score = 0;
    for (const keyword of keywords) {
      if (title.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = resume;
    }
  }

  if (bestMatch) return bestMatch;

  // 3. Name-contains match — resume name words appear in the job title
  for (const resume of resumes) {
    if (resume.isFallback) continue;
    const nameWords = resume.name.toLowerCase().split(/\s+/);
    const matches = nameWords.filter((w) => w.length > 2 && title.includes(w));
    if (matches.length >= 2) {
      return resume;
    }
  }

  // 4. Fallback resume
  const fallback = resumes.find((r) => r.isFallback) || null;
  if (fallback) return fallback;

  // 5. Single resume
  if (resumes.length === 1) return resumes[0];

  return null;
}
