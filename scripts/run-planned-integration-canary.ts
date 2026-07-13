import { config } from "dotenv";
import { pathToFileURL } from "url";

const DEFAULT_ENV_PATH = process.env.DOTENV_CONFIG_PATH || ".env.production";
config({ path: DEFAULT_ENV_PATH, quiet: true });
for (const key of [
  "DATABASE_URL",
  "DATABASE_AUTH_TOKEN",
  "ANTHROPIC_API_KEY",
] as const) {
  if (process.env[key]) {
    process.env[key] = process.env[key]?.trim();
  }
}

const DEFAULT_TEST_USER_ID = "1d16e543-db6e-497b-b78b-28fbf0a30626";
const DEFAULT_TEST_EMAIL = "integration-test@apply.theblackfemaleengineer.com";
const ATS_PRIORITY = ["workday", "lever", "ashby", "greenhouse"] as const;

type SupportedAts = (typeof ATS_PRIORITY)[number];

interface CanaryOptions {
  limit: number;
  maxMatches: number;
  minScore: number;
  manualScore: number;
  userId: string;
  companyContains?: string;
  jobId?: string;
  applyUrl?: string;
  includeGreenhouse: boolean;
  planOnly: boolean;
}

function parseArgs(argv: string[]): CanaryOptions {
  const options: CanaryOptions = {
    limit: 2,
    maxMatches: 30,
    minScore: 0.8,
    manualScore: 0.92,
    userId: DEFAULT_TEST_USER_ID,
    includeGreenhouse: false,
    planOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--limit" && next) {
      options.limit = Math.max(1, parseInt(next, 10) || options.limit);
      index += 1;
      continue;
    }
    if (arg === "--max-matches" && next) {
      options.maxMatches = Math.max(options.limit, parseInt(next, 10) || options.maxMatches);
      index += 1;
      continue;
    }
    if (arg === "--min-score" && next) {
      const parsed = Number(next);
      if (!Number.isNaN(parsed)) {
        options.minScore = Math.max(0, Math.min(1, parsed));
      }
      index += 1;
      continue;
    }
    if (arg === "--user-id" && next) {
      options.userId = next;
      index += 1;
      continue;
    }
    if (arg === "--job-id" && next) {
      options.jobId = next;
      index += 1;
      continue;
    }
    if (arg === "--apply-url" && next) {
      options.applyUrl = next;
      index += 1;
      continue;
    }
    if (arg === "--manual-score" && next) {
      const parsed = Number(next);
      if (!Number.isNaN(parsed)) {
        options.manualScore = Math.max(0, Math.min(1, parsed));
      }
      index += 1;
      continue;
    }
    if (arg === "--company" && next) {
      options.companyContains = next.toLowerCase();
      index += 1;
      continue;
    }
    if (arg === "--include-greenhouse") {
      options.includeGreenhouse = true;
      continue;
    }
    if (arg === "--plan-only") {
      options.planOnly = true;
      continue;
    }
  }

  return options;
}

function parsePrimaryRole(targetRole: string | null): string {
  if (!targetRole) return "Software Engineer";
  try {
    const parsed = JSON.parse(targetRole);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
      return parsed[0];
    }
  } catch {}
  return targetRole;
}

function atsRank(ats: SupportedAts): number {
  return ATS_PRIORITY.indexOf(ats);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const {
    ensureApplicationEmail,
  } = await import("../src/lib/application-email.ts");
  const { detectAtsType } = await import("../src/lib/auto-apply/ats.ts");
  const { matchJobsForUser } = await import("../src/lib/auto-apply/job-matcher.ts");
  const {
    createPlannedBrowseSession,
  } = await import("../src/lib/auto-apply/planned-session.ts");
  const { prisma } = await import("../src/lib/prisma.ts");
  const { matchUserResume } = await import("../src/lib/resume-matcher.ts");
  const {
    processBrowseSessionById,
  } = await import("../worker/src/browse-loop.ts");

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: options.userId },
          { email: DEFAULT_TEST_EMAIL },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        targetRole: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        monthlyAppCount: true,
        freeTierEndsAt: true,
      },
    });

    if (!user) {
      throw new Error(
        `Integration test user not found. Expected id ${options.userId} or email ${DEFAULT_TEST_EMAIL}.`
      );
    }

    console.log(`Using integration test user ${user.id} (${user.email})`);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "test",
        subscriptionTier: "starter",
        subscriptionStatus: "active",
        freeTierEndsAt: null,
        monthlyAppCount: 0,
        autoApplyEnabled: false,
      },
    });

    await prisma.browseSession.updateMany({
      where: {
        userId: user.id,
        status: { in: ["planning", "queued", "processing", "awaiting_review", "paused"] },
      },
      data: {
        status: "cancelled",
        completedAt: new Date(),
        errorMessage: "Cancelled before planned integration canary run",
      },
    });

    await ensureApplicationEmail(user.id);

    const supportedCandidates = options.jobId || options.applyUrl
      ? await (async () => {
          const manualJob = await prisma.job.findFirst({
            where: options.jobId
              ? { id: options.jobId, isActive: true }
              : { applyUrl: options.applyUrl!, isActive: true },
            select: {
              id: true,
              title: true,
              applyUrl: true,
              company: true,
              companySlug: true,
            },
          });

          if (!manualJob) {
            throw new Error("Manual canary job was not found in the active catalog.");
          }

          const atsType = detectAtsType(manualJob.applyUrl);
          if (!ATS_PRIORITY.includes(atsType as SupportedAts)) {
            throw new Error(`Manual canary job uses unsupported ATS: ${atsType}`);
          }

          return [
            {
              ...manualJob,
              score: options.manualScore,
              matchReason: "Manual canary target from supported ATS catalog",
              atsType,
            },
          ];
        })()
      : (await matchJobsForUser(user.id, options.maxMatches, {
          qualityThreshold: Math.min(options.minScore, 0.75),
        }))
          .map((job) => {
            const atsType = detectAtsType(job.applyUrl);
            return {
              ...job,
              atsType,
            };
          })
          .filter((job) => ATS_PRIORITY.includes(job.atsType as SupportedAts))
          .filter((job) => job.score >= options.minScore)
          .filter((job) =>
            options.includeGreenhouse ? true : job.atsType !== "greenhouse"
          )
          .filter((job) =>
            options.companyContains
              ? job.company.toLowerCase().includes(options.companyContains)
              : true
          )
          .sort((left, right) => {
            const atsDelta =
              atsRank(left.atsType as SupportedAts) - atsRank(right.atsType as SupportedAts);
            if (atsDelta !== 0) return atsDelta;
            return right.score - left.score;
          });

    if (supportedCandidates.length === 0) {
      throw new Error(
        `No supported high-confidence jobs matched the canary filters (limit=${options.limit}, minScore=${options.minScore}).`
      );
    }

    const selected = supportedCandidates.slice(0, options.limit);
    const selectedCompanies = [...new Set(selected.map((job) => job.company))];
    const primaryRole = parsePrimaryRole(user.targetRole);
    const resume = await matchUserResume(user.id, primaryRole, primaryRole);
    if (!resume) {
      throw new Error("Integration test user has no matched resume.");
    }

    console.log("Selected jobs:");
    for (const job of selected) {
      console.log(
        `  - [${job.atsType}] ${(job.score * 100).toFixed(0)} ${job.company}: ${job.title}`
      );
    }

    const planned = await createPlannedBrowseSession({
      userId: user.id,
      targetRole: primaryRole,
      matchedJobs: selected.map((job) => ({
        id: job.id,
        title: job.title,
        applyUrl: job.applyUrl,
        company: job.company,
        companySlug: job.companySlug,
        score: job.score,
        matchReason: job.matchReason,
      })),
      resumeUrl: resume.blobUrl,
      resumeName: resume.fileName,
      companies: selectedCompanies,
      totalCompanies: selectedCompanies.length,
    });

    console.log(
      `Planned session ${planned.sessionId}: ${planned.planning.autoSubmitCount} auto-submit, ` +
      `${planned.planning.pendingReviewCount} review, ${planned.planning.skippedCount} skipped, ` +
      `status=${planned.planning.sessionStatus}`
    );

    if (options.planOnly || planned.planning.autoSubmitCount === 0) {
      if (planned.planning.autoSubmitCount === 0) {
        console.log("No graph-approved jobs were ready to submit, so execution stopped after planning.");
      }
      return;
    }

    const processed = await processBrowseSessionById(planned.sessionId);
    if (!processed) {
      throw new Error(
        `Session ${planned.sessionId} was not claimed for execution. It may no longer be queued.`
      );
    }

    const [sessionSummary, discoveries, reviewTasks] = await Promise.all([
      prisma.browseSession.findUnique({
        where: { id: planned.sessionId },
        select: {
          id: true,
          status: true,
          jobsApplied: true,
          jobsFailed: true,
          jobsSkipped: true,
          jobsFound: true,
          errorMessage: true,
          startedAt: true,
          completedAt: true,
        },
      }),
      prisma.browseDiscovery.findMany({
        where: { sessionId: planned.sessionId },
        orderBy: { createdAt: "asc" },
        select: {
          company: true,
          jobTitle: true,
          status: true,
          graphStatus: true,
          planningDecision: true,
          atsType: true,
          errorMessage: true,
        },
      }),
      prisma.reviewTask.findMany({
        where: { sessionId: planned.sessionId },
        orderBy: { createdAt: "asc" },
        select: {
          title: true,
          status: true,
          reason: true,
        },
      }),
    ]);

    if (!sessionSummary) {
      throw new Error(`Session ${planned.sessionId} disappeared before summary readback.`);
    }

    console.log("");
    console.log(`Session ${sessionSummary.id}`);
    console.log(`  status=${sessionSummary.status}`);
    console.log(`  jobsApplied=${sessionSummary.jobsApplied} jobsFailed=${sessionSummary.jobsFailed} jobsSkipped=${sessionSummary.jobsSkipped} jobsFound=${sessionSummary.jobsFound}`);
    if (sessionSummary.errorMessage) {
      console.log(`  error=${sessionSummary.errorMessage}`);
    }

    console.log("");
    console.log("Discoveries:");
    for (const discovery of discoveries) {
      console.log(
        `  - [${discovery.status}] [${discovery.atsType || "unknown"}] ` +
        `${discovery.company}: ${discovery.jobTitle} ` +
        `(decision=${discovery.planningDecision || "n/a"}, graph=${discovery.graphStatus || "n/a"})`
      );
      if (discovery.errorMessage) {
        console.log(`      ${discovery.errorMessage.slice(0, 240)}`);
      }
    }

    if (reviewTasks.length > 0) {
      console.log("");
      console.log("Review tasks:");
      for (const task of reviewTasks) {
        console.log(`  - [${task.status}] ${task.title}`);
        if (task.reason) {
          console.log(`      ${task.reason.slice(0, 240)}`);
        }
      }
    }
  } finally {
    const { closeBrowser } = await import("../worker/src/apply-engine.ts");
    await closeBrowser().catch(() => {});
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
