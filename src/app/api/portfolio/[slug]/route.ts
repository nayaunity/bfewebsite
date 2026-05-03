import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const portfolio = await prisma.portfolio.findUnique({
    where: { slug },
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
      assets: {
        select: { section: true, blobUrl: true },
      },
    },
  });

  if (!portfolio || !portfolio.isPublished) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: `${portfolio.user.firstName || ""} ${portfolio.user.lastName || ""}`.trim(),
    headline: portfolio.headline,
    bio: portfolio.bio,
    sections: portfolio.sections ? JSON.parse(portfolio.sections) : null,
    colorPalette: portfolio.colorPalette ? JSON.parse(portfolio.colorPalette) : null,
    heroImageUrl: portfolio.heroImageUrl,
    assets: portfolio.assets,
    themeId: portfolio.themeId,
  });
}
