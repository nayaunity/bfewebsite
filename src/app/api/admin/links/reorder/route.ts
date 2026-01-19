import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/admin";

// POST /api/admin/links/reorder - Reorder links
export async function POST(request: NextRequest) {
  const { isAdmin } = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { linkIds } = await request.json();

    if (!Array.isArray(linkIds)) {
      return NextResponse.json(
        { error: "linkIds must be an array" },
        { status: 400 }
      );
    }

    // Update each link's order based on its position in the array
    await Promise.all(
      linkIds.map((id: string, index: number) =>
        prisma.link.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering links:", error);
    return NextResponse.json(
      { error: "Failed to reorder links" },
      { status: 500 }
    );
  }
}
