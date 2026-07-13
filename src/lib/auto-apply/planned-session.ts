import "server-only";

import { prisma } from "@/lib/prisma";
import {
  planBrowseSession,
  type PlanningCandidateJob,
  type PlanningSummary,
} from "./planning";

interface CreatePlannedBrowseSessionArgs {
  userId: string;
  targetRole: string;
  matchedJobs: PlanningCandidateJob[];
  resumeUrl: string;
  resumeName: string;
  companies?: string[];
  totalCompanies?: number;
  seekingInternship?: boolean;
  qualityThreshold?: number | null;
  healthCheckId?: string | null;
}

export interface PlannedBrowseSessionResult {
  sessionId: string;
  planning: PlanningSummary;
}

function serializeMatchedJobs(matchedJobs: PlanningCandidateJob[]): string {
  return JSON.stringify(
    matchedJobs.map((job) => ({
      id: job.id,
      title: job.title,
      applyUrl: job.applyUrl,
      company: job.company,
      companySlug: job.companySlug,
      matchScore: job.score,
      matchReason: job.matchReason,
    }))
  );
}

export async function createPlannedBrowseSession(
  args: CreatePlannedBrowseSessionArgs
): Promise<PlannedBrowseSessionResult> {
  const companies =
    args.companies && args.companies.length > 0
      ? [...new Set(args.companies)]
      : [...new Set(args.matchedJobs.map((job) => job.company))];

  const browseSession = await prisma.browseSession.create({
    data: {
      userId: args.userId,
      status: "planning",
      targetRole: args.targetRole,
      companies: JSON.stringify(companies),
      matchedJobs: serializeMatchedJobs(args.matchedJobs),
      resumeUrl: args.resumeUrl,
      resumeName: args.resumeName,
      totalCompanies: args.totalCompanies ?? companies.length,
      seekingInternship: args.seekingInternship === true,
      qualityThreshold: args.qualityThreshold ?? null,
      healthCheckId: args.healthCheckId ?? null,
    },
  });

  const planning = await planBrowseSession({
    sessionId: browseSession.id,
    userId: args.userId,
    matchedJobs: args.matchedJobs,
  });

  return {
    sessionId: browseSession.id,
    planning,
  };
}
