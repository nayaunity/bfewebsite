import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PortfolioClient } from "./PortfolioClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const portfolio = await prisma.portfolio.findUnique({
    where: { slug },
    select: {
      headline: true,
      heroImageUrl: true,
      isPublished: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });

  if (!portfolio) {
    return { title: "Portfolio Not Found" };
  }

  const name = `${portfolio.user.firstName || ""} ${portfolio.user.lastName || ""}`.trim();

  return {
    title: `${name} | Portfolio`,
    description: portfolio.headline || `${name}'s professional portfolio`,
    openGraph: {
      title: `${name} | Portfolio`,
      description: portfolio.headline || `${name}'s professional portfolio`,
      images: portfolio.heroImageUrl ? [portfolio.heroImageUrl] : [],
    },
  };
}

export default async function PortfolioSlugPage({ params }: Props) {
  const { slug } = await params;

  const portfolio = await prisma.portfolio.findUnique({
    where: { slug },
    include: {
      user: { select: { firstName: true, lastName: true } },
      assets: { select: { section: true, blobUrl: true } },
    },
  });

  if (!portfolio || !portfolio.isPublished) {
    notFound();
  }

  const name = `${portfolio.user.firstName || ""} ${portfolio.user.lastName || ""}`.trim();
  const sections = portfolio.sections ? JSON.parse(portfolio.sections) : {};
  const colorPalette = portfolio.colorPalette
    ? JSON.parse(portfolio.colorPalette)
    : { primary: "#6b21a8", secondary: "#2563eb", accent: "#8b5cf6" };

  const assetMap: Record<string, string> = {};
  for (const a of portfolio.assets) {
    assetMap[a.section] = a.blobUrl;
  }

  return (
    <PortfolioClient
      name={name}
      headline={portfolio.headline || ""}
      bio={portfolio.bio || ""}
      experience={sections.experience || []}
      skills={sections.skills || []}
      education={sections.education || []}
      colorPalette={colorPalette}
      heroImageUrl={portfolio.heroImageUrl}
      assets={assetMap}
      slug={slug}
    />
  );
}
