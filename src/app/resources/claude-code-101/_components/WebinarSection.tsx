"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSubscribe } from "@/hooks/useSubscribe";

const YOUTUBE_VIDEO_ID = "sda_JDw_4J4";

export default function WebinarSection() {
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
      // Check for webinar-specific access OR general course access
      const webinarAccess = localStorage.getItem("bfe-webinar-claude-code-101");
      const courseAccess = localStorage.getItem("bfe-course-access");
      setHasAccess(webinarAccess === "true" || courseAccess === "true");
      setIsLoading(false);
    }
  }, [status]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    await subscribe(email, {
      tags: ["bfewebsite", "webinar", "claude-code-101-webinar"],
      onSuccess: () => {
        localStorage.setItem("bfe-webinar-claude-code-101", "true");
        localStorage.setItem("bfe-course-access", "true");
        localStorage.setItem("bfe-user-email", email);
        setHasAccess(true);
      },
    });
  };

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-[var(--gray-50)] border-y border-[var(--card-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--gray-200)] rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-[var(--gray-200)] rounded w-2/3 mx-auto mb-8"></div>
            <div className="aspect-video bg-[var(--gray-200)] rounded-2xl"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-[var(--gray-50)] border-y border-[var(--card-border)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-[#ef562a]/10 text-[#ef562a] mb-4">
            Free Webinar Recording
          </span>
          <h2 className="font-serif text-3xl md:text-4xl mb-3">
            Watch the Full <span className="italic text-[#ef562a]">Workshop</span>
          </h2>
          <p className="text-[var(--gray-600)] max-w-2xl mx-auto">
            {hasAccess
              ? "Enjoy the complete Claude Code 101 webinar recording. Learn how to build real projects with AI in your terminal."
              : "Get the complete Claude Code 101 webinar recording where I walk through building a portfolio website from scratch using Claude Code."
            }
          </p>
        </div>

        {hasAccess ? (
          /* Unlocked - Show Video */
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0`}
                title="Claude Code 101 Webinar"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        ) : (
          /* Locked - Show Gate */
          <div className="relative">
            {/* Mobile-friendly card layout */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#1a1a1a]">
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                  alt="Claude Code 101 Webinar Preview"
                  className="w-full h-full object-cover opacity-20 md:opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/90 to-[#1a1a1a]/80" />
              </div>

              {/* Content - flows naturally on mobile */}
              <div className="relative flex flex-col items-center text-center p-6 md:p-12 md:min-h-[400px] md:justify-center">
                {/* Play Button Style Lock */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 md:mb-6 border border-white/20">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                <h3 className="text-white text-xl md:text-3xl font-serif mb-2 md:mb-3">
                  Unlock the 1 Hour Webinar and Code Along
                </h3>
                <p className="text-white/70 mb-5 md:mb-6 max-w-md text-sm md:text-base">
                  Enter your email to watch the full recording instantly.
                </p>

                {/* Email Form - stacked on mobile */}
                <form onSubmit={handleUnlock} className="w-full max-w-md">
                  <div className="flex flex-col gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      disabled={isSubmitting}
                      className="w-full px-5 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[#ffe500] disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? "..." : "Watch Now"}
                    </button>
                  </div>
                  {subscribeError && (
                    <p className="text-sm text-red-400 mt-3">{subscribeError}</p>
                  )}
                </form>

                <p className="text-white/50 text-xs mt-4">
                  No spam, ever. Unsubscribe anytime.
                </p>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-4 md:mt-6">
              <span className="inline-flex items-center gap-1.5 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)]">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Full Recording
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)]">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Live Demo
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)]">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Q&A
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
