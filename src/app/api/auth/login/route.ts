import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client/web";
import { setSessionCookie } from "@/lib/session-edge";

export const runtime = "edge";

const db = createClient({
  url: process.env.DATABASE_URL!.trim(),
  authToken: process.env.DATABASE_AUTH_TOKEN?.trim(),
});

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

    const response = NextResponse.json({ success: true });
    await setSessionCookie(response, user.id as string, normalizedEmail);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
