"use client";

import { useState } from "react";
import Image from "next/image";

export default function Hero() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter signup:", email);
    setEmail("");
  };

  return (
    <section className="bg-white pt-32 md:pt-40 pb-16 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
              Your career
              <br />
              is <span className="italic text-[#ef562a]">bold</span>.
              <br />
              Our resources
              <br />
              are <span className="italic text-[#ef562a]">free</span>.
            </h1>

            <p className="mt-8 text-lg text-gray-600 max-w-md">
              Join 10,000+ Black women in tech, engineering, and STEM striving for the top.
            </p>

            {/* Email Signup */}
            <form onSubmit={handleSubmit} className="mt-8 flex max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-full focus:outline-none focus:border-gray-400"
              />
              <button
                type="submit"
                className="bg-black text-white px-6 py-3 rounded-r-full hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>
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
            <div className="absolute -right-4 top-1/4 text-xs tracking-[0.3em] text-gray-300 transform rotate-90 origin-right whitespace-nowrap">
              THE BLACK FEMALE ENGINEER
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
