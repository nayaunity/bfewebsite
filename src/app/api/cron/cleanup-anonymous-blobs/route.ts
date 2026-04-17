import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

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

  let deletedBlobs = 0;
  let deletedRows = 0;
  let blobErrors = 0;

  for (const temp of stale) {
    if (temp.resumeBlobUrl) {
      try {
        await del(temp.resumeBlobUrl);
        deletedBlobs++;
      } catch (err) {
        console.error("cleanup-anonymous-blobs del failed", temp.id, err);
        blobErrors++;
      }
    }
    try {
      await prisma.tempOnboarding.delete({ where: { id: temp.id } });
      deletedRows++;
    } catch {
      // Ignore — row may have been linked concurrently.
    }
  }

  console.log(
    `[cleanup-anonymous-blobs] candidates=${stale.length} blobsDeleted=${deletedBlobs} rowsDeleted=${deletedRows} errors=${blobErrors}`,
  );

  return NextResponse.json({
    candidates: stale.length,
    blobsDeleted: deletedBlobs,
    rowsDeleted: deletedRows,
    blobErrors,
  });
}
