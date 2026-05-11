import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { archiveBlob } from "@/lib/blob-archive";

export const runtime = "nodejs";
export const maxDuration = 60;

const STALE_AFTER_DAYS = 7;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const stale = await prisma.tempOnboarding.findMany({
    where: {
      linkedToUserId: null,
      createdAt: { lt: cutoff },
      resumeBlobUrl: { not: null },
    },
    select: { id: true, resumeBlobUrl: true },
  });

  let blobsArchived = 0;
  let rowsDeleted = 0;
  let blobErrors = 0;

  for (const temp of stale) {
    if (temp.resumeBlobUrl) {
      try {
        await archiveBlob(temp.resumeBlobUrl, {
          reason: "anonymous_onboarding_stale",
          type: "anonymous_resume",
        });
        blobsArchived++;
      } catch (err) {
        console.error("cleanup-anonymous-blobs archive failed", temp.id, err);
        blobErrors++;
      }
    }
    try {
      await prisma.tempOnboarding.delete({ where: { id: temp.id } });
      rowsDeleted++;
    } catch {
      // Ignore — row may have been linked concurrently.
    }
  }

  console.log(
    `[cleanup-anonymous-blobs] candidates=${stale.length} blobsArchived=${blobsArchived} rowsDeleted=${rowsDeleted} errors=${blobErrors}`,
  );

  return NextResponse.json({
    candidates: stale.length,
    blobsArchived,
    rowsDeleted,
    blobErrors,
  });
}
