"use client";

import { useState } from "react";
import { useSubscribe } from "@/hooks/useSubscribe";

export default function EmailSignupBanner() {
  const [email, setEmail] = useState("");
  const { isLoading, isSuccess, error, message, subscribe } = useSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email, {
      tags: ["bfewebsite", "auto-apply-beta"],
      onSuccess: () => setEmail(""),
    });
  };

  return (
    <div className="p-6 bg-[#ffe500]/20 border-2 border-[#ffe500] rounded-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#ef562a] flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-[var(--foreground)] text-lg">Auto Apply is Coming</p>
          <p className="text-[var(--gray-600)] text-sm mt-1">Be the first to apply to hundreds of jobs effortlessly. Join the beta!</p>
        </div>
      </div>

      {isSuccess ? (
        <div className="p-4 bg-emerald-100 text-emerald-800 rounded-lg text-center">
          <span className="font-medium">You&apos;re on the Beta list!</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] placeholder-[var(--gray-600)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ef562a]/50 focus:border-[#ef562a] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#ef562a] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#d94a24] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isLoading ? "Signing up..." : "Join the Beta"}
          </button>
        </form>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
