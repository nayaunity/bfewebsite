import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client/web";
import { EncryptJWT, base64url, calculateJwkThumbprint } from "jose";
import { hkdf } from "@panva/hkdf";

export const runtime = "edge";

const db = createClient({
  url: process.env.DATABASE_URL!.trim(),
  authToken: process.env.DATABASE_AUTH_TOKEN?.trim(),
});

const COOKIE_NAME = "__Secure-authjs.session-token";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

async function createSessionCookie(userId: string, email: string): Promise<string> {
  const secret = process.env.AUTH_SECRET!;
  const encryptionSecret = await hkdf(
    "sha256",
    secret,
    COOKIE_NAME,
    `Auth.js Generated Encryption Key (${COOKIE_NAME})`,
    64
  );

  const thumbprint = await calculateJwkThumbprint(
    { kty: "oct", k: base64url.encode(encryptionSecret) },
    "sha512"
  );

  const now = Math.floor(Date.now() / 1000);

  return await new EncryptJWT({ sub: userId, email })
    .setProtectedHeader({ alg: "dir", enc: "A256CBC-HS512", kid: thumbprint })
    .setIssuedAt(now)
    .setExpirationTime(now + MAX_AGE)
    .setJti(crypto.randomUUID())
    .encrypt(encryptionSecret);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await db.execute({
      sql: "SELECT id, passwordHash FROM User WHERE email = ?",
      args: [normalizedEmail],
    });

    const user = result.rows[0];

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash as string);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const sessionToken = await createSessionCookie(user.id as string, normalizedEmail);
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
