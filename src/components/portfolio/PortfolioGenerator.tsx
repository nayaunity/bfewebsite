"use client";

import { useState, useEffect, useCallback } from "react";

const STEP_LABELS: Record<string, string> = {
  started: "Starting generation...",
  extracting_resume: "Analyzing your resume...",
  generating_content: "Writing your professional story...",
  generating_images: "Creating unique visuals...",
  assembling: "Assembling your portfolio...",
  complete: "Portfolio ready!",
  error: "Something went wrong.",
};

const STEP_ORDER = [
  "started",
  "extracting_resume",
  "generating_content",
  "generating_images",
  "assembling",
  "complete",
];

interface PortfolioGeneratorProps {
  hasResume: boolean;
  tier: string;
}

export function PortfolioGenerator({ hasResume, tier }: PortfolioGeneratorProps) {
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  const pollStatus = useCallback(async () => {
    const res = await fetch("/api/portfolio/status");
    if (!res.ok) return;
    const data = await res.json();
    if (!data.exists) return;

    if (data.status === "generating") {
      setStatus("generating");
      setCurrentStep(data.currentStep);
    } else if (data.status === "ready") {
      setStatus("ready");
      setCurrentStep("complete");
      setSlug(data.slug);
    } else if (data.status === "error") {
      setStatus("error");
      setErrorMessage(data.errorMessage);
    }
  }, []);

  useEffect(() => {
    if (status !== "generating") return;
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [status, pollStatus]);

  const startGeneration = async () => {
    setStatus("generating");
    setCurrentStep("started");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/portfolio/generate", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Failed to start generation.");
        return;
      }

      setSlug(data.slug);
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  if (!hasResume) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--accent-blue-bg)] flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-serif font-bold text-[var(--foreground)] mb-2">Upload a Resume First</h3>
        <p className="text-[var(--gray-600)] mb-6">
          Your portfolio is generated from your resume. Head to your profile to upload one.
        </p>
        <a
          href="/profile"
          className="inline-block px-6 py-3 bg-[#ef562a] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          Go to Profile
        </a>
      </div>
    );
  }

  if (tier === "free") {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--accent-blue-bg)] flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-serif font-bold text-[var(--foreground)] mb-2">Upgrade to Generate Your Portfolio</h3>
        <p className="text-[var(--gray-600)] mb-6">
          AI-generated portfolios with unique 3D visuals are available on Starter and Pro plans.
        </p>
        <a
          href="/pricing"
          className="inline-block px-6 py-3 bg-[#ef562a] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          View Plans
        </a>
      </div>
    );
  }

  if (status === "generating") {
    const stepIndex = currentStep ? STEP_ORDER.indexOf(currentStep) : 0;
    const progress = Math.max(10, Math.min(95, (stepIndex / (STEP_ORDER.length - 1)) * 100));

    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-8 relative">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--gray-200)]" />
          <div
            className="absolute inset-0 rounded-full border-4 border-[#ef562a] border-t-transparent animate-spin"
          />
        </div>
        <h3 className="text-xl font-serif font-bold text-[var(--foreground)] mb-3">
          {STEP_LABELS[currentStep || "started"]}
        </h3>
        <p className="text-[var(--gray-600)] text-sm mb-8">
          This usually takes 60 to 90 seconds.
        </p>
        <div className="max-w-md mx-auto">
          <div className="h-2 bg-[var(--gray-200)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#ef562a] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[var(--gray-600)]">
            {STEP_ORDER.slice(1, -1).map((step, i) => (
              <span
                key={step}
                className={stepIndex > i + 1 ? "text-[#ef562a] font-semibold" : ""}
              >
                {STEP_LABELS[step]?.replace("...", "")}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "ready" && slug) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-serif font-bold text-[var(--foreground)] mb-2">
          Your Portfolio is Ready!
        </h3>
        <p className="text-[var(--gray-600)] mb-6">
          Preview it and publish when you are ready to share.
        </p>
        <a
          href={`/portfolio/${slug}`}
          className="inline-block px-6 py-3 bg-[#ef562a] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          View Portfolio
        </a>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-xl font-serif font-bold text-[var(--foreground)] mb-2">Generation Failed</h3>
        <p className="text-[var(--gray-600)] mb-6">
          Something went wrong while creating your portfolio. Please try again.
        </p>
        <button
          onClick={startGeneration}
          className="px-6 py-3 bg-[#ef562a] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Idle state - show generate CTA
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      </div>
      <h3 className="text-2xl font-serif font-bold text-[var(--foreground)] mb-3">
        Generate Your Portfolio
      </h3>
      <p className="text-[var(--gray-600)] mb-2 max-w-md mx-auto">
        AI-powered portfolio with unique 3D visuals, generated directly from your resume. Takes about 60 to 90 seconds.
      </p>
      <p className="text-[var(--gray-600)] text-sm mb-8">
        Includes a professional headline, bio, enhanced experience descriptions, skills showcase, and custom imagery.
      </p>
      <button
        onClick={startGeneration}
        className="px-8 py-4 bg-[#ef562a] text-white font-semibold rounded-xl text-lg hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-orange-500/20"
      >
        Generate My Portfolio
      </button>
    </div>
  );
}
