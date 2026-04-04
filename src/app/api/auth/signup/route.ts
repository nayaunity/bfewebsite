import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client/web";

export const runtime = "edge";

const db = createClient({
  url: process.env.DATABASE_URL!.trim(),
  authToken: process.env.DATABASE_AUTH_TOKEN?.trim(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db.execute({
      sql: "SELECT id, passwordHash FROM User WHERE email = ?",
      args: [normalizedEmail],
    });

    const existingUser = existing.rows[0];

    if (existingUser) {
      if (existingUser.passwordHash) {
        return NextResponse.json(
          { error: "An account with this email already exists. Try signing in." },
          { status: 409 }
        );
      }
      // Existing user without password (magic link user) — just set their password
      const passwordHash = await bcrypt.hash(password, 12);
      await db.execute({
        sql: "UPDATE User SET passwordHash = ?, emailVerified = ? WHERE email = ?",
        args: [passwordHash, new Date().toISOString(), normalizedEmail],
      });
      return NextResponse.json({ success: true, message: "Password set for existing account" });
    }

    // Create new user
    const passwordHash = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();
    await db.execute({
      sql: "INSERT INTO User (id, email, passwordHash, firstName, lastName, emailVerified) VALUES (?, ?, ?, ?, ?, ?)",
      args: [
        id,
        normalizedEmail,
        passwordHash,
        firstName?.trim() || null,
        lastName?.trim() || null,
        new Date().toISOString(),
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Signup error:", errMsg);
    return NextResponse.json(
      { error: "Failed to create account. Please try again or use the sign-in page." },
      { status: 500 }
    );
  }
}
