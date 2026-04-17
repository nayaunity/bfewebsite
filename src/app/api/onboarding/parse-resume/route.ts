import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractResume } from "@/lib/resume-extraction";

export const runtime = "nodejs";
export const maxDuration = 60;

const COOKIE_NAME = "bfe_temp_id";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tempId = (body.tempId as string | undefined) ?? request.cookies.get(COOKIE_NAME)?.value;

    if (!tempId) {
      return NextResponse.json({ error: "Missing tempId" }, { status: 400 });
    }

    const temp = await prisma.tempOnboarding.findUnique({ where: { id: tempId } });
    if (!temp || !temp.resumeBlobUrl) {
      return NextResponse.json({ error: "Resume not found for this session" }, { status: 404 });
    }

    if (temp.linkedToUserId) {
      return NextResponse.json({ error: "Onboarding already completed" }, { status: 410 });
    }

    if (temp.extractedData) {
      return NextResponse.json({ extraction: JSON.parse(temp.extractedData) });
    }

    const blobResponse = await fetch(temp.resumeBlobUrl);
    if (!blobResponse.ok) {
      return NextResponse.json({ error: "Could not fetch uploaded resume" }, { status: 502 });
    }

    const arrayBuffer = await blobResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extraction = await extractResume(buffer);

    await prisma.tempOnboarding.update({
      where: { id: tempId },
      data: {
        extractedData: JSON.stringify(extraction),
        extractedEmail: extraction.email,
      },
    });

    return NextResponse.json({ extraction });
  } catch (error) {
    console.error("parse-resume error", error);
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}
