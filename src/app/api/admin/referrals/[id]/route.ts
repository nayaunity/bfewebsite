import { NextResponse } from "next/server";

import { checkOperationsAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { isReferralAssistEnabledForEmail } from "@/lib/referrals/beta";
import { REFERRAL_STATUSES, type ReferralRequestStatus } from "@/lib/referrals/core";
import { getReferralBackendStatus } from "@/lib/referrals/runtime";
import {
  createReferralEvent,
  getReferralStatusPatch,
  sendReferralStatusEmail,
} from "@/lib/referrals/server";

const include = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
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
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
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
  const { allowed, session } = await checkOperationsAdmin();
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isReferralAssistEnabledForEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const backend = await getReferralBackendStatus();
  if (!backend.ready) {
    return NextResponse.json({ error: backend.message }, { status: 503 });
  }

  const { id } = await context.params;
  const body = await request.json() as {
    status?: ReferralRequestStatus;
    adminNotes?: string | null;
    priority?: number;
    followUpDueAt?: string | null;
    outcomeNote?: string | null;
  };

  if (body.status && !REFERRAL_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.referralRequest.findUnique({
    where: { id },
    include,
  });

  if (!existing) {
    return NextResponse.json({ error: "Referral request not found" }, { status: 404 });
  }

  const statusPatch = body.status ? getReferralStatusPatch(body.status) : {};
  const followUpDueAt = body.followUpDueAt ? new Date(body.followUpDueAt) : undefined;

  const updated = await prisma.referralRequest.update({
    where: { id },
    data: {
      ...statusPatch,
      ...(body.adminNotes !== undefined ? { adminNotes: body.adminNotes?.trim() || null } : {}),
      ...(body.priority !== undefined ? { priority: Math.max(0, Math.min(body.priority, 5)) } : {}),
      ...(followUpDueAt ? { followUpDueAt } : {}),
      ...(body.outcomeNote !== undefined ? { outcomeNote: body.outcomeNote?.trim() || null } : {}),
    },
    include,
  });

  if (body.status) {
    await createReferralEvent({
      referralRequestId: updated.id,
      type: `admin_${body.status}`,
      message: `Referral queue updated ${updated.job.company} to ${body.status.replace(/_/g, " ")}`,
      metadata: {
        status: body.status,
        priority: updated.priority,
      },
    });

    await sendReferralStatusEmail({
      email: updated.user.email,
      status: body.status,
      company: updated.job.company,
      title: updated.job.title,
      origin: new URL(request.url).origin,
    });
  }

  if (body.adminNotes !== undefined && body.adminNotes !== existing.adminNotes) {
    await createReferralEvent({
      referralRequestId: updated.id,
      type: "admin_note",
      message: `Admin notes updated for ${updated.job.company}`,
      metadata: null,
    });
  }

  return NextResponse.json({
    request: serializeRequest(updated),
  });
}
