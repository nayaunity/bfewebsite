"use client";

import Link from "next/link";

export default function LandingHero() {
  return (
    <section className="bg-[var(--background)] pt-32 md:pt-44 pb-16 md:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
          Your job search,{" "}
          <span className="italic text-[#ef562a]">on Autopilot</span>.
        </h1>

        <p className="mt-6 text-lg md:text-xl text-[var(--gray-600)] max-w-2xl mx-auto">
          BFE <strong>finds &amp; applies</strong> you to the best new jobs every
          day. Just set it and forget it!
        </p>

        <Link
          href="/auto-apply/get-started"
          className="inline-flex items-center gap-2 mt-10 bg-[#ffe500] text-black px-10 py-4 rounded-full text-lg font-medium hover:bg-[#f0d800] transition-colors"
        >
          Get Started <span aria-hidden="true">&rarr;</span>
        </Link>

      </div>
    </section>
  );
}
