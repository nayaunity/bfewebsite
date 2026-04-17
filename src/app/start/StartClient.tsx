"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResumeUploadStep from "@/components/onboarding/ResumeUploadStep";
import ExtractingLoader from "@/components/onboarding/ExtractingLoader";
import ConfirmExtractionStep from "@/components/onboarding/ConfirmExtractionStep";
import MatchedJobsPreview from "@/components/onboarding/MatchedJobsPreview";
import ShortFallbackForm from "@/components/onboarding/ShortFallbackForm";
import type { ResumeExtraction } from "@/lib/resume-extraction";

type Phase = "upload" | "extracting" | "confirm" | "fallback" | "matches" | "error";

const STEP_LABELS: Record<number, string> = {
  0: "Landing loaded",
  1: "Resume uploaded",
  3: "Extraction complete",
  4: "Confirm screen shown",
  5: "Confirm submitted",
  6: "Matched jobs rendered",
  7: "Apply clicked",
};

function trackStep(step: number, tempId: string | null, extra: Record<string, unknown> = {}) {
  fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "onboarding_step",
      message: `Step ${step}: ${STEP_LABELS[step] ?? "unknown"}`,
      metadata: { step, label: STEP_LABELS[step], tempId, flow: "resume-first", ...extra },
    }),
  }).catch(() => {});
}

export default function StartClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("upload");
  const [tempId, setTempId] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<ResumeExtraction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    trackStep(0, null);
  }, []);

  const handleUploadComplete = useCallback(async (newTempId: string) => {
    setTempId(newTempId);
    setPhase("extracting");
    trackStep(1, newTempId);

    try {
      const res = await fetch("/api/onboarding/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempId: newTempId }),
      });
      if (!res.ok) throw new Error("parse failed");
      const { extraction: result } = (await res.json()) as { extraction: ResumeExtraction };
      setExtraction(result);
      trackStep(3, newTempId, { confidence: result.confidence });

      const unusable =
        result.confidence === "low" ||
        result.rawTextLength < 500 ||
        result.inferredTargetRoles.length === 0;

      if (unusable) {
        setPhase("fallback");
      } else {
        setPhase("confirm");
        trackStep(4, newTempId);
      }
    } catch {
      setExtraction(null);
      setPhase("fallback");
    }
  }, []);

  const handleConfirmed = useCallback(async () => {
    if (!tempId) return;
    trackStep(5, tempId);
    setPhase("matches");
    trackStep(6, tempId);
  }, [tempId]);

  const handleApplyClick = useCallback(() => {
    if (!tempId) return;
    trackStep(7, tempId);
    const callback = encodeURIComponent("/profile/applications?startTrial=1");
    router.push(`/auth/signup?tempId=${tempId}&callbackUrl=${callback}`);
  }, [tempId, router]);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        {phase === "upload" && (
          <ResumeUploadStep onUploaded={handleUploadComplete} />
        )}
        {phase === "extracting" && (
          <ExtractingLoader />
        )}
        {phase === "confirm" && extraction && (
          <ConfirmExtractionStep
            extraction={extraction}
            onConfirmed={handleConfirmed}
            tempId={tempId}
          />
        )}
        {phase === "fallback" && (
          <ShortFallbackForm
            onConfirmed={handleConfirmed}
            tempId={tempId}
            extraction={extraction}
          />
        )}
        {phase === "matches" && (
          <MatchedJobsPreview onApply={handleApplyClick} />
        )}
        {phase === "error" && (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center">
            <h2 className="font-serif text-2xl">Something went wrong</h2>
            <p className="mt-2 text-[var(--gray-600)]">{errorMessage}</p>
            <button
              type="button"
              onClick={() => { setPhase("upload"); setErrorMessage(null); }}
              className="mt-4 rounded-full bg-[#ef562a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#d84a21]"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
