"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface ProgressItem {
  completed: boolean;
  completedAt: Date | null;
}

type ProgressMap = Record<string, ProgressItem>;

export function useProgress(courseId: string) {
  const { data: session, status } = useSession();
  const [progress, setProgress] = useState<ProgressMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch progress from server
  const fetchProgress = useCallback(async () => {
    if (status === "loading") return;

    if (!session?.user) {
      // Not signed in - check localStorage for migration
      const localProgress = localStorage.getItem(`bfe-progress-${courseId}`);
      if (localProgress) {
        try {
          setProgress(JSON.parse(localProgress));
        } catch {
          setProgress({});
        }
      } else {
        setProgress({});
      }
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/progress?courseId=${courseId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch progress");
      }

      const data = await response.json();
      setProgress(data.progress || {});

      // Migrate localStorage progress if exists
      const localProgress = localStorage.getItem(`bfe-progress-${courseId}`);
      if (localProgress) {
        try {
          const parsed = JSON.parse(localProgress) as ProgressMap;
          // Merge local progress to server
          for (const [lessonSlug, item] of Object.entries(parsed)) {
            if (item.completed && !data.progress?.[lessonSlug]?.completed) {
              await markComplete(lessonSlug, true);
            }
          }
          // Clear localStorage after migration
          localStorage.removeItem(`bfe-progress-${courseId}`);
        } catch {
          // Ignore localStorage errors
        }
      }
    } catch (err) {
      console.error("Error fetching progress:", err);
      setError("Failed to load progress");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, session, status]);

  // Mark a lesson as complete/incomplete
  const markComplete = useCallback(
    async (lessonSlug: string, completed: boolean) => {
      // Optimistically update local state
      setProgress((prev) => ({
        ...prev,
        [lessonSlug]: {
          completed,
          completedAt: completed ? new Date() : null,
        },
      }));

      if (!session?.user) {
        // Not signed in - save to localStorage
        setProgress((prev) => {
          const newProgress = {
            ...prev,
            [lessonSlug]: {
              completed,
              completedAt: completed ? new Date() : null,
            },
          };
          localStorage.setItem(
            `bfe-progress-${courseId}`,
            JSON.stringify(newProgress)
          );
          return newProgress;
        });
        return;
      }

      try {
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            lessonSlug,
            completed,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update progress");
        }
      } catch (err) {
        console.error("Error updating progress:", err);
        // Revert optimistic update on error
        setProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[lessonSlug];
          return newProgress;
        });
        setError("Failed to save progress");
      }
    },
    [courseId, session]
  );

  // Check if a lesson is completed
  const isCompleted = useCallback(
    (lessonSlug: string) => {
      return progress[lessonSlug]?.completed ?? false;
    },
    [progress]
  );

  // Get completion count
  const getCompletedCount = useCallback(() => {
    return Object.values(progress).filter((p) => p.completed).length;
  }, [progress]);

  // Load progress on mount and when session changes
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    isLoading,
    error,
    markComplete,
    isCompleted,
    getCompletedCount,
    isSignedIn: !!session?.user,
  };
}
