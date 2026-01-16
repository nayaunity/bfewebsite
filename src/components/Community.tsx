"use client";

import { useState } from "react";
import { useSubscribe } from "@/hooks/useSubscribe";

export default function Community() {
  const [email, setEmail] = useState("");
  const { isLoading, isSuccess, error, message, subscribe } = useSubscribe();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email, {
      tags: ["newsletter", "community-section"],
      onSuccess: () => setEmail(""),
    });
  };

  return (
    <section id="community">
      {/* Dark Section - Who are we */}
      <div className="bg-[#1a1a1a] py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white">
            Who are we?
          </h2>
          <div className="w-px h-12 bg-[#ffe500] mx-auto my-8"></div>
          <p className="text-xl md:text-2xl text-white/80 font-serif italic">
            We&apos;re engineers, creators, leaders, and{" "}
            <span className="text-[#ef562a]">out-of-the-box</span> thinkers.
          </p>

          {/* Email Signup */}
          {isSuccess ? (
            <div className="mt-12 p-4 bg-green-500/20 text-green-300 rounded-full max-w-md mx-auto text-center">
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="newsletter" className="mt-12 max-w-md mx-auto">
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
                  {isLoading ? "..." : "Join Us"}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
              )}
            </form>
          )}
        </div>
      </div>

      {/* What we believe in */}
      <div className="bg-[#1a1a1a] py-16 md:py-24 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white">
            What we believe in
          </h3>
          <div className="w-px h-12 bg-[#ffe500] mx-auto my-8"></div>
          <p className="text-xl md:text-2xl text-white/80 font-serif italic mb-6">
            A new wave of leaders has arrived, and they&apos;re{" "}
            <span className="text-[#ef562a]">Black women in STEM</span>.
          </p>
          <p className="text-white/60 max-w-2xl mx-auto leading-relaxed">
            Black women in engineering are a powerful group of digital natives, driven by what is right and have a passion for making change happen. However, the traditional world of tech and venture capital often overlooks and underestimates this cohort. We need to double down on investing in them now so we can unlock the potential of the next billion-dollar companies.
          </p>
        </div>
      </div>

      {/* Community Members Grid */}
      <div className="bg-[#1a1a1a] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {/* Member cards - placeholder style */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] bg-gray-800 rounded-2xl overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <h4 className="font-serif text-lg md:text-xl text-white">Community Member</h4>
                  <p className="text-white/60 text-sm mt-1">Engineer at Company</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Community Stats - White Section */}
      <div className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-16">
            <span className="italic">what</span> OUR COMMUNITY*
            <br />
            <span className="italic">has been</span> UP TO
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div>
              <div className="font-serif text-4xl md:text-5xl text-[#ef562a]">10K+</div>
              <div className="mt-2 text-sm text-gray-600">Members</div>
            </div>
            <div>
              <div className="font-serif text-4xl md:text-5xl text-[#ef562a]">500+</div>
              <div className="mt-2 text-sm text-gray-600">Resources</div>
            </div>
            <div>
              <div className="font-serif text-4xl md:text-5xl text-[#ef562a]">200+</div>
              <div className="mt-2 text-sm text-gray-600">Partner Companies</div>
            </div>
            <div>
              <div className="font-serif text-4xl md:text-5xl text-[#ef562a]">50+</div>
              <div className="mt-2 text-sm text-gray-600">Events/Year</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
