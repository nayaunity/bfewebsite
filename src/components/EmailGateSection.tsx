"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSubscribe } from "@/hooks/useSubscribe";

interface EmailGateSectionProps {
  totalLessons: number;
  courseTag?: string;
}

export default function EmailGateSection({ totalLessons, courseTag = "course-signup" }: EmailGateSectionProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const { status } = useSession();
  const { isLoading: isSubmitting, error: subscribeError, subscribe } = useSubscribe();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      setHasAccess(true);
      setIsLoading(false);
    } else {
      const unlocked = localStorage.getItem("bfe-course-access");
      setHasAccess(unlocked === "true");
      setIsLoading(false);
    }
  }, [status]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    await subscribe(email, {
      tags: ["bfewebsite", courseTag],
      onSuccess: () => {
        localStorage.setItem("bfe-course-access", "true");
        localStorage.setItem("bfe-user-email", email);
        setHasAccess(true);
      },
    });
  };

  // Don't render anything while loading to prevent flash
  if (isLoading) {
    return null;
  }

  // Don't render if user already has access
  if (hasAccess) {
    return null;
  }

  return (
    <section className="bg-[var(--gray-50)] py-16 md:py-24 border-t border-[var(--card-border)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ffe500] flex items-center justify-center">
          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="font-serif text-3xl md:text-4xl mb-4">
          Unlock the Full Guide
        </h2>
        <p className="text-[var(--gray-600)] mb-8">
          Get access to all {totalLessons} lessons, including real system design workshops
          and interview prep materials. Just enter your email to continue.
        </p>
        <form onSubmit={handleUnlock} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isSubmitting}
            className="flex-1 px-5 py-4 border border-[var(--card-border)] rounded-full focus:outline-none focus:border-[#ef562a] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#ef562a] text-white px-8 py-4 rounded-full font-medium hover:bg-[#d94d25] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "..." : "Get Access"}
          </button>
        </form>
        {subscribeError && (
          <p className="text-sm text-red-600 mt-3">{subscribeError}</p>
        )}
        <p className="text-xs text-[var(--gray-600)] mt-4">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
