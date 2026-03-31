import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const active = await prisma.browseSession.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["queued", "processing"] },
    },
  });

  if (!active) {
    return NextResponse.json({ error: "No active session" }, { status: 404 });
  }

  await prisma.browseSession.update({
    where: { id: active.id },
    data: {
      status: "failed",
      errorMessage: "Stopped by user",
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, sessionId: active.id });
}
