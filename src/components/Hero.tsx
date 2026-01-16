"use client";

import { useState } from "react";
import Image from "next/image";
import { useSubscribe } from "@/hooks/useSubscribe";

export default function Hero() {
  const [email, setEmail] = useState("");
  const { isLoading, isSuccess, error, message, subscribe } = useSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email, {
      tags: ["newsletter", "homepage"],
      onSuccess: () => setEmail(""),
    });
  };

  return (
    <section className="bg-white pt-32 md:pt-40 pb-16 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
              Make tech
              <br />
              <span className="italic text-[#ef562a]">accessible</span>.
              <br />
              Make it
              <br />
              <span className="italic text-[#ef562a]">actionable</span>.
            </h1>

            <p className="mt-8 text-lg text-gray-600 max-w-md">
              Join 200K+ young professionals and tech-minded creatives getting the tools and inspiration to make an impact.
            </p>

            {/* Email Signup */}
            {isSuccess ? (
              <div className="mt-8 p-4 bg-green-50 text-green-800 rounded-full max-w-md text-center">
                {message}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 max-w-md">
                <div className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-l-full focus:outline-none focus:border-gray-400 disabled:bg-gray-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-black text-white px-6 py-3 rounded-r-full hover:bg-gray-800 transition-colors disabled:opacity-50"
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
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </form>
            )}
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden relative">
              <Image
                src="/images/hero-community.png"
                alt="Black women engineers collaborating"
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Decorative curved text - simplified */}
            <div className="absolute -right-4 top-2/4 text-xs tracking-[0.3em] text-gray-300 transform rotate-90 origin-right whitespace-nowrap">
              THE BLACK FEMALE ENGINEER
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
