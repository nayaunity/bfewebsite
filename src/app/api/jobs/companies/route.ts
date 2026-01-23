import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get distinct companies from active jobs
    const companies = await prisma.job.findMany({
      where: { isActive: true },
      select: {
        company: true,
        companySlug: true,
      },
      distinct: ["companySlug"],
      orderBy: { company: "asc" },
    });

    return NextResponse.json({
      companies: companies.map((c) => ({
        name: c.company,
        slug: c.companySlug,
      })),
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies", companies: [] },
      { status: 500 }
    );
  }
}
