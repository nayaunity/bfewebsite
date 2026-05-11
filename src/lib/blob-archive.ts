import "server-only";
import { prisma } from "./prisma";

// Soft-delete window. Anything archived this many days ago becomes eligible
// for real deletion by the purge cron. 30 days is the recovery buffer for
// accidental deletes (user mistake, code bug, race condition).
const ARCHIVE_DAYS = 30;

export type ArchiveContext = {
  reason: string;
  userId?: string;
  type: string;
};

/**
 * Stage a Vercel Blob URL for deletion 30 days from now instead of deleting
 * it immediately. The blob itself stays live at the URL until the purge
 * cron (src/app/api/cron/purge-archived-blobs/route.ts) reaches the deadline.
 *
 * Idempotent: re-archiving the same URL refreshes the deadline.
 *
 * Failure isolation: callers can `try {...} catch {}` around this without
 * losing data — the worst case is a permanent orphan blob, which a future
 * sweep can clean up.
 */
export async function archiveBlob(
  url: string,
  ctx: ArchiveContext,
): Promise<void> {
  if (!url) return;
  const scheduledPurgeAt = new Date(
    Date.now() + ARCHIVE_DAYS * 24 * 60 * 60 * 1000,
  );
  await prisma.archivedBlob.upsert({
    where: { url },
    create: {
      url,
      scheduledPurgeAt,
      reason: ctx.reason,
      contextUserId: ctx.userId,
      contextType: ctx.type,
    },
    update: {
      scheduledPurgeAt,
      reason: ctx.reason,
      contextUserId: ctx.userId ?? undefined,
      contextType: ctx.type,
    },
  });
}

/**
 * Cancel a pending archival. Removes the ArchivedBlob row before the purge
 * cron reaches it. Safe to call even if no row exists (deleteMany returns 0).
 */
export async function restoreBlob(url: string): Promise<void> {
  if (!url) return;
  await prisma.archivedBlob.deleteMany({ where: { url } });
}
