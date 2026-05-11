import "server-only";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

/**
 * Server component that detects a broken resume state for the current user
 * and renders a red banner asking them to re-upload. "Broken state" means:
 *  - The user has a resumeUrl on file, but a HEAD request returns 404 or
 *    other non-200 (the blob was deleted but the DB wasn't updated), OR
 *  - The user has at least one UserResume row but every blob URL is dead.
 *
 * Returns null if everything is healthy or if the user has never uploaded
 * (in that case the existing onboarding/empty-state UI handles the prompt).
 *
 * Reason this exists: on May 7 a user's resume blob was deleted (by the old
 * destructive-before-commit upload flow) but the DB kept pointing at it.
 * She kept seeing applications go out as "applied" for two days while the
 * worker was actually uploading 15 bytes of garbage. This banner makes the
 * state impossible to miss.
 */
export async function ResumeHealthBanner({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      resumeUrl: true,
      resumes: { select: { blobUrl: true } },
    },
  });
  if (!user) return null;

  // Build candidate URLs: prefer UserResume rows (newer model), fall back to
  // legacy resumeUrl. If both are absent the user hasn't uploaded yet, which
  // isn't the failure mode this banner is for.
  const candidateUrls = user.resumes.map((r) => r.blobUrl);
  if (user.resumeUrl && !candidateUrls.includes(user.resumeUrl)) {
    candidateUrls.push(user.resumeUrl);
  }
  if (candidateUrls.length === 0) return null;

  const aliveCount = await countAlive(candidateUrls);
  if (aliveCount > 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm">
      <div className="flex items-start gap-3">
        <div className="text-red-600 font-semibold mt-0.5">!</div>
        <div className="flex-1">
          <div className="font-semibold text-red-900">
            Your resume isn&apos;t loading anymore
          </div>
          <div className="mt-1 text-red-800">
            The file we have on our end can&apos;t be retrieved. Applications
            are paused until you re-upload. The bug that caused this is fixed,
            but we still need a fresh upload from you.
          </div>
          <Link
            href="#roles-and-resumes"
            className="mt-3 inline-block rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Re-upload resume
          </Link>
        </div>
      </div>
    </div>
  );
}

async function countAlive(urls: string[]): Promise<number> {
  const checks = await Promise.all(
    urls.map(async (url) => {
      try {
        const r = await fetch(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
          cache: "no-store",
        });
        return r.ok;
      } catch {
        return false;
      }
    }),
  );
  return checks.filter(Boolean).length;
}
