import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/links - Get active links for public pages
export async function GET() {
  try {
    const links = await prisma.link.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        category: true,
        featured: true,
        image: true,
      },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 }
    );
  }
}
