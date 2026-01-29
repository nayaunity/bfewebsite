"use client";

import { useRouter } from "next/navigation";

export default function BackToJobs() {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's history to go back to, otherwise navigate to /jobs
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/jobs");
    }
  };

  return (
    <button
      onClick={handleBack}
      className="text-sm text-[var(--gray-600)] hover:text-[#ef562a] transition-colors inline-flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to Jobs
    </button>
  );
}
