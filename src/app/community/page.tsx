"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useMicroWins } from "@/hooks/useMicroWins";
import { MicroWinForm } from "@/components/micro-wins/MicroWinForm";
import { ActivityFeed } from "@/components/ActivityFeed";
import { usePagePresence } from "@/hooks/usePagePresence";
import { MICRO_WIN_PROMPTS, formatRelativeTime } from "@/lib/micro-wins";

// Sticky note colors for variety
const STICKY_COLORS = [
  { bg: "bg-yellow-100", border: "border-yellow-200", shadow: "shadow-yellow-200/50" },
  { bg: "bg-pink-100", border: "border-pink-200", shadow: "shadow-pink-200/50" },
  { bg: "bg-blue-100", border: "border-blue-200", shadow: "shadow-blue-200/50" },
  { bg: "bg-green-100", border: "border-green-200", shadow: "shadow-green-200/50" },
  { bg: "bg-purple-100", border: "border-purple-200", shadow: "shadow-purple-200/50" },
  { bg: "bg-orange-100", border: "border-orange-200", shadow: "shadow-orange-200/50" },
];

function getStickyColor(index: number) {
  return STICKY_COLORS[index % STICKY_COLORS.length];
}

// Slight rotation for sticky note effect
function getRotation(index: number) {
  const rotations = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2", "rotate-0", "-rotate-1"];
  return rotations[index % rotations.length];
}

export default function CommunityPage() {
  // Track presence on community page
  usePagePresence("community");

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
  const [showForm, setShowForm] = useState(false);

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
      <Navigation />
      <main className="min-h-screen bg-white dark:bg-[#1a1a1a] pt-20 md:pt-[144px]">
        {/* White cover to hide content behind nav area */}
        <div className="fixed top-0 left-0 right-0 h-20 md:h-[144px] bg-white dark:bg-[#1a1a1a] z-30 pointer-events-none" />

        {/* Board Background with dots pattern */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `radial-gradient(circle, #9ca3af 0.5px, transparent 0.5px)`,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Board Header */}
        <div className="sticky top-20 md:top-[144px] z-40 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[var(--card-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <h1 className="font-serif text-2xl md:text-3xl">
                  Micro-Wins Wall
                </h1>
                <span className="text-sm text-[var(--gray-600)]">
                  {microWins.length} wins shared
                </span>
              </div>

              {/* Add Win Button */}
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 bg-[#ffe500] text-black px-5 py-2.5 rounded-lg font-medium hover:bg-[#f5dc00] transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add a win
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setFilterPrompt(null)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !filterPrompt
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] border border-gray-200 dark:border-gray-700"
                }`}
              >
                All
              </button>
              {Object.entries(MICRO_WIN_PROMPTS).map(([key, prompt]) => (
                <button
                  key={key}
                  onClick={() => setFilterPrompt(key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterPrompt === key
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {prompt.emoji} {prompt.prompt.replace("?", "").replace("What ", "").replace("What's ", "")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form Modal/Overlay */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-lg">
              <button
                onClick={() => {
                  setShowForm(false);
                  resetSubmitState();
                }}
                className="absolute -top-12 right-0 text-white hover:text-[#ffe500] transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <MicroWinForm
                onSubmit={async (data) => {
                  const success = await submitMicroWin(data);
                  if (success) {
                    setTimeout(() => {
                      setShowForm(false);
                      resetSubmitState();
                    }, 1500);
                  }
                  return success;
                }}
                isSubmitting={isSubmitting}
                error={submitError}
                isSuccess={submitSuccess}
                onReset={resetSubmitState}
              />
            </div>
          </div>
        )}

        {/* Board Content with Activity Feed */}
        <div className="relative z-10 pt-8 pb-24">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-6">
              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Loading State */}
                {isLoadingWins ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(8)].map((_, i) => {
                  const color = getStickyColor(i);
                  return (
                    <div
                      key={i}
                      className={`${color.bg} ${color.border} border-2 rounded-xl p-5 shadow-lg animate-pulse ${getRotation(i)}`}
                    >
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-black/10">
                        <div className="w-6 h-6 bg-white/50 rounded" />
                        <div className="h-3 bg-white/50 rounded w-24" />
                      </div>
                      <div className="h-4 bg-white/50 rounded w-full mb-2" />
                      <div className="h-4 bg-white/50 rounded w-4/5 mb-4" />
                      <div className="pt-3 border-t border-black/10 flex justify-between">
                        <div className="h-3 bg-white/50 rounded w-16" />
                        <div className="h-3 bg-white/50 rounded w-12" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : microWins.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-24 h-24 mb-6 rounded-2xl bg-yellow-100 border-2 border-yellow-200 flex items-center justify-center rotate-3 shadow-lg">
                  <span className="text-5xl">✨</span>
                </div>
                <h2 className="font-serif text-3xl mb-3">The board is empty</h2>
                <p className="text-[var(--gray-600)] mb-6 max-w-md">
                  Be the first to share a micro-win. What clicked for you recently?
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-[#ffe500] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#f5dc00] transition-colors shadow-sm"
                >
                  Add the first win
                </button>
              </div>
            ) : (
              /* Sticky Notes Grid */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {microWins.map((win, index) => {
                    const color = getStickyColor(index);
                    const prompt = MICRO_WIN_PROMPTS[win.promptType as keyof typeof MICRO_WIN_PROMPTS];

                    return (
                      <div
                        key={win.id}
                        className={`${color.bg} ${color.border} border-2 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 ${getRotation(index)} hover:rotate-0 hover:scale-[1.02] cursor-default`}
                      >
                        {/* Prompt Tag */}
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-black/10">
                          <span className="text-xl">{prompt?.emoji || "✨"}</span>
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            {prompt?.prompt.replace("?", "").replace("What ", "").replace("What's ", "") || "Win"}
                          </span>
                        </div>

                        {/* Content */}
                        <p className="text-gray-800 leading-relaxed mb-4">
                          &ldquo;{win.content}&rdquo;
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-black/10">
                          <span className="font-semibold text-gray-700">{win.authorName || "Anonymous"}</span>
                          <span>{formatRelativeTime(win.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="mt-12 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-200 px-8 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors border border-gray-200 dark:border-gray-700 shadow-sm disabled:opacity-50"
                    >
                      {isLoadingMore ? "Loading..." : "Load more wins"}
                    </button>
                  </div>
                )}
              </>
            )}
              </div>

              {/* Activity Feed Sidebar */}
              <ActivityFeed />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
