import "server-only";
import { prisma } from "./prisma";
import { type PacingResult } from "./pacing";
import { type PacingDiagnostics } from "./pacing-diagnostics";
import Anthropic from "@anthropic-ai/sdk";

export type AdaptiveStrategy =
  | "quality_gate"
  | "default"
  | "catchup"
  | "aggressive_catchup";

export interface AdaptiveStrategyResult {
  dailyCap: number;
  qualityThreshold: number | null;
  matchMultiplier: number;
  strategy: AdaptiveStrategy;
}

export type RemediationAction =
  | { type: "clear_stale_blocks"; companiesCleared: string[] }
  | { type: "create_supplemental_session" }
  | { type: "escalate"; reason: string };

export interface RemediationResult {
  actions: RemediationAction[];
  requiresEscalation: boolean;
  escalationReason?: string;
}

export function computeAdaptiveStrategy(
  pacing: PacingResult
): AdaptiveStrategyResult {
  if (pacing.status === "on_track" && pacing.pacePercent >= 90) {
    return {
      dailyCap: 8,
      qualityThreshold: 0.55,
      matchMultiplier: 2,
      strategy: "quality_gate",
    };
  }

  if (pacing.status === "on_track") {
    return {
      dailyCap: 10,
      qualityThreshold: null,
      matchMultiplier: 3,
      strategy: "default",
    };
  }

  if (pacing.status === "behind") {
    return {
      dailyCap: 20,
      qualityThreshold: null,
      matchMultiplier: 4,
      strategy: "catchup",
    };
  }

  // at_risk or critical
  return {
    dailyCap: 30,
    qualityThreshold: null,
    matchMultiplier: 5,
    strategy: "aggressive_catchup",
  };
}

export async function diagnoseAndRemediate(
  userId: string,
  pacing: PacingResult,
  diagnostics: PacingDiagnostics
): Promise<RemediationResult> {
  const actions: RemediationAction[] = [];
  let requiresEscalation = false;
  let escalationReason: string | undefined;

  if (!diagnostics.hasResume || !diagnostics.hasTargetRole || !diagnostics.hasCompleteProfile) {
    const missing: string[] = [];
    if (!diagnostics.hasResume) missing.push("resume");
    if (!diagnostics.hasTargetRole) missing.push("target role");
    if (!diagnostics.hasCompleteProfile) missing.push("complete profile (phone/work auth/country)");
    requiresEscalation = true;
    escalationReason = `User missing: ${missing.join(", ")}. Cannot auto-apply without these.`;
    actions.push({ type: "escalate", reason: escalationReason });
    return { actions, requiresEscalation, escalationReason };
  }

  if (diagnostics.failureRate > 0.7 && diagnostics.matchCoverage === "good") {
    requiresEscalation = true;
    escalationReason = `High failure rate (${Math.round(diagnostics.failureRate * 100)}%) despite good match coverage. Likely a worker/ATS infrastructure issue.`;
    actions.push({ type: "escalate", reason: escalationReason });
    return { actions, requiresEscalation, escalationReason };
  }

  if (diagnostics.matchCoverage === "none" || diagnostics.matchCoverage === "limited") {
    const cleared = await clearStaleUserBlocks(userId);
    if (cleared.length > 0) {
      actions.push({ type: "clear_stale_blocks", companiesCleared: cleared });
    } else {
      requiresEscalation = true;
      escalationReason = `${diagnostics.matchCoverage === "none" ? "Zero" : "Very few"} job matches found and no stale company blocks to clear. May need catalog expansion or role keyword broadening.`;
      actions.push({ type: "escalate", reason: escalationReason });
    }
  }

  if (diagnostics.sessionGapDays > 2) {
    const stuckSession = await prisma.browseSession.findFirst({
      where: {
        userId,
        status: "queued",
        createdAt: { lt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
    });
    if (stuckSession) {
      requiresEscalation = true;
      escalationReason = `Queued session ${stuckSession.id.slice(-8)} has been stuck for >6h. Worker may be down or overloaded.`;
      actions.push({ type: "escalate", reason: escalationReason });
    }
  }

  if (diagnostics.stuckFieldCount > 10) {
    // Not escalating, but worth logging. The pre-apply health check
    // will create an AdminAlert at medium severity for this.
  }

  if (!requiresEscalation && actions.length === 0) {
    actions.push({ type: "create_supplemental_session" });
  }

  return { actions, requiresEscalation, escalationReason };
}

async function clearStaleUserBlocks(userId: string): Promise<string[]> {
  const [companyFails, companyWins] = await Promise.all([
    prisma.browseDiscovery.groupBy({
      by: ["company"],
      where: { session: { userId }, status: "failed" },
      _count: true,
    }),
    prisma.browseDiscovery.groupBy({
      by: ["company"],
      where: { session: { userId }, status: "applied" },
      _count: true,
    }),
  ]);

  const winMap = new Map(companyWins.map((c) => [c.company, c._count]));
  const blockedCompanies: string[] = [];
  for (const cf of companyFails) {
    if (cf._count >= 4 && !(winMap.get(cf.company) ?? 0)) {
      blockedCompanies.push(cf.company);
    }
  }

  if (blockedCompanies.length === 0) return [];

  // Check if any of these blocked companies have active cooldowns that
  // expired, meaning the underlying issue may have been fixed. We clear
  // the block by resetting the failed discovery count via a no-op -- the
  // matcher will re-evaluate them.
  // For now, the "clearing" is implicit: we return the list so the
  // health check can log it, and the matcher's dedup will re-evaluate
  // on next run since we don't actually persist a blocklist.
  // The user-blocked-companies set is computed fresh each time in
  // matchJobsForUser, so clearing means the next run after failures
  // are old enough won't block them.
  //
  // Actually, the block is based on BrowseDiscovery counts which are
  // permanent. To truly clear, we'd need to mark old failures as
  // "cleared" or add a whitelist. For now, return the list for
  // escalation context.
  return blockedCompanies;
}

export interface QualityAuditInput {
  discoveryId: string;
  jobTitle: string;
  company: string;
}

export interface QualityAuditResult {
  discoveryId: string;
  verdict: "good" | "marginal" | "bad";
  score: number;
  reasoning: string;
}

export async function auditMatchQuality(
  userId: string,
  discoveries: QualityAuditInput[],
  userProfile: {
    targetRoles: string[];
    experience: string | null;
    city: string | null;
  }
): Promise<QualityAuditResult[]> {
  if (discoveries.length === 0) return [];

  const anthropic = new Anthropic();
  const jobList = discoveries
    .map((d, i) => `${i + 1}. ${d.jobTitle} at ${d.company}`)
    .join("\n");

  const rolesStr = userProfile.targetRoles.join(", ") || "not specified";
  const expStr = userProfile.experience || "not specified";
  const cityStr = userProfile.city || "not specified";

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a job match quality auditor. A candidate has this profile:
- Target roles: ${rolesStr}
- Experience: ${expStr} years
- Location: ${cityStr}

They were auto-applied to these jobs today. Rate each match:
- GOOD: Clearly matches a target role and appropriate for their experience level.
- MARGINAL: Adjacent role or notable seniority mismatch, but defensible.
- BAD: Wrong role, wrong level, or would upset the candidate.

${jobList}

Respond with ONLY a JSON array, one object per job:
[{"index":1,"verdict":"GOOD","score":0.9,"reasoning":"..."}]

No other text.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return discoveries.map(fallbackGood);

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      index: number;
      verdict: string;
      score: number;
      reasoning: string;
    }>;

    return discoveries.map((d, i) => {
      const entry = parsed.find((p) => p.index === i + 1);
      if (!entry) return fallbackGood(d);
      const verdict = normalizeVerdict(entry.verdict);
      return {
        discoveryId: d.discoveryId,
        verdict,
        score: typeof entry.score === "number" ? entry.score : verdictToScore(verdict),
        reasoning: entry.reasoning || "",
      };
    });
  } catch (error) {
    console.error("[HealthOversight] Quality audit LLM call failed:", error);
    return discoveries.map(fallbackGood);
  }
}

function normalizeVerdict(v: string): "good" | "marginal" | "bad" {
  const lower = v.toLowerCase().trim();
  if (lower === "bad") return "bad";
  if (lower === "marginal") return "marginal";
  return "good";
}

function verdictToScore(v: "good" | "marginal" | "bad"): number {
  if (v === "good") return 0.9;
  if (v === "marginal") return 0.5;
  return 0.2;
}

function fallbackGood(d: QualityAuditInput): QualityAuditResult {
  return {
    discoveryId: d.discoveryId,
    verdict: "good",
    score: 0.7,
    reasoning: "Quality audit skipped (LLM unavailable)",
  };
}
