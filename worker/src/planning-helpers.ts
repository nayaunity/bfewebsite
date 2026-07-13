export interface PlannedDiscoveryJob {
  discoveryId: string;
  title: string;
  applyUrl: string;
  company: string;
  matchScore?: number | null;
  matchReason?: string | null;
  customWritingText?: string;
  reviewedAnswers?: string;
}

export interface PlannedDiscoveryRow {
  id?: unknown;
  company?: unknown;
  jobTitle?: unknown;
  applyUrl?: unknown;
  matchScore?: unknown;
  matchReason?: unknown;
  customWritingFinal?: unknown;
  planPayload?: unknown;
}

export function mapPlannedDiscoveryRow(
  row: PlannedDiscoveryRow
): PlannedDiscoveryJob {
  let customWritingText: string | undefined;
  let reviewedAnswers: string | undefined;
  const customWritingFinal =
    typeof row.customWritingFinal === "string" ? row.customWritingFinal : null;
  let customWritingFormat: string | null = null;

  if (typeof row.planPayload === "string" && row.planPayload.trim()) {
    try {
      const payload = JSON.parse(row.planPayload) as {
        customWritingFormat?: string | null;
      };
      customWritingFormat = payload.customWritingFormat || null;
    } catch {
      customWritingFormat = null;
    }
  }

  if (customWritingFinal) {
    if (customWritingFormat === "json") {
      reviewedAnswers = customWritingFinal;
    } else if (customWritingFormat === "text") {
      customWritingText = customWritingFinal;
    } else if (customWritingFinal.trim().startsWith("{")) {
      reviewedAnswers = customWritingFinal;
    } else {
      customWritingText = customWritingFinal;
    }
  }

  return {
    discoveryId: String(row.id ?? ""),
    company: String(row.company ?? ""),
    title: String(row.jobTitle ?? ""),
    applyUrl: String(row.applyUrl ?? ""),
    matchScore:
      typeof row.matchScore === "number" ? row.matchScore : (row.matchScore as number | null) ?? null,
    matchReason:
      typeof row.matchReason === "string" ? row.matchReason : null,
    customWritingText,
    reviewedAnswers,
  };
}

export function computePlannedSessionFinalStatus(args: {
  quotaBlocked: boolean;
  pendingReviewCount: number;
  readyToSubmitCount: number;
}): "queued" | "awaiting_review" | "completed" {
  if (args.quotaBlocked) {
    return args.pendingReviewCount > 0 ? "awaiting_review" : "completed";
  }
  if (args.readyToSubmitCount > 0) {
    return "queued";
  }
  if (args.pendingReviewCount > 0) {
    return "awaiting_review";
  }
  return "completed";
}
