"use client";

import { useState } from "react";
import { useSubscribe } from "@/hooks/useSubscribe";

export default function ReminderForm() {
  const [email, setEmail] = useState("");
  const { isLoading, isSuccess, error, message, subscribe } = useSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email, {
      tags: ["bfewebsite", "pinterest-apprenticeship-reminder-2026"],
      onSuccess: () => setEmail(""),
    });
  };

  return (
    <section className="my-10">
      <div className="p-6 md:p-8 bg-[#ffe500]/50 border border-[#ffe500] rounded-2xl">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#E60023] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h3 className="font-serif text-xl text-[var(--foreground)] mb-1">
              Get a Reminder
            </h3>
            <p className="text-[var(--gray-600)] text-sm">
              I&apos;ll send you a reminder when Pinterest opens their applications so you don&apos;t miss your chance.
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-4 bg-green-500/20 text-green-700 dark:text-green-300 rounded-lg text-center">
            <span className="font-medium">{message}</span>
            <p className="text-sm mt-1 opacity-80">You&apos;ll be the first to know when applications open!</p>
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
              className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] placeholder-[var(--gray-600)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E60023]/50 focus:border-[#E60023] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#E60023] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#ad081b] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isLoading ? "Saving..." : "Remind Me"}
            </button>
          </form>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </section>
  );
}
