import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/error-logger";

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
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, passwordHash: true },
    });

    if (existing) {
      if (existing.passwordHash) {
        return NextResponse.json(
          { error: "An account with this email already exists. Try signing in." },
          { status: 409 }
        );
      }
      // Existing user without password (magic link user) — just set their password
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          passwordHash,
          emailVerified: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: "Password set for existing account" });
    }

    // Create new user
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Signup error:", errMsg);
    await logError({
      endpoint: "/api/auth/signup",
      method: "POST",
      status: 500,
      error: "Signup failed",
      detail: errMsg,
    });
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
