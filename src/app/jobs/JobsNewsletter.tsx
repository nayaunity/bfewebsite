"use client";

import { useState } from "react";
import { useSubscribe } from "@/hooks/useSubscribe";

export default function JobsNewsletter() {
  const [email, setEmail] = useState("");
  const { isLoading, isSuccess, error, message, subscribe } = useSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email, {
      tags: ["bfewebsite", "jobs-newsletter"],
      onSuccess: () => setEmail(""),
    });
  };

  return (
    <section className="bg-[#1a1a1a] py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
          Opportunities in your inbox
        </h2>
        <p className="text-white/60 mb-8">
          Get curated job opportunities and career advice delivered weekly.
        </p>
        {isSuccess ? (
          <div className="p-4 bg-green-500/20 text-green-300 rounded-full max-w-md mx-auto text-center">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
                className="flex-1 px-5 py-4 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-l-full focus:outline-none focus:border-white/40 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#ffe500] text-black px-6 py-4 rounded-r-full font-medium hover:bg-[#f5dc00] transition-colors disabled:opacity-50"
              >
                {isLoading ? "..." : "Subscribe"}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
