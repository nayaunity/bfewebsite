import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      slug: true,
      status: true,
      generationLog: true,
      errorMessage: true,
      headline: true,
      isPublished: true,
      lastGeneratedAt: true,
    },
  });

  if (!portfolio) {
    return NextResponse.json({ exists: false });
  }

  const log = portfolio.generationLog ? JSON.parse(portfolio.generationLog) : [];
  const currentStep = log.length > 0 ? log[log.length - 1].step : null;

  return NextResponse.json({
    exists: true,
    id: portfolio.id,
    slug: portfolio.slug,
    status: portfolio.status,
    currentStep,
    errorMessage: portfolio.errorMessage,
    headline: portfolio.headline,
    isPublished: portfolio.isPublished,
    lastGeneratedAt: portfolio.lastGeneratedAt,
  });
}
