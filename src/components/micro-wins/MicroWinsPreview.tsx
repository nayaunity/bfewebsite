"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MicroWinCard } from "./MicroWinCard";

interface MicroWin {
  id: string;
  content: string;
  promptType: string;
  authorName: string | null;
  createdAt: string;
}

export function MicroWinsPreview() {
  const [microWins, setMicroWins] = useState<MicroWin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPreview() {
      try {
        const response = await fetch("/api/micro-wins?limit=3");
        const data = await response.json();
        if (response.ok) {
          setMicroWins(data.microWins);
        }
      } catch {
        // Silently fail for preview
      } finally {
        setIsLoading(false);
      }
    }
    fetchPreview();
  }, []);

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 animate-pulse"
          >
            <div className="h-4 bg-[var(--gray-200)] rounded w-1/3 mb-4" />
            <div className="h-4 bg-[var(--gray-200)] rounded w-full mb-2" />
            <div className="h-4 bg-[var(--gray-200)] rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (microWins.length === 0) {
    return (
      <div className="text-center py-12 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gray-100)] flex items-center justify-center">
          <span className="text-3xl">✨</span>
        </div>
        <h3 className="font-serif text-xl mb-2">Be the first to share</h3>
        <p className="text-[var(--gray-600)] mb-4">
          Share your small wins with the community
        </p>
        <Link
          href="/community/micro-wins"
          className="inline-block bg-[#ffe500] text-black px-6 py-3 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
        >
          Share a win
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {microWins.map((win) => (
        <MicroWinCard
          key={win.id}
          content={win.content}
          promptType={win.promptType}
          authorName={win.authorName}
          createdAt={win.createdAt}
        />
      ))}
    </div>
  );
}
