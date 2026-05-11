import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { archiveBlob } from "@/lib/blob-archive";
import { logError } from "@/lib/error-logger";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// POST /api/profile/resume - Upload resume
//
// Order matters: upload new blob FIRST, commit DB SECOND, archive old blob
// LAST. If put() or update() throws, the old blob is still live at its
// existing URL and the user can keep working until they retry. Reversing
// this order is the bug that lost Kimberly's resume on May 7-8.
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF or Word document." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { resumeUrl: true },
    });
    const oldUrl = currentUser?.resumeUrl ?? null;

    // 1. Upload new blob FIRST. If this throws, old blob is untouched.
    let blob;
    try {
      blob = await put(`resumes/${userId}/${file.name}`, file, {
        access: "public",
        addRandomSuffix: true,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      await logError({
        userId,
        endpoint: "/api/profile/resume",
        method: "POST",
        status: 500,
        error: "Resume blob upload failed",
        detail,
      });
      return NextResponse.json(
        { error: "Failed to upload resume. Please try again." },
        { status: 500 }
      );
    }

    // 2. Commit DB SECOND. If this throws, the new blob is orphaned (the
    // archive cron will not touch it because it's not staged), and the old
    // blob is still live and pointed to from the DB.
    let user;
    try {
      user = await prisma.user.update({
        where: { id: userId },
        data: {
          resumeUrl: blob.url,
          resumeName: file.name,
          resumeUpdatedAt: new Date(),
        },
        select: { resumeUrl: true, resumeName: true, resumeUpdatedAt: true },
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      await logError({
        userId,
        endpoint: "/api/profile/resume",
        method: "POST",
        status: 500,
        error: "Resume DB update failed after successful blob upload",
        detail,
      });
      return NextResponse.json(
        { error: "Failed to save resume. Please try again." },
        { status: 500 }
      );
    }

    // 3. Archive old blob LAST. Failure here just orphans a blob for the
    // future archive sweep; nothing user-visible breaks.
    if (oldUrl) {
      try {
        await archiveBlob(oldUrl, {
          reason: "user_replaced_resume",
          userId,
          type: "user_resume",
        });
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        await logError({
          userId,
          endpoint: "/api/profile/resume",
          method: "POST",
          status: 200,
          error: "Failed to archive previous resume blob (replacement succeeded)",
          detail,
        });
      }
    }

    return NextResponse.json({
      success: true,
      resume: {
        url: user.resumeUrl,
        name: user.resumeName,
        updatedAt: user.resumeUpdatedAt,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    await logError({
      userId,
      endpoint: "/api/profile/resume",
      method: "POST",
      status: 500,
      error: "Unexpected resume upload failure",
      detail,
    });
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/resume - Delete resume
//
// Order matters: null the DB row FIRST, then archive the blob. If archive
// throws, the user is already in the "no resume" state per the DB, and the
// blob just lingers until manual cleanup. The user is never left with a
// stale `resumeUrl` pointing to a deleted blob.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { resumeUrl: true },
    });
    const oldUrl = user?.resumeUrl ?? null;

    await prisma.user.update({
      where: { id: userId },
      data: { resumeUrl: null, resumeName: null, resumeUpdatedAt: null },
    });

    if (oldUrl) {
      try {
        await archiveBlob(oldUrl, {
          reason: "user_deleted_resume",
          userId,
          type: "user_resume",
        });
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        await logError({
          userId,
          endpoint: "/api/profile/resume",
          method: "DELETE",
          status: 200,
          error: "Failed to archive deleted resume blob (DB already nulled)",
          detail,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    await logError({
      userId,
      endpoint: "/api/profile/resume",
      method: "DELETE",
      status: 500,
      error: "Resume delete failed",
      detail,
    });
    return NextResponse.json(
      { error: "Failed to delete resume" },
      { status: 500 }
    );
  }
}
