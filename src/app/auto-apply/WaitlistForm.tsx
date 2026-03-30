"use client";

import { useState } from "react";
import { useSubscribe } from "@/hooks/useSubscribe";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const { isLoading, isSuccess, error, subscribe } = useSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email, {
      tags: ["bfewebsite", "auto-apply-beta"],
      onSuccess: () => setEmail(""),
    });
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-emerald-100 text-emerald-800 rounded-2xl text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-200 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-lg">You&apos;re on the list!</p>
        <p className="text-sm mt-1">We&apos;ll email you when Auto Apply is ready for beta.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={isLoading}
          className="flex-1 px-5 py-4 bg-[var(--background)] border-2 border-[var(--card-border)] text-[var(--foreground)] placeholder-[var(--gray-600)] rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-[#ef562a]/50 focus:border-[#ef562a] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#ef562a] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#d94a24] transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {isLoading ? "Joining..." : "Join the Waitlist"}
        </button>
      </form>
      {error && (
        <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
