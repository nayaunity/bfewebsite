import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get distinct companies from active jobs
    const jobs = await prisma.job.findMany({
      where: { isActive: true },
      select: {
        company: true,
        companySlug: true,
      },
      distinct: ["company"],
      orderBy: { company: "asc" },
    });

    // Deduplicate by company name and normalize slugs (remove trailing dashes)
    const seen = new Set<string>();
    const companies = jobs
      .filter((c) => {
        const key = c.company.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((c) => ({
        name: c.company,
        slug: c.companySlug.replace(/-+$/, ""), // Remove trailing dashes
      }));

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies", companies: [] },
      { status: 500 }
    );
  }
}
