"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMicroWins } from "@/hooks/useMicroWins";
import { MicroWinCard } from "@/components/micro-wins/MicroWinCard";
import { MicroWinForm } from "@/components/micro-wins/MicroWinForm";
import { MICRO_WIN_PROMPTS } from "@/lib/micro-wins";

export default function MicroWinsWall() {
  const {
    microWins,
    isLoadingWins,
    hasMore,
    nextCursor,
    fetchMicroWins,
    isSubmitting,
    submitSuccess,
    submitError,
    submitMicroWin,
    resetSubmitState,
  } = useMicroWins();

  const [filterPrompt, setFilterPrompt] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchMicroWins({ promptType: filterPrompt || undefined });
  }, [fetchMicroWins, filterPrompt]);

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchMicroWins({
      promptType: filterPrompt || undefined,
      append: true,
      cursor: nextCursor || undefined,
    });
    setIsLoadingMore(false);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-[var(--background)] pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Link
              href="/community"
              className="text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] mb-4 inline-block"
            >
              &larr; Back to Community
            </Link>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-tight">
              Micro-Wins <span className="italic text-[#ef562a]">Wall</span>
            </h1>
            <p className="mt-6 text-xl text-[var(--gray-600)]">
              Celebrate the small moments that matter. Share what clicked, what
              made sense, or what you stopped doing.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-[var(--gray-50)] py-12 md:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <MicroWinForm
            onSubmit={submitMicroWin}
            isSubmitting={isSubmitting}
            error={submitError}
            isSuccess={submitSuccess}
            onReset={resetSubmitState}
          />
        </div>
      </section>

      {/* Wall Section */}
      <section className="bg-[var(--background)] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-3 mb-12">
            <button
              onClick={() => setFilterPrompt(null)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                !filterPrompt
                  ? "bg-[#ffe500] text-black"
                  : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
              }`}
            >
              All Wins
            </button>
            {Object.entries(MICRO_WIN_PROMPTS).map(([key, prompt]) => (
              <button
                key={key}
                onClick={() => setFilterPrompt(key)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterPrompt === key
                    ? "bg-[#ffe500] text-black"
                    : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
                }`}
              >
                {prompt.emoji} {prompt.prompt.replace("?", "")}
              </button>
            ))}
          </div>

          {/* Grid */}
          {isLoadingWins ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
          ) : microWins.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--gray-100)] flex items-center justify-center">
                <span className="text-4xl">✨</span>
              </div>
              <h3 className="font-serif text-2xl mb-2">No wins shared yet</h3>
              <p className="text-[var(--gray-600)]">
                Be the first to share a micro-win with the community!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          )}

          {/* Load More */}
          {hasMore && !isLoadingWins && (
            <div className="mt-12 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? "Loading..." : "Load More Wins"}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
