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
    let userId: string;

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
      userId = existingUser.id as string;
    } else {
      // Create new user with all required defaults
      const passwordHash = await bcrypt.hash(password, 12);
      userId = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO User (id, email, passwordHash, firstName, lastName, emailVerified, role, subscriptionTier, subscriptionStatus, monthlyAppCount, autoApplyEnabled, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, 'user', 'free', 'inactive', 0, 0, ?)`,
        args: [
          userId,
          normalizedEmail,
          passwordHash,
          firstName?.trim() || null,
          lastName?.trim() || null,
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      });
    }

    // Set session cookie using NextAuth's own JWT encoding
    const response = NextResponse.json({ success: true });
    await setSessionCookie(response, userId, normalizedEmail);
    return response;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Signup error:", errMsg);
    return NextResponse.json(
      { error: "Failed to create account. Please try again or use the sign-in page." },
      { status: 500 }
    );
  }
}
