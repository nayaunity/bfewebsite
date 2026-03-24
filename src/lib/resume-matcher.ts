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
 * Find the best matching resume for a job title from a user's uploaded resumes.
 */
export async function matchUserResume(
  userId: string,
  jobTitle: string
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

  if (resumes.length === 0) return null;

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

  // Fall back to fallback resume if no keyword match
  if (!bestMatch) {
    bestMatch = resumes.find((r) => r.isFallback) || null;
  }

  return bestMatch;
}
