"use client";

import { useState } from "react";
import { useSubscribe } from "@/hooks/useSubscribe";
import { PolaroidFrame, ChromeStar, BrandSignature, MatchaDrink } from "@/components/brand";

export default function Hero() {
  const [email, setEmail] = useState("");
  const { isLoading, isSuccess, error, message, subscribe } = useSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email, {
      tags: ["bfewebsite", "newsletter", "homepage"],
      onSuccess: () => setEmail(""),
    });
  };

  return (
    <section className="bg-gradient-to-b from-[var(--background)] to-[var(--surface-warm)] pt-32 md:pt-40 pb-16 md:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="relative">
            <ChromeStar size={64} rotate={15} className="absolute -top-8 -left-4 md:-left-8 animate-twinkle" />
            <ChromeStar size={32} rotate={-10} className="absolute top-2 right-0 md:right-12 animate-twinkle [animation-delay:1s]" />

            <h1 className="font-serif font-bold text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight">
              Build <span className="italic text-[var(--accent)]">skills</span>.
              <br />
              Build <span className="italic text-[var(--accent)]">wealth</span>.
              <br />
              Build <span className="italic text-[var(--accent)]">freedom</span>.
            </h1>

            <p className="mt-8 text-lg text-[var(--gray-600)] max-w-md">
              Join 250K+ people using AI to level up their careers, income, and lives.
            </p>

            {/* Email Signup */}
            {isSuccess ? (
              <div className="mt-8 p-4 bg-green-50 text-green-800 rounded-full max-w-md text-center">
                {message}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 max-w-md">
                <div className="flex shadow-[0_0_24px_rgba(77,27,39,0.1)] rounded-full">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--foreground)] rounded-l-full focus:outline-none focus:border-[var(--gray-600)] disabled:opacity-50 placeholder:text-[var(--gray-600)]"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[var(--cta-bg)] text-white px-6 py-3 rounded-r-full hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </form>
            )}
          </div>

          {/* Right Image - Polaroid Frame */}
          <div className="relative flex justify-center">
            <ChromeStar size={80} rotate={12} className="absolute -top-6 -right-2 md:right-4 z-10 animate-twinkle" />
            <ChromeStar size={40} rotate={-20} className="absolute bottom-16 -left-4 md:left-4 z-10 animate-twinkle [animation-delay:0.6s]" />
            <ChromeStar size={24} rotate={30} className="absolute top-1/3 -right-4 md:right-0 z-10 animate-twinkle [animation-delay:1.2s]" />
            <MatchaDrink size={100} rotate={-9} className="absolute -bottom-4 -left-8 md:left-0 z-10 hidden md:block" />

            <PolaroidFrame
              src="/images/hero-community.png"
              alt="Black woman building her dream life with AI"
              className="w-full max-w-md"
              rotation={2}
              priority
            />
            <BrandSignature
              size="md"
              className="absolute -bottom-6 right-4 md:right-8 opacity-80"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
