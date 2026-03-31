import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, message, type, page } = await request.json();

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    if (title.length > 200 || message.length > 2000) {
      return NextResponse.json({ error: "Title or message too long" }, { status: 400 });
    }

    const validTypes = ["bug", "feature", "question"];
    const ticketType = validTypes.includes(type) ? type : "bug";

    const ticket = await prisma.ticket.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        message: message.trim(),
        type: ticketType,
        page: page?.trim() || null,
      },
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Ticket creation error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status required" }, { status: 400 });
    }

    const validStatuses = ["new", "in-progress", "done"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Ticket update error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
