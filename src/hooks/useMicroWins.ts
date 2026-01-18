"use client";

import { useState, useCallback } from "react";
import { MAX_CONTENT_LENGTH, PromptType } from "@/lib/micro-wins";

interface MicroWin {
  id: string;
  content: string;
  promptType: string;
  authorName: string | null;
  createdAt: string;
}

interface SubmitState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
}

interface FetchState {
  microWins: MicroWin[];
  isLoading: boolean;
  error: string | null;
  nextCursor: string | null;
}

export function useMicroWins() {
  const [submitState, setSubmitState] = useState<SubmitState>({
    isLoading: false,
    isSuccess: false,
    error: null,
  });

  const [fetchState, setFetchState] = useState<FetchState>({
    microWins: [],
    isLoading: true,
    error: null,
    nextCursor: null,
  });

  const fetchMicroWins = useCallback(
    async (options?: {
      promptType?: string;
      append?: boolean;
      cursor?: string;
    }) => {
      const { promptType, append = false, cursor } = options || {};

      if (!append) {
        setFetchState((prev) => ({ ...prev, isLoading: true, error: null }));
      }

      try {
        const params = new URLSearchParams();
        if (promptType) params.set("promptType", promptType);
        if (cursor) params.set("cursor", cursor);

        const response = await fetch(`/api/micro-wins?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch");
        }

        setFetchState((prev) => ({
          microWins: append
            ? [...prev.microWins, ...data.microWins]
            : data.microWins,
          isLoading: false,
          error: null,
          nextCursor: data.nextCursor,
        }));
      } catch (err) {
        setFetchState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load micro-wins",
        }));
      }
    },
    []
  );

  const submitMicroWin = useCallback(
    async (data: {
      content: string;
      promptType: PromptType;
      authorName?: string;
    }) => {
      if (data.content.trim().length === 0) {
        setSubmitState({
          isLoading: false,
          isSuccess: false,
          error: "Content cannot be empty",
        });
        return false;
      }

      if (data.content.length > MAX_CONTENT_LENGTH) {
        setSubmitState({
          isLoading: false,
          isSuccess: false,
          error: `Content must be ${MAX_CONTENT_LENGTH} characters or less`,
        });
        return false;
      }

      setSubmitState({ isLoading: true, isSuccess: false, error: null });

      try {
        const response = await fetch("/api/micro-wins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to submit");
        }

        setSubmitState({ isLoading: false, isSuccess: true, error: null });

        // Prepend new entry to list
        setFetchState((prev) => ({
          ...prev,
          microWins: [result.microWin, ...prev.microWins],
        }));

        return true;
      } catch (err) {
        setSubmitState({
          isLoading: false,
          isSuccess: false,
          error: err instanceof Error ? err.message : "Failed to submit",
        });
        return false;
      }
    },
    []
  );

  const resetSubmitState = useCallback(() => {
    setSubmitState({ isLoading: false, isSuccess: false, error: null });
  }, []);

  return {
    // Fetch state
    microWins: fetchState.microWins,
    isLoadingWins: fetchState.isLoading,
    fetchError: fetchState.error,
    hasMore: !!fetchState.nextCursor,
    nextCursor: fetchState.nextCursor,
    fetchMicroWins,

    // Submit state
    isSubmitting: submitState.isLoading,
    submitSuccess: submitState.isSuccess,
    submitError: submitState.error,
    submitMicroWin,
    resetSubmitState,
  };
}
