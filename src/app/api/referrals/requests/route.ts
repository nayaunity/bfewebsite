import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isReferralAssistEnabledForEmail } from "@/lib/referrals/beta";
import { getReferralBackendStatus } from "@/lib/referrals/runtime";
import {
  buildReferralPacketForUser,
  createReferralEvent,
  getReferralAccessForUser,
} from "@/lib/referrals/server";

function serializeRequest(request: {
  id: string;
  status: string;
  packetJson: string;
  adminNotes: string | null;
  priority: number;
  resumeName: string | null;
  resumeUrl: string | null;
  submittedAt: Date | null;
  followUpDueAt: Date | null;
  sentAt: Date | null;
  introMadeAt: Date | null;
  interviewAt: Date | null;
  offerAt: Date | null;
  hiredAt: Date | null;
  closedAt: Date | null;
  outcomeNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  job: {
    id: string;
    title: string;
    company: string;
    companySlug: string;
    applyUrl: string;
    location: string;
    postedAt: Date | null;
  };
  connection: {
    id: string;
    fullName: string;
    headline: string | null;
    currentCompany: string | null;
    profileUrl: string;
    avatarUrl: string | null;
  };
  resume: {
    id: string;
    fileName: string;
    blobUrl: string;
  } | null;
  events: Array<{
    id: string;
    type: string;
    message: string;
    metadata: string | null;
    createdAt: Date;
  }>;
}) {
  return {
    ...request,
    submittedAt: request.submittedAt?.toISOString() || null,
    followUpDueAt: request.followUpDueAt?.toISOString() || null,
    sentAt: request.sentAt?.toISOString() || null,
    introMadeAt: request.introMadeAt?.toISOString() || null,
    interviewAt: request.interviewAt?.toISOString() || null,
    offerAt: request.offerAt?.toISOString() || null,
    hiredAt: request.hiredAt?.toISOString() || null,
    closedAt: request.closedAt?.toISOString() || null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    job: {
      ...request.job,
      postedAt: request.job.postedAt?.toISOString() || null,
    },
    events: request.events.map((event) => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

const include = {
  job: {
    select: {
      id: true,
      title: true,
      company: true,
      companySlug: true,
      applyUrl: true,
      location: true,
      postedAt: true,
    },
  },
  connection: {
    select: {
      id: true,
      fullName: true,
      headline: true,
      currentCompany: true,
      profileUrl: true,
      avatarUrl: true,
    },
  },
  resume: {
    select: {
      id: true,
      fileName: true,
      blobUrl: true,
    },
  },
  events: {
    orderBy: { createdAt: "desc" as const },
    take: 10,
    select: {
      id: true,
      type: true,
      message: true,
      metadata: true,
      createdAt: true,
    },
  },
};

export async function GET() {
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

  const [requests, { access }] = await Promise.all([
    prisma.referralRequest.findMany({
      where: { userId: session.user.id },
      orderBy: [{ updatedAt: "desc" }],
      include,
    }),
    getReferralAccessForUser(session.user.id),
  ]);

  return NextResponse.json({
    access,
    requests: requests.map(serializeRequest),
  });
}

export async function POST(request: Request) {
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

  try {
    const body = await request.json() as {
      jobId?: string;
      connectionId?: string;
      resumeId?: string | null;
    };

    if (!body.jobId || !body.connectionId) {
      return NextResponse.json(
        { error: "jobId and connectionId are required" },
        { status: 400 }
      );
    }

    const [{ access }, packetData] = await Promise.all([
      getReferralAccessForUser(session.user.id),
      buildReferralPacketForUser({
        userId: session.user.id,
        jobId: body.jobId,
        connectionId: body.connectionId,
        resumeId: body.resumeId,
      }),
    ]);

    if (!access.canPreview) {
      return NextResponse.json(
        { error: access.previewReason || "Referral previews unavailable", access },
        { status: 403 }
      );
    }

    const packetJson = JSON.stringify(packetData.packet);
    const existing = await prisma.referralRequest.findFirst({
      where: {
        userId: session.user.id,
        jobId: body.jobId,
        connectionId: body.connectionId,
        closedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      include,
    });

    const saved = existing
      ? await prisma.referralRequest.update({
          where: { id: existing.id },
          data: {
            packetJson,
            resumeId: packetData.resume.id,
            resumeName: packetData.resume.name,
            resumeUrl: packetData.resume.url,
          },
          include,
        })
      : await prisma.referralRequest.create({
          data: {
            userId: session.user.id,
            jobId: body.jobId,
            connectionId: body.connectionId,
            resumeId: packetData.resume.id,
            resumeName: packetData.resume.name,
            resumeUrl: packetData.resume.url,
            packetJson,
          },
          include,
        });

    await createReferralEvent({
      referralRequestId: saved.id,
      type: existing ? "preview_refreshed" : "preview_created",
      message: existing
        ? `Referral packet refreshed for ${saved.job.company}`
        : `Referral preview created for ${saved.job.company}`,
      metadata: {
        jobId: saved.job.id,
        connectionId: saved.connection.id,
      },
    });

    return NextResponse.json({
      access,
      request: serializeRequest(saved),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create referral preview" },
      { status: 400 }
    );
  }
}
