import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ counts: {} });
  }

  const connections = await prisma.linkedInConnection.findMany({
    where: {
      userId: session.user.id,
      status: "active",
      companySlug: { not: null },
    },
    select: { companySlug: true },
  });

  const counts: Record<string, number> = {};
  for (const conn of connections) {
    if (conn.companySlug) {
      counts[conn.companySlug] = (counts[conn.companySlug] || 0) + 1;
    }
  }

  return NextResponse.json({ counts });
}
