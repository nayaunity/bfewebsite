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

  // Fall back to fallback resume, or the first resume if only one exists
  if (!bestMatch) {
    bestMatch = resumes.find((r) => r.isFallback) || null;
  }
  if (!bestMatch && resumes.length === 1) {
    bestMatch = resumes[0];
  }

  return bestMatch;
}
