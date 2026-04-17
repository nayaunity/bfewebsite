"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Reading your resume...",
  "The average job seeker sends 500+ applications before landing a role.",
  "Identifying roles you're a fit for...",
  "Our users get 10x more interviews than applying one at a time.",
  "Matching you against 8,000+ open engineering, PM, and design roles...",
  "Ranking jobs by how well they match your experience and location...",
  "Almost done...",
];

export default function ExtractingLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-[var(--card-border)] border-t-[#ef562a]" />
      </div>
      <p
        key={index}
        className="mt-8 max-w-xl animate-fade-in text-lg font-medium sm:text-xl"
      >
        {MESSAGES[index]}
      </p>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        p { animation: fade-in 400ms ease-out; }
      `}</style>
    </section>
  );
}
