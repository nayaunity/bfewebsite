import "server-only";

import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { getCurrentPeriodStart } from "@/lib/subscription";
import {
  buildReferralPacket,
  dedupeLinkedInConnections,
  extractLinkedInPublicId,
  getReferralAccessSummary,
  LIVE_REFERRAL_STATUSES,
  scoreWarmMatch,
  slugifyCompanyName,
  type LinkedInConnectionInput,
  type ReferralAccessSummary,
  type ReferralPacket,
  type ReferralRequestStatus,
  type WarmMatch,
} from "./core";
import { matchUserResume } from "@/lib/resume-matcher";
import {
  createLinkedInSyncToken as createRawLinkedInSyncToken,
  verifyLinkedInSyncToken as verifyRawLinkedInSyncToken,
  LINKEDIN_SYNC_TOKEN_TTL_MS,
} from "./token";
import { isReferralAssistEnabledForUserId } from "./beta";

const LIVE_REFERRAL_STATUS_LIST = [...LIVE_REFERRAL_STATUSES];

function getReferralSyncSecret(override?: string): string {
  return override || process.env.REFERRAL_SYNC_SECRET || process.env.NEXTAUTH_SECRET || "bfe-referral-sync-dev-secret";
}

export function createLinkedInSyncToken(
  params: { userId: string; origin: string; ttlMs?: number },
  secret?: string
): { token: string; expiresAt: string } {
  return createRawLinkedInSyncToken(
    {
      ...params,
      ttlMs: params.ttlMs ?? LINKEDIN_SYNC_TOKEN_TTL_MS,
    },
    getReferralSyncSecret(secret)
  );
}

export function verifyLinkedInSyncToken(
  token: string,
  secret?: string
): { userId: string; origin: string; expiresAt: string } | null {
  return verifyRawLinkedInSyncToken(token, getReferralSyncSecret(secret));
}

export function getTargetRolesForUser(targetRole: string | null, onboardingData?: string | null): string[] {
  if (targetRole) {
    try {
      const parsed = JSON.parse(targetRole);
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
      }
    } catch {
      if (targetRole.trim()) return [targetRole.trim()];
    }
  }

  if (onboardingData) {
    try {
      const parsed = JSON.parse(onboardingData) as { roles?: string[] };
      if (Array.isArray(parsed.roles)) {
        return parsed.roles.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
      }
    } catch {
      return [];
    }
  }

  return [];
}

export async function getReferralAccessForUser(userId: string): Promise<{
  access: ReferralAccessSummary;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    currentTitle: string | null;
    currentEmployer: string | null;
    yearsOfExperience: string | null;
    city: string | null;
    targetRole: string | null;
    onboardingData: string | null;
    linkedinUrl: string | null;
    subscriptionTier: string;
    subscriptionStatus: string;
    resumeUrl: string | null;
    resumes: { id: string }[];
    createdAt: Date;
    subscribedAt: Date | null;
  };
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      currentTitle: true,
      currentEmployer: true,
      yearsOfExperience: true,
      city: true,
      targetRole: true,
      onboardingData: true,
      linkedinUrl: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      resumeUrl: true,
      resumes: { select: { id: true }, take: 1 },
      createdAt: true,
      subscribedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const periodStart = getCurrentPeriodStart(user);

  const [monthlyUsed, concurrentUsed] = await Promise.all([
    prisma.referralRequest.count({
      where: {
        userId,
        submittedAt: { gte: periodStart },
      },
    }),
    prisma.referralRequest.count({
      where: {
        userId,
        status: { in: LIVE_REFERRAL_STATUS_LIST },
      },
    }),
  ]);

  const access = getReferralAccessSummary({
    tier: user.subscriptionTier || "free",
    subscriptionStatus: user.subscriptionStatus || "inactive",
    monthlyUsed,
    concurrentUsed,
  });

  return { access, user };
}

export async function getLinkedInStatusForUser(userId: string) {
  const [connectionsTotal, activeConnections, lastRun] = await Promise.all([
    prisma.linkedInConnection.count({ where: { userId } }),
    prisma.linkedInConnection.count({ where: { userId, status: "active" } }),
    prisma.linkedInSyncRun.findFirst({
      where: { userId },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  return {
    connectionsTotal,
    activeConnections,
    lastRun,
  };
}

export async function getWarmMatchesForUser(userId: string, limit = 18): Promise<WarmMatch[]> {
  const { user } = await getReferralAccessForUser(userId);
  const targetRoles = getTargetRolesForUser(user.targetRole, user.onboardingData);

  const connections = await prisma.linkedInConnection.findMany({
    where: {
      userId,
      status: "active",
      companySlug: { not: null },
    },
    orderBy: { lastSyncedAt: "desc" },
  });

  if (connections.length === 0) return [];

  const companySlugs = [...new Set(connections.map((connection) => connection.companySlug).filter(Boolean))] as string[];
  if (companySlugs.length === 0) return [];

  const jobs = await prisma.job.findMany({
    where: {
      isActive: true,
      companySlug: { in: companySlugs },
    },
    orderBy: [
      { postedAt: "desc" },
      { scrapedAt: "desc" },
    ],
    take: 150,
    select: {
      id: true,
      title: true,
      company: true,
      companySlug: true,
      location: true,
      applyUrl: true,
      postedAt: true,
    },
  });

  const connectionsByCompany = new Map<string, typeof connections>();
  for (const connection of connections) {
    if (!connection.companySlug) continue;
    const list = connectionsByCompany.get(connection.companySlug) || [];
    list.push(connection);
    connectionsByCompany.set(connection.companySlug, list);
  }

  const matches: WarmMatch[] = [];
  for (const job of jobs) {
    const companyConnections = connectionsByCompany.get(job.companySlug) || [];
    let best: WarmMatch | null = null;

    for (const connection of companyConnections) {
      const scored = scoreWarmMatch({
        jobTitle: job.title,
        postedAt: job.postedAt,
        connectionHeadline: connection.headline,
        targetRoles,
      });

      const match: WarmMatch = {
        jobId: job.id,
        title: job.title,
        company: job.company,
        companySlug: job.companySlug,
        location: job.location,
        applyUrl: job.applyUrl,
        postedAt: job.postedAt ? job.postedAt.toISOString() : null,
        score: scored.score,
        matchReason: scored.matchReason,
        connection: {
          id: connection.id,
          fullName: connection.fullName,
          headline: connection.headline,
          currentCompany: connection.currentCompany,
          companySlug: connection.companySlug,
          location: connection.location,
          profileUrl: connection.profileUrl,
          avatarUrl: connection.avatarUrl,
          status: connection.status,
          lastSyncedAt: connection.lastSyncedAt.toISOString(),
        },
      };

      if (!best || match.score > best.score) {
        best = match;
      }
    }

    if (best) {
      matches.push(best);
    }
  }

  return matches
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return new Date(right.postedAt || 0).getTime() - new Date(left.postedAt || 0).getTime();
    })
    .slice(0, limit);
}

export async function buildReferralPacketForUser(params: {
  userId: string;
  jobId: string;
  connectionId: string;
  resumeId?: string | null;
}): Promise<{
  packet: ReferralPacket;
  resume: { id: string | null; name: string | null; url: string | null };
}> {
  const { user } = await getReferralAccessForUser(params.userId);
  const [job, connection, selectedResume] = await Promise.all([
    prisma.job.findUnique({
      where: { id: params.jobId },
      select: {
        id: true,
        title: true,
        company: true,
        companySlug: true,
        applyUrl: true,
      },
    }),
    prisma.linkedInConnection.findFirst({
      where: { id: params.connectionId, userId: params.userId },
      select: {
        id: true,
        fullName: true,
        headline: true,
        currentCompany: true,
      },
    }),
    params.resumeId
      ? prisma.userResume.findFirst({
          where: { id: params.resumeId, userId: params.userId },
          select: {
            id: true,
            fileName: true,
            blobUrl: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!job) throw new Error("Job not found");
  if (!connection) throw new Error("Connection not found");

  const normalizedJobCompany = slugifyCompanyName(job.company);
  if (!normalizedJobCompany || connection.currentCompany && slugifyCompanyName(connection.currentCompany) !== normalizedJobCompany) {
    throw new Error("Referral requests are limited to jobs tied to synced LinkedIn connections.");
  }

  let resumeRecord: { id: string | null; fileName: string; blobUrl: string } | null = selectedResume
    ? {
        id: selectedResume.id,
        fileName: selectedResume.fileName,
        blobUrl: selectedResume.blobUrl,
      }
    : null;
  if (!resumeRecord) {
    const matchedResume = await matchUserResume(params.userId, job.title, user.targetRole ?? undefined);
    if (matchedResume) {
      resumeRecord = {
        id: matchedResume.id === "legacy" ? null : matchedResume.id,
        fileName: matchedResume.fileName,
        blobUrl: matchedResume.blobUrl,
      };
    }
  }

  const targetRoles = getTargetRolesForUser(user.targetRole, user.onboardingData);
  const firstName = connection.fullName.trim().split(/\s+/)[0] || "there";

  const packet = buildReferralPacket({
    userFirstName: user.firstName,
    userLastName: user.lastName,
    userCurrentTitle: user.currentTitle,
    userCurrentEmployer: user.currentEmployer,
    yearsOfExperience: user.yearsOfExperience,
    city: user.city,
    targetRoles,
    linkedinUrl: user.linkedinUrl,
    jobTitle: job.title,
    company: job.company,
    applyUrl: job.applyUrl,
    connectionFirstName: firstName,
    connectionFullName: connection.fullName,
    connectionHeadline: connection.headline,
    resumeName: resumeRecord?.fileName || null,
  });

  return {
    packet,
    resume: {
      id: resumeRecord?.id || null,
      name: resumeRecord?.fileName || null,
      url: resumeRecord?.blobUrl || user.resumeUrl || null,
    },
  };
}

export function getReferralStatusPatch(status: ReferralRequestStatus) {
  const now = new Date();
  const patch: Record<string, Date | string | null> = { status };

  if (status === "queued") patch.submittedAt = now;
  if (status === "sent") patch.sentAt = now;
  if (status === "follow_up_due") {
    patch.followUpDueAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  }
  if (status === "intro_made") patch.introMadeAt = now;
  if (status === "interview") patch.interviewAt = now;
  if (status === "offer") patch.offerAt = now;
  if (status === "hired") patch.hiredAt = now;
  if (status === "closed_no_response" || status === "closed_declined") patch.closedAt = now;

  return patch;
}

export async function createReferralEvent(params: {
  referralRequestId: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}) {
  await prisma.referralRequestEvent.create({
    data: {
      referralRequestId: params.referralRequestId,
      type: params.type,
      message: params.message,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });

  await prisma.activity.create({
    data: {
      type: "referral_update",
      message: params.message,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

function statusEmailCopy(status: ReferralRequestStatus, params: {
  company: string;
  title: string;
  dashboardUrl: string;
}): { subject: string; text: string } | null {
  switch (status) {
    case "packet_ready":
      return {
        subject: `Your ${params.company} referral packet is ready`,
        text: `Your packet for ${params.title} at ${params.company} is ready to review.\n\nOpen your referrals dashboard: ${params.dashboardUrl}`,
      };
    case "follow_up_due":
      return {
        subject: `Time to follow up on ${params.company}`,
        text: `Your referral request for ${params.title} at ${params.company} is ready for a short follow-up.\n\nUpdate the status here: ${params.dashboardUrl}`,
      };
    case "intro_made":
      return {
        subject: `${params.company} referral intro logged`,
        text: `Nice progress. Your ${params.company} referral request for ${params.title} is now marked as intro made.\n\nKeep the thread updated: ${params.dashboardUrl}`,
      };
    case "interview":
      return {
        subject: `Interview progress tracked for ${params.company}`,
        text: `Your referral workflow for ${params.title} at ${params.company} is now marked as interview stage.\n\nKeep momentum in the dashboard: ${params.dashboardUrl}`,
      };
    default:
      return null;
  }
}

export async function sendReferralStatusEmail(params: {
  email: string;
  status: ReferralRequestStatus;
  company: string;
  title: string;
  origin: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const copy = statusEmailCopy(params.status, {
    company: params.company,
    title: params.title,
    dashboardUrl: `${params.origin}/profile/referrals`,
  });
  if (!copy) return;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: "The Black Female Engineer <noreply@theblackfemaleengineer.com>",
    to: params.email,
    subject: copy.subject,
    text: copy.text,
  });
}

export async function syncLinkedInConnections(params: {
  token: string;
  connections: LinkedInConnectionInput[];
  extensionVersion?: string | null;
  lastCursor?: string | null;
}) {
  const verified = verifyLinkedInSyncToken(params.token);
  if (!verified) {
    throw new Error("Invalid or expired sync token");
  }

  if (!(await isReferralAssistEnabledForUserId(verified.userId))) {
    throw new Error("Referral Assist is not enabled for this account.");
  }

  const normalized = dedupeLinkedInConnections(params.connections);
  const syncRun = await prisma.linkedInSyncRun.create({
    data: {
      userId: verified.userId,
      status: "running",
      source: "extension",
      extensionVersion: params.extensionVersion || null,
      connectionsSeen: normalized.length,
      lastCursor: params.lastCursor || null,
    },
  });

  let upserted = 0;
  let hidden = 0;

  try {
    const urls = normalized.map((connection) => connection.profileUrl);
    const publicIds = normalized
      .map((connection) => connection.linkedinPublicId || extractLinkedInPublicId(connection.profileUrl))
      .filter((value): value is string => !!value);

    const existing = await prisma.linkedInConnection.findMany({
      where: {
        userId: verified.userId,
        OR: [
          { profileUrl: { in: urls } },
          ...(publicIds.length > 0 ? [{ linkedinPublicId: { in: publicIds } }] : []),
        ],
      },
    });

    const existingByUrl = new Map(existing.map((item) => [item.profileUrl, item]));
    const existingByPublicId = new Map(
      existing
        .filter((item) => item.linkedinPublicId)
        .map((item) => [item.linkedinPublicId as string, item])
    );

    for (const item of normalized) {
      const existingRecord =
        existingByUrl.get(item.profileUrl) ||
        (item.linkedinPublicId ? existingByPublicId.get(item.linkedinPublicId) : undefined);

      const companySlug = slugifyCompanyName(item.currentCompany);
      const status = existingRecord?.status === "hidden" ? "hidden" : "active";
      if (status === "hidden") hidden += 1;

      if (existingRecord) {
        await prisma.linkedInConnection.update({
          where: { id: existingRecord.id },
          data: {
            linkedinPublicId: item.linkedinPublicId || existingRecord.linkedinPublicId,
            fullName: item.fullName,
            headline: item.headline,
            currentCompany: item.currentCompany,
            companySlug,
            location: item.location,
            profileUrl: item.profileUrl,
            avatarUrl: item.avatarUrl,
            rawData: JSON.stringify(item),
            lastSyncedAt: new Date(),
            status,
          },
        });
      } else {
        await prisma.linkedInConnection.create({
          data: {
            userId: verified.userId,
            linkedinPublicId: item.linkedinPublicId,
            fullName: item.fullName,
            headline: item.headline,
            currentCompany: item.currentCompany,
            companySlug,
            location: item.location,
            profileUrl: item.profileUrl,
            avatarUrl: item.avatarUrl,
            rawData: JSON.stringify(item),
          },
        });
      }

      upserted += 1;
    }

    await prisma.linkedInSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "success",
        connectionsUpserted: upserted,
        connectionsHidden: hidden,
        completedAt: new Date(),
      },
    });

    return {
      userId: verified.userId,
      runId: syncRun.id,
      seen: normalized.length,
      upserted,
      hidden,
      expiresAt: verified.expiresAt,
      origin: verified.origin,
    };
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
}
