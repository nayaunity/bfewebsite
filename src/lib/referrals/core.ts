import { ROLE_OPTIONS } from "../role-options.ts";
import { TIER_LIMITS } from "../plan-limits.ts";

export const REFERRAL_STATUSES = [
  "preview",
  "queued",
  "packet_ready",
  "awaiting_send",
  "sent",
  "follow_up_due",
  "intro_made",
  "interview",
  "offer",
  "hired",
  "closed_no_response",
  "closed_declined",
] as const;

export type ReferralRequestStatus = (typeof REFERRAL_STATUSES)[number];

export const TERMINAL_REFERRAL_STATUSES = new Set<ReferralRequestStatus>([
  "hired",
  "closed_no_response",
  "closed_declined",
]);

export const LIVE_REFERRAL_STATUSES = new Set<ReferralRequestStatus>([
  "queued",
  "packet_ready",
  "awaiting_send",
  "sent",
  "follow_up_due",
  "intro_made",
  "interview",
  "offer",
]);

const COMPANY_SUFFIXES = /\b(incorporated|inc|llc|ltd|corp|corporation|company|co|plc|gmbh|ag)\b/gi;
const KNOWN_SHORT_TERMS = new Set(["ai", "ml", "ui", "ux", "qa", "sre", "nlp", "llm"]);
const GENERIC_WORDS = new Set([
  "engineer",
  "developer",
  "manager",
  "lead",
  "senior",
  "junior",
  "principal",
  "director",
  "head",
  "staff",
]);

function collapseWhitespace(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

export interface LinkedInConnectionInput {
  fullName: string;
  headline?: string | null;
  currentCompany?: string | null;
  location?: string | null;
  profileUrl: string;
  avatarUrl?: string | null;
  linkedinPublicId?: string | null;
}

export interface LinkedInConnectionSummary {
  id: string;
  fullName: string;
  headline: string | null;
  currentCompany: string | null;
  companySlug: string | null;
  location: string | null;
  profileUrl: string;
  avatarUrl: string | null;
  status: string;
  lastSyncedAt: string;
}

export interface WarmMatch {
  jobId: string;
  title: string;
  company: string;
  companySlug: string;
  location: string;
  applyUrl: string;
  postedAt: string | null;
  score: number;
  matchReason: string;
  connection: LinkedInConnectionSummary;
}

export interface ReferralPacket {
  subjectLine: string;
  suggestedMessage: string;
  whyMeBullets: string[];
  followUpChecklist: string[];
  connectionContext: string;
  recommendedResumeName: string | null;
}

export interface ReferralAccessSummary {
  canPreview: boolean;
  canSubmitLive: boolean;
  previewReason: string | null;
  liveReason: string | null;
  tier: string;
  subscriptionStatus: string;
  monthlyUsed: number;
  monthlyLimit: number;
  concurrentUsed: number;
  concurrentLimit: number;
}

export interface ReferralPacketInput {
  userFirstName?: string | null;
  userLastName?: string | null;
  userCurrentTitle?: string | null;
  userCurrentEmployer?: string | null;
  yearsOfExperience?: string | null;
  city?: string | null;
  targetRoles?: string[];
  linkedinUrl?: string | null;
  jobTitle: string;
  company: string;
  applyUrl: string;
  connectionFirstName: string;
  connectionFullName: string;
  connectionHeadline?: string | null;
  resumeName?: string | null;
}

export function slugifyCompanyName(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value
    .trim()
    .replace(/^the\s+/i, "")
    .replace(COMPANY_SUFFIXES, "")
    .replace(/&/g, " and ")
    .replace(/['".,()/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (!cleaned) return null;

  return cleaned
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim() || null;
}

export function normalizeLinkedInProfileUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(trimmed, "https://www.linkedin.com");
    const path = url.pathname
      .replace(/\/+$/, "")
      .replace(/^\/(in|pub)\//, "/in/");
    return `https://www.linkedin.com${path}`;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

export function extractLinkedInPublicId(value: string): string | null {
  const normalized = normalizeLinkedInProfileUrl(value);
  const match = normalized.match(/linkedin\.com\/in\/([^/?#]+)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

export function cleanLinkedInConnectionHeadline(
  headline: string | null | undefined,
  fullName?: string | null
): string | null {
  let cleaned = collapseWhitespace(headline);
  if (!cleaned) return null;

  cleaned = cleaned.replace(/\s+Connected on\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}$/i, "").trim();
  if (!cleaned) return null;

  const normalizedName = collapseWhitespace(fullName);
  if (normalizedName) {
    if (cleaned.startsWith(normalizedName)) {
      cleaned = collapseWhitespace(cleaned.slice(normalizedName.length));
    } else {
      const compactName = normalizedName.replace(/\s+/g, "");
      const compactHeadline = cleaned.replace(/\s+/g, "");
      if (compactHeadline.startsWith(compactName)) {
        const suffix = compactHeadline.slice(compactName.length);
        cleaned = collapseWhitespace(suffix.replace(/([a-z])([A-Z])/g, "$1 $2"));
      }
    }
  }

  return cleaned || null;
}

export function inferCompanyFromHeadline(
  headline: string | null | undefined,
  fullName?: string | null
): string | null {
  const cleaned = cleanLinkedInConnectionHeadline(headline, fullName);
  if (!cleaned) return null;

  const atSymbolMatch = cleaned.match(/@\s*([^|,•·]+)$/);
  if (atSymbolMatch) {
    return collapseWhitespace(atSymbolMatch[1]);
  }

  const atWordMatch = cleaned.match(/\bat\s+([^|,•·]+)$/i);
  if (atWordMatch) {
    return collapseWhitespace(atWordMatch[1]);
  }

  return null;
}

export function resolveLinkedInConnectionCompany(
  currentCompany: string | null | undefined,
  headline: string | null | undefined,
  fullName?: string | null
): string | null {
  return collapseWhitespace(currentCompany) || inferCompanyFromHeadline(headline, fullName);
}

export function normalizeLinkedInConnection(
  input: LinkedInConnectionInput
): LinkedInConnectionInput | null {
  const fullName = input.fullName.trim();
  const profileUrl = normalizeLinkedInProfileUrl(input.profileUrl);
  if (!fullName || !profileUrl) return null;

  const headline = cleanLinkedInConnectionHeadline(input.headline, fullName);
  const currentCompany = resolveLinkedInConnectionCompany(
    input.currentCompany,
    headline,
    fullName
  );

  return {
    fullName,
    headline,
    currentCompany,
    location: input.location?.trim() || null,
    profileUrl,
    avatarUrl: input.avatarUrl?.trim() || null,
    linkedinPublicId:
      input.linkedinPublicId?.trim().toLowerCase() || extractLinkedInPublicId(profileUrl),
  };
}

export function dedupeLinkedInConnections(
  inputs: LinkedInConnectionInput[]
): LinkedInConnectionInput[] {
  const seen = new Set<string>();
  const normalized: LinkedInConnectionInput[] = [];

  for (const raw of inputs) {
    const item = normalizeLinkedInConnection(raw);
    if (!item) continue;
    const key = item.linkedinPublicId
      ? `id:${item.linkedinPublicId}`
      : `url:${item.profileUrl.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(item);
  }

  return normalized;
}

function getSearchKeywordSets(roleLabels: string[]): string[][] {
  return roleLabels.flatMap((label) => {
    const role = ROLE_OPTIONS.find((option) => option.label === label);
    const rawTerms = role ? role.searchTerms.split(",") : [label];
    return rawTerms
      .map((term) =>
        term
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 2 || KNOWN_SHORT_TERMS.has(word))
      )
      .filter((words) => !(words.length === 1 && GENERIC_WORDS.has(words[0])));
  });
}

function countKeywordHits(text: string, keywords: string[]): number {
  return keywords.filter((keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  }).length;
}

function roleTitleScore(title: string, roleLabels: string[]): number {
  const keywordSets = getSearchKeywordSets(roleLabels);
  const lowered = title.toLowerCase();
  let best = 0;

  for (const keywords of keywordSets) {
    const hits = countKeywordHits(lowered, keywords);
    if (hits >= 2 || (keywords.length === 1 && hits === 1)) {
      best = Math.max(best, hits / keywords.length);
    }
  }

  return best;
}

function headlineScore(headline: string | null | undefined, roleLabels: string[]): number {
  if (!headline) return 0;
  const keywordSets = getSearchKeywordSets(roleLabels);
  const lowered = headline.toLowerCase();
  let best = 0;

  for (const keywords of keywordSets) {
    const hits = countKeywordHits(lowered, keywords);
    if (hits > 0) {
      best = Math.max(best, hits / keywords.length);
    }
  }

  return Math.min(best, 1);
}

function recencyScore(postedAt: string | Date | null | undefined): number {
  if (!postedAt) return 0.35;
  const ageMs = Date.now() - new Date(postedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays <= 3) return 1;
  if (ageDays <= 7) return 0.85;
  if (ageDays <= 14) return 0.65;
  if (ageDays <= 30) return 0.45;
  return 0.25;
}

export function scoreWarmMatch(params: {
  jobTitle: string;
  postedAt?: string | Date | null;
  connectionHeadline?: string | null;
  targetRoles: string[];
}): { score: number; matchReason: string } {
  const title = params.jobTitle.trim();
  const titleScore = roleTitleScore(title, params.targetRoles);
  const linkedInScore = headlineScore(params.connectionHeadline, params.targetRoles);
  const freshness = recencyScore(params.postedAt);
  const score = Math.round((titleScore * 0.6 + linkedInScore * 0.15 + freshness * 0.25) * 100);

  const reasons: string[] = [];
  if (titleScore >= 0.8) reasons.push("strong role match");
  else if (titleScore >= 0.4) reasons.push("reasonable role match");
  else reasons.push("company match");

  if (linkedInScore >= 0.5) reasons.push("connection headline looks adjacent");
  if (freshness >= 0.8) reasons.push("fresh opening");

  return {
    score,
    matchReason: reasons.join(" · "),
  };
}

export function buildReferralPacket(input: ReferralPacketInput): ReferralPacket {
  const senderName = [input.userFirstName, input.userLastName].filter(Boolean).join(" ").trim() || "A candidate";
  const senderFirstName = input.userFirstName?.trim() || senderName.split(" ")[0] || "there";
  const roleSummary =
    input.targetRoles && input.targetRoles.length > 0
      ? input.targetRoles.slice(0, 2).join(" / ")
      : input.jobTitle;
  const experienceLine = input.userCurrentTitle && input.userCurrentEmployer
    ? `I currently work as ${input.userCurrentTitle} at ${input.userCurrentEmployer}.`
    : input.yearsOfExperience
      ? `I bring roughly ${input.yearsOfExperience} years of relevant experience.`
      : `I’ve been focused on roles like ${roleSummary}.`;

  const whyMeBullets = [
    `I’m actively targeting ${roleSummary} roles, and this ${input.jobTitle} opening is a close match.`,
    experienceLine,
    input.city
      ? `I’m based in ${input.city} and can move quickly on interview scheduling and follow-up.`
      : `I already have a polished application packet ready to send quickly.`,
  ];

  const connectionContext = input.connectionHeadline
    ? `${input.connectionFullName} is currently listed as ${input.connectionHeadline} at ${input.company}.`
    : `${input.connectionFullName} is part of the ${input.company} network.`;

  const suggestedMessage = [
    `Hi ${input.connectionFirstName},`,
    "",
    `I hope you’re doing well. I came across the ${input.jobTitle} role at ${input.company} and noticed that you’re there now.`,
    "",
    `I’m currently exploring ${roleSummary} opportunities, and this one looks especially aligned with my background. ${experienceLine}`,
    "",
    `If you feel comfortable, would you be open to referring me for the role or pointing me to the best person to speak with? I pulled together a quick packet so it’s easy to review: ${input.applyUrl}`,
    "",
    input.resumeName
      ? `I’d send over my ${input.resumeName} plus a few short points on why I’m a fit.`
      : "I’d send over my resume plus a few short points on why I’m a fit.",
    "",
    "Thank you either way. I appreciate your time.",
    "",
    `Best,`,
    senderName,
    input.linkedinUrl ? input.linkedinUrl : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subjectLine: `${senderFirstName} -> ${input.company} ${input.jobTitle} referral ask`,
    suggestedMessage,
    whyMeBullets,
    followUpChecklist: [
      "Send the outreach within 24 hours while the role is still fresh.",
      "If there is no reply after 5 business days, send one short follow-up.",
      "Once the referral is sent, update the status here so interviews and outcomes are tracked.",
    ],
    connectionContext,
    recommendedResumeName: input.resumeName || null,
  };
}

export function getReferralAccessSummary(params: {
  tier: string;
  subscriptionStatus: string;
  monthlyUsed: number;
  concurrentUsed: number;
}): ReferralAccessSummary {
  const tierKey = params.tier in TIER_LIMITS ? params.tier : "free";
  const limits = TIER_LIMITS[tierKey];
  const paidTier = tierKey === "starter" || tierKey === "pro";
  const canPreview = paidTier && ["trialing", "active", "past_due", "unpaid"].includes(params.subscriptionStatus);
  const canSubmitLive =
    paidTier &&
    params.subscriptionStatus === "active" &&
    params.monthlyUsed < limits.referralsPerMonth &&
    params.concurrentUsed < limits.concurrentReferrals;

  let previewReason: string | null = null;
  if (!canPreview) {
    previewReason = paidTier
      ? "Referral previews are unavailable while billing is inactive."
      : "Upgrade to a paid plan to unlock referral previews.";
  }

  let liveReason: string | null = null;
  if (params.subscriptionStatus !== "active") {
    liveReason = params.subscriptionStatus === "trialing"
      ? "Live referral requests unlock after your trial converts."
      : "Live referral requests require an active paid subscription.";
  } else if (params.monthlyUsed >= limits.referralsPerMonth) {
    liveReason = "You have used all referral requests for this billing period.";
  } else if (params.concurrentUsed >= limits.concurrentReferrals) {
    liveReason = "You already have the maximum number of in-flight referral requests.";
  }

  return {
    canPreview,
    canSubmitLive,
    previewReason,
    liveReason,
    tier: tierKey,
    subscriptionStatus: params.subscriptionStatus,
    monthlyUsed: params.monthlyUsed,
    monthlyLimit: limits.referralsPerMonth,
    concurrentUsed: params.concurrentUsed,
    concurrentLimit: limits.concurrentReferrals,
  };
}
