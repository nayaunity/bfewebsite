import { NextResponse } from "next/server";

import { checkOperationsAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { isReferralAssistEnabledForEmail } from "@/lib/referrals/beta";

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

export async function GET(request: Request) {
  const { allowed, session } = await checkOperationsAdmin();
  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isReferralAssistEnabledForEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();

  const requests = await prisma.referralRequest.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { job: { title: { contains: search } } },
              { job: { company: { contains: search } } },
              { user: { email: { contains: search } } },
              { connection: { fullName: { contains: search } } },
            ],
          }
        : {}),
    },
    orderBy: [
      { priority: "desc" },
      { updatedAt: "desc" },
    ],
    include,
  });

  return NextResponse.json({
    requests: requests.map(serializeRequest),
  });
}
