import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client/web";

export const runtime = "edge";

const db = createClient({
  url: process.env.DATABASE_URL!.trim(),
  authToken: process.env.DATABASE_AUTH_TOKEN?.trim(),
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await db.execute({
      sql: "SELECT id, passwordHash, firstName FROM User WHERE email = ?",
      args: [email.trim().toLowerCase()],
    });

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ status: "new" });
    }

    if (user.passwordHash) {
      return NextResponse.json({
        status: "has_password",
        firstName: user.firstName,
      });
    }

    return NextResponse.json({
      status: "needs_password",
      firstName: user.firstName,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
