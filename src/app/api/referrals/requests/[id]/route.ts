import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isReferralAssistEnabledForEmail } from "@/lib/referrals/beta";
import { REFERRAL_STATUSES, type ReferralRequestStatus } from "@/lib/referrals/core";
import {
  createReferralEvent,
  getReferralAccessForUser,
  getReferralStatusPatch,
  sendReferralStatusEmail,
} from "@/lib/referrals/server";

const USER_ALLOWED_STATUSES = new Set<ReferralRequestStatus>([
  "queued",
  "sent",
  "follow_up_due",
  "intro_made",
  "interview",
  "offer",
  "hired",
  "closed_no_response",
  "closed_declined",
]);

const include = {
  user: {
    select: {
      email: true,
      firstName: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  },
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
  user: {
    email: string;
    firstName: string | null;
    subscriptionTier: string;
    subscriptionStatus: string;
  };
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isReferralAssistEnabledForEmail(session.user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id } = await context.params;
  const body = await request.json() as {
    status?: ReferralRequestStatus;
    outcomeNote?: string | null;
  };

  if (!body.status || !REFERRAL_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (!USER_ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "This status is managed by the referral queue" }, { status: 403 });
  }

  const existing = await prisma.referralRequest.findFirst({
    where: { id, userId: session.user.id },
    include,
  });

  if (!existing) {
    return NextResponse.json({ error: "Referral request not found" }, { status: 404 });
  }

  const { access } = await getReferralAccessForUser(session.user.id);
  if (body.status === "queued") {
    if (!access.canSubmitLive) {
      return NextResponse.json(
        { error: access.liveReason || "Live referral requests unavailable", access },
        { status: 403 }
      );
    }
    if (!existing.resumeUrl) {
      return NextResponse.json(
        { error: "Upload a resume before submitting a live referral request." },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.referralRequest.update({
    where: { id: existing.id },
    data: {
      ...getReferralStatusPatch(body.status),
      priority: body.status === "queued"
        ? existing.user.subscriptionTier === "pro" ? 2 : 1
        : existing.priority,
      outcomeNote: body.outcomeNote?.trim() || existing.outcomeNote,
    },
    include,
  });

  const message = body.status === "queued"
    ? `Live referral request submitted for ${updated.job.company}`
    : `Referral request updated to ${body.status.replace(/_/g, " ")} for ${updated.job.company}`;

  await createReferralEvent({
    referralRequestId: updated.id,
    type: `user_${body.status}`,
    message,
    metadata: {
      status: body.status,
      jobId: updated.job.id,
    },
  });

  await sendReferralStatusEmail({
    email: updated.user.email,
    status: body.status,
    company: updated.job.company,
    title: updated.job.title,
    origin: new URL(request.url).origin,
  });

  return NextResponse.json({
    access,
    request: serializeRequest(updated),
  });
}
