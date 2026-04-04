import { encode } from "@auth/core/jwt";
import { NextResponse } from "next/server";

const COOKIE_NAME = "__Secure-authjs.session-token";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function setSessionCookie(
  response: NextResponse,
  userId: string,
  email: string
): Promise<void> {
  const secret = process.env.AUTH_SECRET!;

  const token = await encode({
    token: { sub: userId, email, name: null, picture: null },
    secret,
    maxAge: MAX_AGE,
    salt: COOKIE_NAME,
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}
