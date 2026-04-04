import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No session", session: null });
    }

    // Try the same query the profile page does
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        createdAt: true,
        role: true,
        firstName: true,
        subscriptionTier: true,
        resumes: {
          orderBy: { uploadedAt: "desc" },
          select: { id: true, name: true },
        },
        _count: { select: { progress: true, microWins: true } },
      },
    });

    return NextResponse.json({
      session: { id: session.user.id, email: session.user.email },
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
    });
  } catch (error) {
    const err = error instanceof Error ? { message: error.message, stack: error.stack } : String(error);
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
