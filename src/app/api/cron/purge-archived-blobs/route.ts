import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

// Batch size kept low to stay well under Vercel's 60s window. Each `del` is
// a network call; 500 per run is plenty since we expect <50 archived blobs/day
// at current scale.
const BATCH_SIZE = 500;

/**
 * Daily purge: finds ArchivedBlob rows past their scheduledPurgeAt deadline
 * (typically archived 30 days ago) and calls Vercel Blob `del()` for real.
 *
 * Every production blob deletion in this codebase routes through archiveBlob()
 * which stages a row here. This cron is the ONLY place that calls the raw
 * @vercel/blob `del()`. See src/lib/blob-archive.ts for the staging side.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.archivedBlob.findMany({
    where: { scheduledPurgeAt: { lte: new Date() } },
    take: BATCH_SIZE,
    orderBy: { scheduledPurgeAt: "asc" },
  });

  let blobsDeleted = 0;
  let rowsDeleted = 0;
  let blobErrors = 0;

  for (const row of due) {
    try {
      await del(row.url);
      blobsDeleted++;
    } catch (err) {
      // Blob may already be gone (404). That's fine — still remove the
      // ArchivedBlob row so we don't keep retrying.
      console.error("[purge-archived-blobs] del failed", row.id, err);
      blobErrors++;
    }
    try {
      await prisma.archivedBlob.delete({ where: { id: row.id } });
      rowsDeleted++;
    } catch {
      // Row may have been restored concurrently; tolerate.
    }
  }

  console.log(
    `[purge-archived-blobs] candidates=${due.length} blobsDeleted=${blobsDeleted} rowsDeleted=${rowsDeleted} errors=${blobErrors}`,
  );

  return NextResponse.json({
    candidates: due.length,
    blobsDeleted,
    rowsDeleted,
    blobErrors,
  });
}
