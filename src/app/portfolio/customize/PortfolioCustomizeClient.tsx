"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  portfolioId: string;
  slug: string;
  headline: string;
  bio: string;
  isPublished: boolean;
}

export function PortfolioCustomizeClient({
  slug,
  headline: initialHeadline,
  bio: initialBio,
  isPublished: initialPublished,
}: Props) {
  const [headline, setHeadline] = useState(initialHeadline);
  const [bio, setBio] = useState(initialBio);
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/portfolio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, bio, isPublished }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save changes.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    headline !== initialHeadline || bio !== initialBio || isPublished !== initialPublished;

  return (
    <div className="space-y-8">
      {/* Headline */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
          Headline
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/50"
          placeholder="Your professional tagline"
        />
      </div>

      {/* Bio */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#ef562a]/50 resize-none"
          placeholder="Your professional bio"
        />
      </div>

      {/* Publish toggle */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">Publish Portfolio</h3>
            <p className="text-sm text-[var(--gray-600)] mt-1">
              {isPublished
                ? "Your portfolio is live and visible to anyone."
                : "Your portfolio is in draft mode. Only you can see it."}
            </p>
          </div>
          <button
            onClick={() => setIsPublished(!isPublished)}
            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
              isPublished ? "bg-[#ef562a]" : "bg-[var(--gray-200)]"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                isPublished ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        {isPublished && (
          <p className="text-sm text-[var(--gray-600)] mt-3">
            Live at:{" "}
            <Link
              href={`/portfolio/${slug}`}
              className="text-[#ef562a] hover:underline"
            >
              /portfolio/{slug}
            </Link>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="px-6 py-3 bg-[#ef562a] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <Link
          href={`/portfolio/${slug}`}
          className="px-6 py-3 bg-[var(--gray-100)] text-[var(--foreground)] font-semibold rounded-xl hover:bg-[var(--gray-200)] transition-colors"
        >
          Preview
        </Link>
        {saved && <span className="text-green-600 text-sm font-semibold">Saved!</span>}
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    </div>
  );
}
