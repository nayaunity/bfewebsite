import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// POST /api/profile/resume - Upload resume
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF or Word document." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Get current user to check for existing resume
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { resumeUrl: true },
    });

    // Delete old resume if exists
    if (currentUser?.resumeUrl) {
      try {
        await del(currentUser.resumeUrl);
      } catch {
        // Ignore deletion errors for old files
      }
    }

    // Upload to Vercel Blob
    const blob = await put(`resumes/${session.user.id}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Update user record
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        resumeUrl: blob.url,
        resumeName: file.name,
        resumeUpdatedAt: new Date(),
      },
      select: {
        resumeUrl: true,
        resumeName: true,
        resumeUpdatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      resume: {
        url: user.resumeUrl,
        name: user.resumeName,
        updatedAt: user.resumeUpdatedAt,
      },
    });
  } catch (error) {
    console.error("Error uploading resume:", error);
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/resume - Delete resume
export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { resumeUrl: true },
    });

    if (user?.resumeUrl) {
      try {
        await del(user.resumeUrl);
      } catch {
        // Ignore deletion errors
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        resumeUrl: null,
        resumeName: null,
        resumeUpdatedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting resume:", error);
    return NextResponse.json(
      { error: "Failed to delete resume" },
      { status: 500 }
    );
  }
}
