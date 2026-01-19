import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/admin";

// GET /api/admin/links - List all links
export async function GET() {
  const { isAdmin } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await prisma.link.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(links);
}

// POST /api/admin/links - Create new link
export async function POST(request: NextRequest) {
  const { isAdmin } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Get the highest order value to add new link at the end
    const lastLink = await prisma.link.findFirst({
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastLink?.order ?? -1) + 1;

    const link = await prisma.link.create({
      data: {
        title: body.title,
        description: body.description || null,
        url: body.url,
        category: body.category || null,
        featured: body.featured || false,
        image: body.image || null,
        order: nextOrder,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 }
    );
  }
}
