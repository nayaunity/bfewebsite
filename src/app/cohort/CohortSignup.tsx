"use client";

import { useState } from "react";
import { useSubscribe } from "@/hooks/useSubscribe";

export default function CohortSignup({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const { isLoading, isSuccess, error, message, subscribe } = useSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email, {
      tags: ["cohort", "fall-2026", "waitlist"],
      onSuccess: () => setEmail(""),
    });
  };

  if (isSuccess) {
    return (
      <div className={`mt-8 p-4 rounded-full max-w-md mx-auto text-center ${
        variant === "dark"
          ? "bg-white/10 text-white"
          : "bg-green-50 text-green-800"
      }`}>
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-md mx-auto">
      <div className="flex">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          disabled={isLoading}
          className={`flex-1 px-4 py-3 rounded-l-full focus:outline-none disabled:opacity-50 ${
            variant === "dark"
              ? "bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
              : "border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--foreground)] focus:border-[var(--gray-600)] placeholder:text-[var(--gray-600)]"
          }`}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-3 rounded-r-full transition-colors disabled:opacity-50 font-medium text-sm ${
            variant === "dark"
              ? "bg-white text-[var(--accent)] hover:bg-white/90"
              : "bg-[#4d1b27] text-white hover:bg-[#4d383b]"
          }`}
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            "Join waitlist"
          )}
        </button>
      </div>
      {error && (
        <p className={`mt-2 text-sm ${variant === "dark" ? "text-red-300" : "text-red-400"}`}>
          {error}
        </p>
      )}
    </form>
  );
}
