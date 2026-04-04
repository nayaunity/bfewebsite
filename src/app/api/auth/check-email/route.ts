import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, passwordHash: true, firstName: true },
    });

    if (!user) {
      return NextResponse.json({ status: "new" });
    }

    if (user.passwordHash) {
      return NextResponse.json({ status: "has_password", firstName: user.firstName });
    }

    return NextResponse.json({ status: "needs_password", firstName: user.firstName });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
