import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ROLE_OPTIONS } from "@/lib/role-options";

export const runtime = "nodejs";

const COOKIE_NAME = "bfe_temp_id";
const VALID_ROLES = new Set(ROLE_OPTIONS.map((r) => r.label));
const VALID_REMOTE = new Set(["Remote", "Hybrid", "On-site"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tempId = (body.tempId as string | undefined) ?? request.cookies.get(COOKIE_NAME)?.value;
    if (!tempId) {
      return NextResponse.json({ error: "Missing tempId" }, { status: 400 });
    }

    const temp = await prisma.tempOnboarding.findUnique({ where: { id: tempId } });
    if (!temp || temp.linkedToUserId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const rolesRaw = Array.isArray(body.roles) ? body.roles : [];
    const roles = rolesRaw.filter((r: unknown): r is string => typeof r === "string" && VALID_ROLES.has(r));
    if (roles.length === 0) {
      return NextResponse.json({ error: "Select at least one target role" }, { status: 400 });
    }

    const remote = typeof body.remote === "string" && VALID_REMOTE.has(body.remote) ? body.remote : null;
    if (!remote) {
      return NextResponse.json({ error: "Select a location preference" }, { status: 400 });
    }

    if (typeof body.workAuth !== "boolean") {
      return NextResponse.json({ error: "Answer work authorization" }, { status: 400 });
    }

    const city = typeof body.city === "string" ? body.city.trim() || null : null;
    const state = typeof body.state === "string" ? body.state.trim() || null : null;
    const country = typeof body.country === "string" ? body.country.trim() || null : null;

    await prisma.tempOnboarding.update({
      where: { id: tempId },
      data: {
        confirmedRoles: JSON.stringify(roles),
        confirmedRemote: remote,
        confirmedWorkAuth: body.workAuth,
        confirmedCity: city,
        confirmedState: state,
        confirmedCountry: country,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("confirm-extraction error", error);
    return NextResponse.json({ error: "Failed to save confirmation" }, { status: 500 });
  }
}
