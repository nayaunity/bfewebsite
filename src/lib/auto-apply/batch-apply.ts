import { prisma } from "@/lib/prisma";
import { submitApplication } from "./greenhouse-submit";
import type { ApplicantProfile, BatchApplyResult } from "./types";
import deiCompanies from "@/data/dei-companies.json";

const MAX_APPLICATIONS_PER_RUN = 50;
const DELAY_BETWEEN_SUBMISSIONS_MS = 2000;

interface GreenhouseCompany {
  slug: string;
  atsConfig: { boardToken: string } | null;
}

function getBoardToken(companySlug: string): string | null {
  const company = (deiCompanies as GreenhouseCompany[]).find(
    (c) => c.slug === companySlug && c.atsConfig?.boardToken
  );
  return company?.atsConfig?.boardToken ?? null;
}

function extractGreenhouseJobId(externalId: string): string | null {
  if (!externalId.startsWith("gh-")) return null;
  return externalId.slice(3);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run batch auto-apply for a single user.
 */
export async function batchApply(
  userId: string,
  applicant: ApplicantProfile
): Promise<BatchApplyResult> {
  // Create a run record
  const run = await prisma.autoApplyRun.create({
    data: { userId },
  });

  const result: BatchApplyResult = {
    totalEligible: 0,
    submitted: 0,
    skipped: 0,
    failed: 0,
    results: [],
  };

  try {
    // Get all active Greenhouse jobs
    const activeJobs = await prisma.job.findMany({
      where: {
        source: "greenhouse",
        isActive: true,
      },
      select: {
        id: true,
        externalId: true,
        company: true,
        companySlug: true,
        title: true,
      },
    });

    // Get jobs already applied to by this user
    const existingApplications = await prisma.jobApplication.findMany({
      where: {
        userId,
        status: { in: ["submitted", "pending", "skipped"] },
      },
      select: { jobId: true },
    });

    const appliedJobIds = new Set(existingApplications.map((a) => a.jobId));

    // Filter to eligible jobs
    const eligibleJobs = activeJobs.filter((job) => {
      if (appliedJobIds.has(job.id)) return false;
      if (!extractGreenhouseJobId(job.externalId)) return false;
      if (!getBoardToken(job.companySlug)) return false;
      return true;
    });

    result.totalEligible = eligibleJobs.length;

    // Cap at max per run
    const jobsToProcess = eligibleJobs.slice(0, MAX_APPLICATIONS_PER_RUN);

    await prisma.autoApplyRun.update({
      where: { id: run.id },
      data: { totalJobs: jobsToProcess.length },
    });

    for (let i = 0; i < jobsToProcess.length; i++) {
      const job = jobsToProcess[i];
      const greenhouseId = extractGreenhouseJobId(job.externalId)!;
      const boardToken = getBoardToken(job.companySlug)!;

      // Add delay between submissions (skip first)
      if (i > 0) {
        await delay(DELAY_BETWEEN_SUBMISSIONS_MS);
      }

      const submitResult = await submitApplication(
        boardToken,
        greenhouseId,
        applicant
      );

      // Save the application record
      await prisma.jobApplication.create({
        data: {
          userId,
          jobId: job.id,
          externalJobId: greenhouseId,
          company: job.company,
          companySlug: job.companySlug,
          boardToken,
          jobTitle: job.title,
          status: submitResult.status,
          errorMessage: submitResult.error,
          submittedAt: submitResult.status === "submitted" ? new Date() : null,
        },
      });

      result.results.push({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        status: submitResult.status,
        error: submitResult.error,
      });

      if (submitResult.status === "submitted") result.submitted++;
      else if (submitResult.status === "skipped") result.skipped++;
      else result.failed++;

      // If rate limited, stop processing
      if (submitResult.error?.includes("Rate limited")) {
        console.log("Rate limited, stopping batch processing");
        break;
      }
    }

    // Update run record
    await prisma.autoApplyRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        submitted: result.submitted,
        skipped: result.skipped,
        failed: result.failed,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.autoApplyRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        submitted: result.submitted,
        skipped: result.skipped,
        failed: result.failed,
        errorMessage:
          error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    });
    throw error;
  }

  return result;
}
