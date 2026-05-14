import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isReferralAssistEnabledForEmail } from "@/lib/referrals/beta";
import { getReferralBackendStatus } from "@/lib/referrals/runtime";
import { parseLinkedInConnectionsCsv, csvRowToConnectionInput } from "@/lib/referrals/csv";
import { dedupeLinkedInConnections } from "@/lib/referrals/core";
import { upsertConnections } from "@/lib/referrals/server";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isReferralAssistEnabledForEmail(session.user.email)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const backend = await getReferralBackendStatus();
    if (!backend.ready) {
      return NextResponse.json({ error: backend.message }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "Only .csv files are accepted" }, { status: 400 });
    }

    const raw = await file.text();
    const rows = parseLinkedInConnectionsCsv(raw);
    if (rows.length === 0) {
      return NextResponse.json({ error: "No connections found in CSV" }, { status: 400 });
    }

    const inputs = rows
      .map(csvRowToConnectionInput)
      .filter((input): input is NonNullable<typeof input> => input !== null);

    const emailMap = new Map<string, string>();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const input = inputs.find(
        (inp) => inp.fullName === [row.firstName, row.lastName].filter(Boolean).join(" ").trim()
      );
      if (input && row.emailAddress) {
        emailMap.set(input.profileUrl, row.emailAddress);
      }
    }

    const normalized = dedupeLinkedInConnections(inputs);

    const syncRun = await prisma.linkedInSyncRun.create({
      data: {
        userId: session.user.id,
        status: "running",
        source: "csv_upload",
        connectionsSeen: normalized.length,
      },
    });

    try {
      const { upserted, hidden } = await upsertConnections(
        session.user.id,
        normalized,
        { emails: emailMap }
      );

      await prisma.linkedInSyncRun.update({
        where: { id: syncRun.id },
        data: {
          status: "success",
          connectionsUpserted: upserted,
          connectionsHidden: hidden,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        runId: syncRun.id,
        seen: normalized.length,
        upserted,
        hidden,
      });
    } catch (error) {
      await prisma.linkedInSyncRun.update({
        where: { id: syncRun.id },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        },
      });
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "CSV upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
