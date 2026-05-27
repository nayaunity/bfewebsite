import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Auto-apply subscriptions are no longer available." },
    { status: 410 }
  );
}
