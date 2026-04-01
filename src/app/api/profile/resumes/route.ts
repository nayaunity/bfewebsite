import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";
import { getMaxResumes } from "@/lib/subscription";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resumes = await prisma.userResume.findMany({
    where: { userId: session.user.id },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ resumes });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check tier limit
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionTier: true, _count: { select: { resumes: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const maxResumes = Math.max(getMaxResumes(user.subscriptionTier || "free"), 3);
  if (user._count.resumes >= maxResumes) {
    return NextResponse.json(
      {
        error: `Resume limit reached. Your ${user.subscriptionTier} plan allows ${maxResumes} resume(s). Upgrade to add more.`,
      },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string | null;
  const keywords = formData.get("keywords") as string | null;

  if (!file || !name) {
    return NextResponse.json(
      { error: "File and name are required" },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File must be under 5MB" },
      { status: 400 }
    );
  }

  try {
    const blob = await put(
      `resumes/${session.user.id}/${file.name}`,
      file,
      { access: "public", addRandomSuffix: true }
    );

    const resume = await prisma.userResume.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        fileName: file.name,
        blobUrl: blob.url,
        keywords: keywords || "[]",
      },
    });

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload resume" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Resume ID required" }, { status: 400 });
  }

  const resume = await prisma.userResume.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  try {
    await del(resume.blobUrl);
  } catch {
    // Blob may already be deleted
  }

  await prisma.userResume.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
