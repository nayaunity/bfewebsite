import { NextRequest, NextResponse } from "next/server";
import { encode } from "@auth/core/jwt";
import { prisma } from "@/lib/prisma";

const IS_DEV = process.env.NODE_ENV === "development";
const MAX_AGE = 24 * 60 * 60;

const USE_SECURE = (process.env.AUTH_URL || "").startsWith("https");
const COOKIE_NAME = USE_SECURE
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

async function loginAndSetCookie(email: string, redirectTo?: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const secret = process.env.AUTH_SECRET!;
  const token = await encode({
    token: { sub: user.id, email: user.email, name: null, picture: null },
    secret,
    maxAge: MAX_AGE,
    salt: COOKIE_NAME,
  });

  const response = redirectTo
    ? NextResponse.redirect(new URL(redirectTo, "http://localhost:3000"))
    : NextResponse.json({ ok: true, userId: user.id });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: USE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return response;
}

export async function GET(request: NextRequest) {
  if (!IS_DEV) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const email = request.nextUrl.searchParams.get("email");
  const redirectTo = request.nextUrl.searchParams.get("then") || "/profile/applications";

  if (!email) {
    return NextResponse.json({ error: "email query param required" }, { status: 400 });
  }

  return loginAndSetCookie(email, redirectTo);
}

export async function POST(request: Request) {
  if (!IS_DEV) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { email } = (await request.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  return loginAndSetCookie(email);
}
