"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useMicroWins } from "@/hooks/useMicroWins";
import { MicroWinForm } from "@/components/micro-wins/MicroWinForm";
import { ActivityFeed } from "@/components/ActivityFeed";
import { usePagePresence } from "@/hooks/usePagePresence";
import { MICRO_WIN_PROMPTS, formatRelativeTime } from "@/lib/micro-wins";

// Sticky note colors for variety - consistent colors that work in both light/dark modes
const STICKY_COLORS = [
  { bg: "bg-yellow-100", border: "border-yellow-300", text: "text-gray-800", subtext: "text-gray-700", muted: "text-gray-600" },
  { bg: "bg-pink-100", border: "border-pink-300", text: "text-gray-800", subtext: "text-gray-700", muted: "text-gray-600" },
  { bg: "bg-blue-100", border: "border-blue-300", text: "text-gray-800", subtext: "text-gray-700", muted: "text-gray-600" },
  { bg: "bg-green-100", border: "border-green-300", text: "text-gray-800", subtext: "text-gray-700", muted: "text-gray-600" },
  { bg: "bg-purple-100", border: "border-purple-300", text: "text-gray-800", subtext: "text-gray-700", muted: "text-gray-600" },
  { bg: "bg-orange-100", border: "border-orange-300", text: "text-gray-800", subtext: "text-gray-700", muted: "text-gray-600" },
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
      <main className="min-h-screen pt-20 md:pt-[144px]" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        {/* Cover to hide content behind nav area */}
        <div className="fixed top-0 left-0 right-0 h-20 md:h-[144px] z-30 pointer-events-none" style={{ background: 'var(--background)' }} />

        {/* Board Background with dots pattern */}
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, var(--gray-600) 0.5px, transparent 0.5px)`,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Board Header - hidden on mobile */}
        <div className="hidden md:block sticky top-20 md:top-[144px] z-40 border-b border-[var(--card-border)]" style={{ background: 'var(--background)' }}>
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

            {/* Filter Pills - hidden on mobile */}
            <div className="hidden md:flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setFilterPrompt(null)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !filterPrompt
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)] border border-[var(--card-border)]"
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
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)] border border-[var(--card-border)]"
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
              <div className="flex-1 min-w-0 min-h-[150vh]">
                {!isLoadingWins && microWins.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-24 h-24 mb-6 rounded-2xl bg-[var(--accent-yellow-bg)] border-2 border-[var(--card-border)] flex items-center justify-center rotate-3 shadow-lg">
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
                          <span className={`text-xs font-semibold uppercase tracking-wider ${color.subtext}`}>
                            {prompt?.prompt.replace("?", "").replace("What ", "").replace("What's ", "") || "Win"}
                          </span>
                        </div>

                        {/* Content */}
                        <p className={`leading-relaxed mb-4 ${color.text}`}>
                          &ldquo;{win.content}&rdquo;
                        </p>

                        {/* Footer */}
                        <div className={`flex items-center justify-between text-xs pt-3 border-t border-black/10 ${color.muted}`}>
                          <span className={`font-semibold ${color.subtext}`}>{win.authorName || "Anonymous"}</span>
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
                      className="bg-[var(--gray-100)] text-[var(--foreground)] px-8 py-3 rounded-lg font-medium hover:bg-[var(--gray-200)] transition-colors border border-[var(--card-border)] shadow-sm disabled:opacity-50"
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
