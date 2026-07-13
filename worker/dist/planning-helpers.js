"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPlannedDiscoveryRow = mapPlannedDiscoveryRow;
exports.computePlannedSessionFinalStatus = computePlannedSessionFinalStatus;
function mapPlannedDiscoveryRow(row) {
    let customWritingText;
    let reviewedAnswers;
    const customWritingFinal = typeof row.customWritingFinal === "string" ? row.customWritingFinal : null;
    let customWritingFormat = null;
    if (typeof row.planPayload === "string" && row.planPayload.trim()) {
        try {
            const payload = JSON.parse(row.planPayload);
            customWritingFormat = payload.customWritingFormat || null;
        }
        catch {
            customWritingFormat = null;
        }
    }
    if (customWritingFinal) {
        if (customWritingFormat === "json") {
            reviewedAnswers = customWritingFinal;
        }
        else if (customWritingFormat === "text") {
            customWritingText = customWritingFinal;
        }
        else if (customWritingFinal.trim().startsWith("{")) {
            reviewedAnswers = customWritingFinal;
        }
        else {
            customWritingText = customWritingFinal;
        }
    }
    return {
        discoveryId: String(row.id ?? ""),
        company: String(row.company ?? ""),
        title: String(row.jobTitle ?? ""),
        applyUrl: String(row.applyUrl ?? ""),
        matchScore: typeof row.matchScore === "number" ? row.matchScore : row.matchScore ?? null,
        matchReason: typeof row.matchReason === "string" ? row.matchReason : null,
        customWritingText,
        reviewedAnswers,
    };
}
function computePlannedSessionFinalStatus(args) {
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
