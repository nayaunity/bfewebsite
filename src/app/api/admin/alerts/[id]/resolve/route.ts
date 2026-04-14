import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.adminAlert.update({
    where: { id },
    data: { resolvedAt: new Date() },
  });

  return NextResponse.json({ resolved: true });
}
