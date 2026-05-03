import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIER_LIMITS } from "@/lib/stripe";
import { extractResumeText } from "@/lib/resume-extraction";
import { generatePortfolioContent } from "@/lib/portfolio-generator";
import { generateMultipleImages } from "@/lib/luma";

export const maxDuration = 300;

function slugify(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let attempt = 0;
  while (true) {
    const existing = await prisma.portfolio.findUnique({ where: { slug } });
    if (!existing) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      resumeUrl: true,
      subscriptionTier: true,
      portfolio: { select: { id: true, lastGeneratedAt: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const tier = user.subscriptionTier || "free";
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  if (!limits.portfolioEnabled) {
    return NextResponse.json(
      { error: "Portfolio generation requires a Starter or Pro subscription." },
      { status: 403 }
    );
  }

  if (!user.resumeUrl) {
    return NextResponse.json(
      { error: "Please upload a resume before generating your portfolio." },
      { status: 400 }
    );
  }

  const portfolio = user.portfolio;
  if (portfolio) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const regenCount = await prisma.portfolio.count({
      where: {
        userId: user.id,
        lastGeneratedAt: { gte: monthStart },
      },
    });
    if (regenCount >= limits.portfolioRegenerationsPerMonth) {
      return NextResponse.json(
        { error: "Monthly regeneration limit reached." },
        { status: 429 }
      );
    }
  }

  const slug = portfolio
    ? (await prisma.portfolio.findUnique({ where: { id: portfolio.id }, select: { slug: true } }))!.slug
    : await uniqueSlug(slugify(user.firstName || "user", user.lastName || "portfolio"));

  const portfolioId = portfolio?.id ?? undefined;

  const record = await prisma.portfolio.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      slug,
      status: "generating",
      generationLog: JSON.stringify([{ step: "started", ts: Date.now() }]),
      updatedAt: new Date(),
    },
    update: {
      status: "generating",
      errorMessage: null,
      generationLog: JSON.stringify([{ step: "started", ts: Date.now() }]),
      updatedAt: new Date(),
    },
  });

  // Run the pipeline without awaiting the response (fire-and-forget)
  // The client polls /api/portfolio/status for progress
  runPipeline(record.id, user.id, user.resumeUrl!, user.firstName || "", user.lastName || "").catch(
    (err) => console.error("Portfolio pipeline error:", err)
  );

  return NextResponse.json({ portfolioId: record.id, slug: record.slug, status: "generating" });
}

async function appendLog(portfolioId: string, step: string) {
  const current = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: { generationLog: true },
  });
  const log = current?.generationLog ? JSON.parse(current.generationLog) : [];
  log.push({ step, ts: Date.now() });
  await prisma.portfolio.update({
    where: { id: portfolioId },
    data: { generationLog: JSON.stringify(log), updatedAt: new Date() },
  });
}

async function runPipeline(
  portfolioId: string,
  userId: string,
  resumeUrl: string,
  firstName: string,
  lastName: string
) {
  try {
    // Step 1: Download and extract resume text
    await appendLog(portfolioId, "extracting_resume");
    const resumeRes = await fetch(resumeUrl);
    if (!resumeRes.ok) throw new Error("Failed to download resume");
    const resumeBuffer = Buffer.from(await resumeRes.arrayBuffer());
    const resumeText = await extractResumeText(resumeBuffer);
    if (resumeText.length < 100) {
      throw new Error("Resume text too short for portfolio generation.");
    }

    // Step 2: Generate content with Claude
    await appendLog(portfolioId, "generating_content");
    const userName = `${firstName} ${lastName}`.trim() || "User";
    const content = await generatePortfolioContent(resumeText, userName);

    // Step 3: Generate images with Luma
    await appendLog(portfolioId, "generating_images");

    // Delete old assets if regenerating
    await prisma.portfolioAsset.deleteMany({ where: { portfolioId } });

    const imageResults = await generateMultipleImages(
      content.imagePrompts.map((p) => ({
        prompt: p.prompt,
        section: p.section,
        aspectRatio: p.aspectRatio,
      })),
      userId
    );

    // Save assets
    for (const img of imageResults) {
      await prisma.portfolioAsset.create({
        data: {
          portfolioId,
          section: img.section,
          blobUrl: img.blobUrl,
          prompt: img.prompt,
          lumaJobId: img.lumaJobId,
        },
      });
    }

    // Step 4: Assemble portfolio
    await appendLog(portfolioId, "assembling");

    const heroAsset = imageResults.find((r) => r.section === "hero");

    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        status: "ready",
        headline: content.headline,
        bio: content.bio,
        sections: JSON.stringify({
          experience: content.experience,
          skills: content.skills,
          education: content.education,
        }),
        colorPalette: JSON.stringify(content.colorPalette),
        heroImageUrl: heroAsset?.blobUrl || null,
        lastGeneratedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await appendLog(portfolioId, "complete");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Portfolio generation failed for ${portfolioId}:`, message);
    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        status: "error",
        errorMessage: message,
        updatedAt: new Date(),
      },
    });
    await appendLog(portfolioId, "error");
  }
}
