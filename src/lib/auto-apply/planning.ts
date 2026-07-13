import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import {
  END,
  START,
  StateGraph,
  StateSchema,
  UntrackedValue,
} from "@langchain/langgraph";
import { prisma } from "@/lib/prisma";
import { matchUserResume } from "@/lib/resume-matcher";
import type { ApplicantProfile } from "./types";
import {
  analyzeAtsRequirements,
  detectAtsType,
  isSupportedAts,
  type FormAnalysis,
  type SupportedAts,
} from "./ats";
import {
  AUTO_SUBMIT_THRESHOLD,
  REVIEW_THRESHOLD,
  bucketConfidence,
  derivePlanningDecision,
  normalizeMatchScore,
  type ConfidenceBucket,
  type PlanningDecision,
} from "./planning-policy";

export interface PlanningCandidateJob {
  id: string;
  title: string;
  applyUrl: string;
  company: string;
  companySlug: string;
  score: number;
  matchReason?: string;
}

export interface PlanningSummary {
  planningRunId: string;
  pendingReviewCount: number;
  autoSubmitCount: number;
  skippedCount: number;
  sessionStatus: string;
}

interface PlanningApplicant {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredName: string | null;
  pronouns: string | null;
  usState: string | null;
  workAuthorized: boolean | null;
  needsSponsorship: boolean | null;
  countryOfResidence: string | null;
  willingToRelocate: boolean | null;
  remotePreference: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  currentEmployer: string | null;
  currentTitle: string | null;
  school: string | null;
  degree: string | null;
  graduationYear: string | null;
  additionalCerts: string | null;
  city: string | null;
  yearsOfExperience: string | null;
  salaryExpectation: string | null;
  earliestStartDate: string | null;
  gender: string | null;
  race: string | null;
  hispanicOrLatino: string | null;
  veteranStatus: string | null;
  disabilityStatus: string | null;
  applicationAnswers: string | null;
  targetRole: string | null;
}

interface PlanningGraphState {
  planningRunId: string;
  sessionId: string;
  userId: string;
  applicant: PlanningApplicant;
  job: PlanningCandidateJob;
  matchedResumeUrl?: string;
  matchedResumeName?: string;
  atsType?: SupportedAts;
  jobDescriptionSnapshot?: string;
  formAnalysis?: FormAnalysis;
  confidenceScore?: number;
  confidenceBucket?: ConfidenceBucket;
  confidenceReasons?: string[];
  planningDecision?: PlanningDecision;
  decisionReasons?: string[];
  personalizedWritingRequired?: boolean;
  customWritingDraft?: string;
  customWritingFormat?: "text" | "json";
  discoveryId?: string;
}

const GRAPH_VERSION = "agentic-auto-apply-v1";
const PlanningStateSchema = new StateSchema({
  planningRunId: new UntrackedValue<string>(),
  sessionId: new UntrackedValue<string>(),
  userId: new UntrackedValue<string>(),
  applicant: new UntrackedValue<PlanningApplicant>(),
  job: new UntrackedValue<PlanningCandidateJob>(),
  matchedResumeUrl: new UntrackedValue<string | undefined>(),
  matchedResumeName: new UntrackedValue<string | undefined>(),
  atsType: new UntrackedValue<SupportedAts | undefined>(),
  jobDescriptionSnapshot: new UntrackedValue<string | undefined>(),
  formAnalysis: new UntrackedValue<FormAnalysis | undefined>(),
  confidenceScore: new UntrackedValue<number | undefined>(),
  confidenceBucket: new UntrackedValue<ConfidenceBucket | undefined>(),
  confidenceReasons: new UntrackedValue<string[] | undefined>(),
  planningDecision: new UntrackedValue<PlanningDecision | undefined>(),
  decisionReasons: new UntrackedValue<string[] | undefined>(),
  personalizedWritingRequired: new UntrackedValue<boolean | undefined>(),
  customWritingDraft: new UntrackedValue<string | undefined>(),
  customWritingFormat: new UntrackedValue<"text" | "json" | undefined>(),
  discoveryId: new UntrackedValue<string | undefined>(),
});

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: "unserializable" });
  }
}

function stateSnapshot(state: PlanningGraphState) {
  return {
    sessionId: state.sessionId,
    planningRunId: state.planningRunId,
    job: {
      title: state.job.title,
      company: state.job.company,
      applyUrl: state.job.applyUrl,
    },
    atsType: state.atsType,
    confidenceScore: state.confidenceScore,
    confidenceBucket: state.confidenceBucket,
    planningDecision: state.planningDecision,
    personalizedWritingRequired: state.personalizedWritingRequired,
    requiredFreeTextPrompts: state.formAnalysis?.requiredFreeTextPrompts.length ?? 0,
    unresolvedRequiredQuestions: state.formAnalysis?.unresolvedRequiredQuestions.length ?? 0,
  };
}

async function recordPlanningEvent(
  planningRunId: string,
  node: string,
  status: string,
  payload: unknown,
  discoveryId?: string
) {
  await prisma.planningRunEvent.create({
    data: {
      planningRunId,
      discoveryId: discoveryId || undefined,
      node,
      status,
      payload: safeJson(payload),
    },
  });
}

async function updatePlanningRunSnapshot(planningRunId: string, state: PlanningGraphState) {
  await prisma.planningRun.update({
    where: { id: planningRunId },
    data: {
      stateSnapshot: safeJson(stateSnapshot(state)),
    },
  });
}

async function runNode(
  node: string,
  state: PlanningGraphState,
  handler: (state: PlanningGraphState) => Promise<Partial<PlanningGraphState>>
): Promise<Partial<PlanningGraphState>> {
  await recordPlanningEvent(state.planningRunId, node, "started", stateSnapshot(state), state.discoveryId);
  const update = await handler(state);
  const nextState = { ...state, ...update };
  await updatePlanningRunSnapshot(state.planningRunId, nextState);
  await recordPlanningEvent(state.planningRunId, node, "completed", stateSnapshot(nextState), nextState.discoveryId);
  return update;
}

function applicantToProfile(applicant: PlanningApplicant): ApplicantProfile {
  return {
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    email: applicant.email,
    phone: applicant.phone,
    resumeUrl: "",
    resumeName: "",
    preferredName: applicant.preferredName,
    pronouns: applicant.pronouns,
    usState: applicant.usState,
    workAuthorized: applicant.workAuthorized,
    needsSponsorship: applicant.needsSponsorship,
    countryOfResidence: applicant.countryOfResidence,
    willingToRelocate: applicant.willingToRelocate,
    remotePreference: applicant.remotePreference,
    linkedinUrl: applicant.linkedinUrl,
    githubUrl: applicant.githubUrl,
    websiteUrl: applicant.websiteUrl,
    currentEmployer: applicant.currentEmployer,
    currentTitle: applicant.currentTitle,
    school: applicant.school,
    degree: applicant.degree,
    graduationYear: applicant.graduationYear,
    additionalCerts: applicant.additionalCerts,
    city: applicant.city,
    yearsOfExperience: applicant.yearsOfExperience,
    salaryExpectation: applicant.salaryExpectation,
    earliestStartDate: applicant.earliestStartDate,
    gender: applicant.gender,
    race: applicant.race,
    hispanicOrLatino: applicant.hispanicOrLatino,
    veteranStatus: applicant.veteranStatus,
    disabilityStatus: applicant.disabilityStatus,
    applicationAnswers: applicant.applicationAnswers,
  };
}

function buildFallbackDraft(state: PlanningGraphState): string {
  const applicant = state.applicant;
  const summary = applicant.currentTitle
    ? `${applicant.currentTitle}${applicant.currentEmployer ? ` at ${applicant.currentEmployer}` : ""}`
    : "software engineer";
  const experience = applicant.yearsOfExperience || "several";
  const descriptionSnippet = state.jobDescriptionSnapshot
    ? state.jobDescriptionSnapshot.slice(0, 220)
    : "";
  return [
    `Dear ${state.job.company} hiring team,`,
    "",
    `I'm excited to apply for the ${state.job.title} role. I'm currently working as ${summary} with ${experience} years of experience, and I build products that improve reliability, execution speed, and day-to-day user experience.`,
    descriptionSnippet
      ? `What stood out to me in the role is the emphasis on ${descriptionSnippet.toLowerCase()}.`
      : `This role stands out because it aligns with the work I want to keep doing at a high level.`,
    `I would love to bring that experience to ${state.job.company} and contribute with curiosity, strong execution, and ownership.`,
    "",
    `Best regards,`,
    `${applicant.firstName} ${applicant.lastName}`,
  ].join("\n");
}

async function generatePersonalizedDraft(state: PlanningGraphState): Promise<{
  draft: string;
  format: "text" | "json";
}> {
  const prompts = state.formAnalysis?.requiredFreeTextPrompts || [];
  const coverLetterOnly =
    state.formAnalysis?.coverLetterRequired === true &&
    prompts.length <= 1 &&
    (prompts.length === 0 || /cover letter/i.test(prompts[0]));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !state.jobDescriptionSnapshot) {
    return {
      draft: buildFallbackDraft(state),
      format: coverLetterOnly ? "text" : "json",
    };
  }

  const anthropic = new Anthropic({ apiKey });
  const prompt = coverLetterOnly
    ? `Write a concise, specific cover letter for ${state.job.title} at ${state.job.company}.

Candidate:
- Name: ${state.applicant.firstName} ${state.applicant.lastName}
- Current title: ${state.applicant.currentTitle || "Not specified"}
- Current employer: ${state.applicant.currentEmployer || "Not specified"}
- Experience: ${state.applicant.yearsOfExperience || "Not specified"} years
- Target role: ${state.applicant.targetRole || "Not specified"}

Job description:
${state.jobDescriptionSnapshot}

Requirements:
- 180 to 260 words
- Specific to this role and company
- No invented facts
- Plain text only`
    : `Write concise draft answers for the following application prompts for ${state.job.title} at ${state.job.company}.

Candidate:
- Name: ${state.applicant.firstName} ${state.applicant.lastName}
- Current title: ${state.applicant.currentTitle || "Not specified"}
- Current employer: ${state.applicant.currentEmployer || "Not specified"}
- Experience: ${state.applicant.yearsOfExperience || "Not specified"} years
- Target role: ${state.applicant.targetRole || "Not specified"}

Job description:
${state.jobDescriptionSnapshot}

Prompts:
${prompts.map((item, index) => `${index + 1}. ${item}`).join("\n")}

Return ONLY valid JSON with one top-level object that maps each prompt string to a concise answer. Do not invent facts.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    if (!text) {
      return {
        draft: buildFallbackDraft(state),
        format: coverLetterOnly ? "text" : "json",
      };
    }
    return {
      draft: text,
      format: coverLetterOnly ? "text" : "json",
    };
  } catch {
    return {
      draft: buildFallbackDraft(state),
      format: coverLetterOnly ? "text" : "json",
    };
  }
}

async function persistDiscovery(state: PlanningGraphState): Promise<Partial<PlanningGraphState>> {
  const confidenceScore = state.confidenceScore ?? 0;
  const confidenceBucket = state.confidenceBucket ?? bucketConfidence(confidenceScore);
  const decision = state.planningDecision ?? "skip";
  const decisionReasons = state.decisionReasons || [];
  const prompts = state.formAnalysis?.requiredFreeTextPrompts || [];
  const unresolved = state.formAnalysis?.unresolvedRequiredQuestions || [];
  const draft = state.customWritingDraft;
  const payload = {
    graphVersion: GRAPH_VERSION,
    decisionReasons,
    promptLabels: prompts,
    unresolvedRequiredQuestions: unresolved,
    customWritingFormat: state.customWritingFormat || null,
  };

  const discovery = await prisma.browseDiscovery.upsert({
    where: {
      sessionId_applyUrl: {
        sessionId: state.sessionId,
        applyUrl: state.job.applyUrl,
      },
    },
    create: {
      sessionId: state.sessionId,
      company: state.job.company,
      jobTitle: state.job.title,
      applyUrl: state.job.applyUrl,
      status: decision === "skip" ? "skipped" : "found",
      errorMessage: decision === "skip" ? decisionReasons.join(" · ") : null,
      matchScore: Math.round(confidenceScore * 100),
      matchReason: state.confidenceReasons?.join(" · ") || state.job.matchReason || null,
      atsType: state.atsType,
      jobDescriptionSnapshot: state.jobDescriptionSnapshot,
      confidenceScore,
      confidenceBucket,
      confidenceReasons: safeJson(state.confidenceReasons || []),
      graphStatus:
        decision === "auto_submit"
          ? "ready_to_submit"
          : decision === "review"
            ? "needs_review"
            : "skipped",
      planningDecision: decision,
      userActionRequired: decision === "review",
      personalizedWritingRequired: state.personalizedWritingRequired === true,
      customWritingDraft: draft || null,
      customWritingFinal: null,
      planPayload: safeJson(payload),
      graphThreadId: state.planningRunId,
    },
    update: {
      status: decision === "skip" ? "skipped" : "found",
      errorMessage: decision === "skip" ? decisionReasons.join(" · ") : null,
      matchScore: Math.round(confidenceScore * 100),
      matchReason: state.confidenceReasons?.join(" · ") || state.job.matchReason || null,
      atsType: state.atsType,
      jobDescriptionSnapshot: state.jobDescriptionSnapshot,
      confidenceScore,
      confidenceBucket,
      confidenceReasons: safeJson(state.confidenceReasons || []),
      graphStatus:
        decision === "auto_submit"
          ? "ready_to_submit"
          : decision === "review"
            ? "needs_review"
            : "skipped",
      planningDecision: decision,
      userActionRequired: decision === "review",
      personalizedWritingRequired: state.personalizedWritingRequired === true,
      customWritingDraft: draft || null,
      planPayload: safeJson(payload),
      graphThreadId: state.planningRunId,
      reviewedAt: null,
      customWritingApprovedAt: null,
    },
    select: { id: true },
  });

  if (decision === "review") {
    await prisma.reviewTask.upsert({
      where: { discoveryId: discovery.id },
      create: {
        discoveryId: discovery.id,
        planningRunId: state.planningRunId,
        sessionId: state.sessionId,
        userId: state.userId,
        type: state.personalizedWritingRequired ? "custom_writing" : "match_review",
        status: "pending",
        title: `Review ${state.job.title} at ${state.job.company}`,
        prompt: prompts.length > 0 ? prompts.join("\n") : null,
        reason: decisionReasons.join(" · "),
        requiredActions: safeJson({
          prompts,
          unresolvedRequiredQuestions: unresolved,
        }),
        draft: draft || null,
      },
      update: {
        planningRunId: state.planningRunId,
        sessionId: state.sessionId,
        userId: state.userId,
        type: state.personalizedWritingRequired ? "custom_writing" : "match_review",
        status: "pending",
        title: `Review ${state.job.title} at ${state.job.company}`,
        prompt: prompts.length > 0 ? prompts.join("\n") : null,
        reason: decisionReasons.join(" · "),
        requiredActions: safeJson({
          prompts,
          unresolvedRequiredQuestions: unresolved,
        }),
        draft: draft || null,
        editedDraft: null,
        reviewerNotes: null,
        approvedAt: null,
        rejectedAt: null,
        reviewedAt: null,
      },
    });
  } else {
    await prisma.reviewTask.deleteMany({
      where: { discoveryId: discovery.id },
    });
  }

  return { discoveryId: discovery.id };
}

async function loadApplicant(userId: string): Promise<PlanningApplicant | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      preferredName: true,
      pronouns: true,
      usState: true,
      workAuthorized: true,
      needsSponsorship: true,
      countryOfResidence: true,
      willingToRelocate: true,
      remotePreference: true,
      linkedinUrl: true,
      githubUrl: true,
      websiteUrl: true,
      currentEmployer: true,
      currentTitle: true,
      school: true,
      degree: true,
      graduationYear: true,
      additionalCerts: true,
      city: true,
      yearsOfExperience: true,
      salaryExpectation: true,
      earliestStartDate: true,
      gender: true,
      race: true,
      hispanicOrLatino: true,
      veteranStatus: true,
      disabilityStatus: true,
      applicationAnswers: true,
      targetRole: true,
    },
  });

  if (!user?.firstName || !user.lastName || !user.email || !user.phone) {
    return null;
  }

  return {
    ...user,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
  };
}

let planningGraph: ReturnType<typeof createCompiledPlanningGraph> | null = null;

function createCompiledPlanningGraph() {
  const graph = new StateGraph(PlanningStateSchema)
    .addNode("profile_parse", async (state: PlanningGraphState) =>
      runNode("profile_parse", state, async (currentState) => {
        const resume = await matchUserResume(
          currentState.userId,
          currentState.job.title,
          currentState.applicant.targetRole || undefined
        );
        return {
          matchedResumeUrl: resume?.blobUrl,
          matchedResumeName: resume?.fileName,
          atsType: detectAtsType(currentState.job.applyUrl),
        };
      })
    )
    .addNode("job_research", async (state: PlanningGraphState) =>
      runNode("job_research", state, async (currentState) => {
        const jobRecord = await prisma.job.findUnique({
          where: { id: currentState.job.id },
          select: { description: true },
        });
        const jobDescriptionSnapshot = (jobRecord?.description || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 4000);
        const formAnalysis = await analyzeAtsRequirements(
          currentState.job.applyUrl,
          applicantToProfile(currentState.applicant)
        );

        return {
          atsType: formAnalysis.atsType,
          jobDescriptionSnapshot,
          formAnalysis,
          personalizedWritingRequired:
            formAnalysis.coverLetterRequired ||
            formAnalysis.requiredFreeTextPrompts.length > 0,
        };
      })
    )
    .addNode("match_score", async (state: PlanningGraphState) =>
      runNode("match_score", state, async (currentState) => {
        const confidenceScore = normalizeMatchScore(currentState.job.score);
        const confidenceReasons = [
          currentState.job.matchReason || "Matched from role and profile heuristics",
          `ATS: ${currentState.atsType || "unknown"}`,
        ];
        if (!isSupportedAts(currentState.atsType || "unsupported")) {
          confidenceReasons.push("Portal is outside supported ATS families");
        }
        if ((currentState.formAnalysis?.unresolvedRequiredQuestions.length || 0) > 0) {
          confidenceReasons.push("Required fields need review");
        }
        if (currentState.personalizedWritingRequired) {
          confidenceReasons.push("Personalized writing required");
        }

        return {
          confidenceScore,
          confidenceBucket: bucketConfidence(confidenceScore),
          confidenceReasons,
        };
      })
    )
    .addNode("artifact_write", async (state: PlanningGraphState) =>
      runNode("artifact_write", state, async (currentState) => {
        if (!currentState.personalizedWritingRequired) {
          return {
            customWritingDraft: undefined,
            customWritingFormat: undefined,
          };
        }
        const writing = await generatePersonalizedDraft(currentState);
        return {
          customWritingDraft: writing.draft,
          customWritingFormat: writing.format,
        };
      })
    )
    .addNode("review_gate", async (state: PlanningGraphState) =>
      runNode("review_gate", state, async (currentState) => {
        const confidenceScore = currentState.confidenceScore || 0;
        const decision = derivePlanningDecision({
          atsType: currentState.atsType || "unsupported",
          confidenceScore,
          personalizedWritingRequired: currentState.personalizedWritingRequired === true,
          unresolvedRequiredQuestions:
            currentState.formAnalysis?.unresolvedRequiredQuestions || [],
        });

        return {
          planningDecision: decision.decision,
          decisionReasons: decision.reasons,
        };
      })
    )
    .addNode("ready_to_submit", async (state: PlanningGraphState) =>
      runNode("ready_to_submit", state, async (currentState) =>
        persistDiscovery(currentState)
      )
    )
    .addEdge(START, "profile_parse")
    .addEdge("profile_parse", "job_research")
    .addEdge("job_research", "match_score")
    .addEdge("match_score", "artifact_write")
    .addEdge("artifact_write", "review_gate")
    .addEdge("review_gate", "ready_to_submit")
    .addEdge("ready_to_submit", END);

  return graph.compile();
}

function getPlanningGraph() {
  if (!planningGraph) {
    planningGraph = createCompiledPlanningGraph();
  }
  return planningGraph;
}

export async function planBrowseSession(args: {
  sessionId: string;
  userId: string;
  matchedJobs: PlanningCandidateJob[];
}): Promise<PlanningSummary> {
  const applicant = await loadApplicant(args.userId);
  if (!applicant) {
    throw new Error("Incomplete applicant profile for planning");
  }

  const planningRun = await prisma.planningRun.create({
    data: {
      sessionId: args.sessionId,
      userId: args.userId,
      status: "running",
      graphVersion: GRAPH_VERSION,
      startedAt: new Date(),
    },
  });

  await prisma.browseSession.update({
    where: { id: args.sessionId },
    data: {
      jobsFound: args.matchedJobs.length,
    },
  });

  try {
    const graph = getPlanningGraph();
    for (const job of args.matchedJobs) {
      await graph.invoke({
        planningRunId: planningRun.id,
        sessionId: args.sessionId,
        userId: args.userId,
        applicant,
        job,
      });
    }

    const [readyToSubmit, pendingReview, skipped] = await Promise.all([
      prisma.browseDiscovery.count({
        where: {
          sessionId: args.sessionId,
          planningDecision: "auto_submit",
          graphStatus: "ready_to_submit",
        },
      }),
      prisma.reviewTask.count({
        where: {
          planningRunId: planningRun.id,
          status: "pending",
        },
      }),
      prisma.browseDiscovery.count({
        where: {
          sessionId: args.sessionId,
          planningDecision: "skip",
        },
      }),
    ]);

    const sessionStatus =
      readyToSubmit > 0
        ? "queued"
        : pendingReview > 0
          ? "awaiting_review"
          : "completed";

    await prisma.planningRun.update({
      where: { id: planningRun.id },
      data: {
        status: "completed",
        pendingReviewCount: pendingReview,
        autoSubmitCount: readyToSubmit,
        skippedCount: skipped,
        completedAt: new Date(),
      },
    });

    await prisma.browseSession.update({
      where: { id: args.sessionId },
      data: {
        status: sessionStatus,
        completedAt: sessionStatus === "completed" ? new Date() : null,
      },
    });

    return {
      planningRunId: planningRun.id,
      pendingReviewCount: pendingReview,
      autoSubmitCount: readyToSubmit,
      skippedCount: skipped,
      sessionStatus,
    };
  } catch (error) {
    await prisma.planningRun.update({
      where: { id: planningRun.id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Planning failed",
        completedAt: new Date(),
      },
    });
    await prisma.browseSession.update({
      where: { id: args.sessionId },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Planning failed",
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
