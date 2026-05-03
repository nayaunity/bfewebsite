import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    include: {
      assets: {
        select: { id: true, section: true, blobUrl: true },
      },
    },
  });

  if (!portfolio) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    portfolio: {
      id: portfolio.id,
      slug: portfolio.slug,
      status: portfolio.status,
      themeId: portfolio.themeId,
      headline: portfolio.headline,
      bio: portfolio.bio,
      sections: portfolio.sections ? JSON.parse(portfolio.sections) : null,
      colorPalette: portfolio.colorPalette ? JSON.parse(portfolio.colorPalette) : null,
      heroImageUrl: portfolio.heroImageUrl,
      isPublished: portfolio.isPublished,
      publishedAt: portfolio.publishedAt,
      lastGeneratedAt: portfolio.lastGeneratedAt,
      assets: portfolio.assets,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
  });

  if (!portfolio) {
    return NextResponse.json({ error: "No portfolio found" }, { status: 404 });
  }

  const body = await req.json();
  const allowed: Record<string, unknown> = {};

  if (typeof body.headline === "string") allowed.headline = body.headline;
  if (typeof body.bio === "string") allowed.bio = body.bio;
  if (typeof body.isPublished === "boolean") {
    allowed.isPublished = body.isPublished;
    if (body.isPublished && !portfolio.publishedAt) {
      allowed.publishedAt = new Date();
    }
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  allowed.updatedAt = new Date();

  const updated = await prisma.portfolio.update({
    where: { id: portfolio.id },
    data: allowed,
  });

  return NextResponse.json({ success: true, portfolio: { id: updated.id, slug: updated.slug } });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
  });

  if (!portfolio) {
    return NextResponse.json({ error: "No portfolio found" }, { status: 404 });
  }

  await prisma.portfolio.delete({ where: { id: portfolio.id } });

  return NextResponse.json({ success: true });
}
