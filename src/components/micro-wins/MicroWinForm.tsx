"use client";

import { useState } from "react";
import {
  MICRO_WIN_PROMPTS,
  MAX_CONTENT_LENGTH,
  PromptType,
} from "@/lib/micro-wins";

interface MicroWinFormProps {
  onSubmit: (data: {
    content: string;
    promptType: PromptType;
    authorName?: string;
  }) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
  isSuccess: boolean;
  onReset: () => void;
}

export function MicroWinForm({
  onSubmit,
  isSubmitting,
  error,
  isSuccess,
  onReset,
}: MicroWinFormProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptType>("clicked");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");

  const currentPrompt = MICRO_WIN_PROMPTS[selectedPrompt];
  const charCount = content.length;
  const isOverLimit = charCount > MAX_CONTENT_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverLimit || !content.trim()) return;

    const success = await onSubmit({
      content: content.trim(),
      promptType: selectedPrompt,
      authorName: authorName.trim() || undefined,
    });

    if (success) {
      setContent("");
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="font-serif text-xl mb-2">Win shared!</h3>
        <p className="text-[var(--gray-600)] mb-4">
          Thanks for contributing to the community.
        </p>
        <button
          onClick={onReset}
          className="text-[#ef562a] font-medium hover:underline"
        >
          Share another win
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6"
    >
      {/* Prompt Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Choose a prompt</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(MICRO_WIN_PROMPTS).map(([key, prompt]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedPrompt(key as PromptType)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedPrompt === key
                  ? "bg-[#ffe500] text-black"
                  : "bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]"
              }`}
            >
              {prompt.emoji} {prompt.prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Content Textarea */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          {currentPrompt.prompt}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={currentPrompt.placeholder}
          rows={3}
          maxLength={MAX_CONTENT_LENGTH + 50}
          disabled={isSubmitting}
          className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors resize-none bg-[var(--background)] disabled:opacity-50"
        />
        <div
          className={`mt-1 text-sm text-right ${isOverLimit ? "text-red-500" : "text-[var(--gray-600)]"}`}
        >
          {charCount}/{MAX_CONTENT_LENGTH}
        </div>
      </div>

      {/* Author Name (Optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Display name{" "}
          <span className="text-[var(--gray-600)] font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="e.g., Sarah T."
          maxLength={50}
          disabled={isSubmitting}
          className="w-full px-4 py-3 border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#ef562a] transition-colors bg-[var(--background)] disabled:opacity-50"
        />
        <p className="mt-1 text-sm text-[var(--gray-600)]">
          Leave blank to post anonymously
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isOverLimit || !content.trim()}
        className="w-full bg-[#ffe500] text-black px-8 py-4 rounded-full font-medium hover:bg-[#f5dc00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sharing..." : "Share your win"}
      </button>
    </form>
  );
}
