import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const COOKIE_NAME = "bfe_temp_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Please upload a PDF or Word document." },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 413 }
      );
    }

    const existingTempId = request.cookies.get(COOKIE_NAME)?.value;
    const existing = existingTempId
      ? await prisma.tempOnboarding.findUnique({ where: { id: existingTempId } })
      : null;

    const blob = await put(`anonymous/resumes/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    let tempId: string;
    if (existing && !existing.linkedToUserId) {
      tempId = existing.id;
      await prisma.tempOnboarding.update({
        where: { id: tempId },
        data: {
          resumeBlobUrl: blob.url,
          resumeName: file.name,
          extractedData: null,
          extractedEmail: null,
        },
      });
    } else {
      const created = await prisma.tempOnboarding.create({
        data: {
          data: "{}",
          resumeBlobUrl: blob.url,
          resumeName: file.name,
        },
      });
      tempId = created.id;
    }

    const response = NextResponse.json({ success: true, tempId, resumeName: file.name });
    response.cookies.set(COOKIE_NAME, tempId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("upload-resume error", error);
    return NextResponse.json({ error: "Failed to upload resume" }, { status: 500 });
  }
}
