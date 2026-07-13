export interface AutoApplyAtsBucket {
  atsType: string;
  total: number;
  applied: number;
  failed: number;
  skipped: number;
  readyToSubmit: number;
  needsReview: number;
}

export interface AutoApplyGraphMetrics {
  totalPlanned: number;
  autoSubmitCount: number;
  reviewRoutedCount: number;
  skippedCount: number;
  pendingReviewCount: number;
  approvedReviewCount: number;
  rejectedReviewCount: number;
  autoSubmitRate: number | null;
  supportedAttemptedCount: number;
  supportedAppliedCount: number;
  supportedFailedCount: number;
  supportedSuccessRate: number | null;
  unsupportedAutoSubmitCount: number;
  atsBuckets: AutoApplyAtsBucket[];
}

export interface GraphMetricsDiscoveryRecord {
  atsType?: string | null;
  status: string;
  graphStatus?: string | null;
  planningDecision?: string | null;
  reviewTaskStatus?: string | null;
}

export function summarizeAutoApplyGraphMetrics(
  discoveries: GraphMetricsDiscoveryRecord[]
): AutoApplyGraphMetrics {
  let autoSubmitCount = 0;
  let reviewRoutedCount = 0;
  let skippedCount = 0;
  let pendingReviewCount = 0;
  let approvedReviewCount = 0;
  let rejectedReviewCount = 0;
  let supportedAttemptedCount = 0;
  let supportedAppliedCount = 0;
  let supportedFailedCount = 0;
  let unsupportedAutoSubmitCount = 0;

  const atsBucketMap = new Map<string, AutoApplyAtsBucket>();

  for (const discovery of discoveries) {
    const atsType = discovery.atsType || "unknown";
    const bucket = atsBucketMap.get(atsType) || {
      atsType,
      total: 0,
      applied: 0,
      failed: 0,
      skipped: 0,
      readyToSubmit: 0,
      needsReview: 0,
    };
    bucket.total++;

    if (discovery.status === "applied") {
      bucket.applied++;
    } else if (discovery.status === "failed") {
      bucket.failed++;
    } else if (discovery.status === "skipped") {
      bucket.skipped++;
    }

    if (discovery.graphStatus === "ready_to_submit") {
      bucket.readyToSubmit++;
    } else if (discovery.graphStatus === "needs_review") {
      bucket.needsReview++;
    }

    atsBucketMap.set(atsType, bucket);

    if (discovery.planningDecision === "skip") {
      skippedCount++;
    }

    if (discovery.reviewTaskStatus) {
      reviewRoutedCount++;
      if (discovery.reviewTaskStatus === "pending") {
        pendingReviewCount++;
      } else if (discovery.reviewTaskStatus === "approved") {
        approvedReviewCount++;
      } else if (discovery.reviewTaskStatus === "rejected") {
        rejectedReviewCount++;
      }
    } else if (discovery.planningDecision === "auto_submit") {
      autoSubmitCount++;
    }

    if (atsType !== "unsupported" && atsType !== "unknown") {
      if (discovery.status === "applied" || discovery.status === "failed") {
        supportedAttemptedCount++;
      }
      if (discovery.status === "applied") {
        supportedAppliedCount++;
      } else if (discovery.status === "failed") {
        supportedFailedCount++;
      }
    }

    if (
      atsType === "unsupported" &&
      (discovery.planningDecision === "auto_submit" ||
        discovery.graphStatus === "ready_to_submit" ||
        discovery.graphStatus === "applying" ||
        discovery.graphStatus === "applied")
    ) {
      unsupportedAutoSubmitCount++;
    }
  }

  const totalPlanned = discoveries.length;
  const autoSubmitRate =
    totalPlanned > 0 ? autoSubmitCount / totalPlanned : null;
  const supportedSuccessRate =
    supportedAttemptedCount > 0
      ? supportedAppliedCount / supportedAttemptedCount
      : null;

  return {
    totalPlanned,
    autoSubmitCount,
    reviewRoutedCount,
    skippedCount,
    pendingReviewCount,
    approvedReviewCount,
    rejectedReviewCount,
    autoSubmitRate,
    supportedAttemptedCount,
    supportedAppliedCount,
    supportedFailedCount,
    supportedSuccessRate,
    unsupportedAutoSubmitCount,
    atsBuckets: [...atsBucketMap.values()].sort((a, b) =>
      a.atsType.localeCompare(b.atsType)
    ),
  };
}
