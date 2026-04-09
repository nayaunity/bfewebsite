import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Save wizard data before auth redirect (no auth required)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const temp = await prisma.tempOnboarding.create({
      data: { data: JSON.stringify(data) },
    });

    return NextResponse.json({ tempId: temp.id });
  } catch (error) {
    console.error("[temp-save] POST error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

// GET: Retrieve wizard data by tempId (called by OnboardingSync after auth)
export async function GET(request: NextRequest) {
  const tempId = request.nextUrl.searchParams.get("tempId");

  if (!tempId) {
    return NextResponse.json({ error: "Missing tempId" }, { status: 400 });
  }

  try {
    const temp = await prisma.tempOnboarding.findUnique({
      where: { id: tempId },
    });

    if (!temp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete after read (one-time use)
    await prisma.tempOnboarding.delete({ where: { id: tempId } }).catch(() => {});

    return NextResponse.json({ data: JSON.parse(temp.data) });
  } catch (error) {
    console.error("[temp-save] GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve" }, { status: 500 });
  }
}
