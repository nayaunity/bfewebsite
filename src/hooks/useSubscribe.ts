"use client";

import { useState, useCallback } from "react";

interface SubscribeState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  message: string | null;
}

interface SubscribeOptions {
  tags?: string[];
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useSubscribe() {
  const [state, setState] = useState<SubscribeState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    message: null,
  });

  const subscribe = useCallback(
    async (email: string, options: SubscribeOptions = {}) => {
      const { tags, onSuccess, onError } = options;

      setState({
        isLoading: true,
        isSuccess: false,
        error: null,
        message: null,
      });

      try {
        const response = await fetch("/api/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, tags }),
        });

        const data = await response.json();

        if (response.ok || data.alreadySubscribed) {
          setState({
            isLoading: false,
            isSuccess: true,
            error: null,
            message: data.message || "Thanks for subscribing!",
          });
          onSuccess?.();
        } else {
          const errorMessage = data.error || "Subscription failed";
          setState({
            isLoading: false,
            isSuccess: false,
            error: errorMessage,
            message: null,
          });
          onError?.(errorMessage);
        }
      } catch {
        const errorMessage = "Network error. Please try again.";
        setState({
          isLoading: false,
          isSuccess: false,
          error: errorMessage,
          message: null,
        });
        onError?.(errorMessage);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      error: null,
      message: null,
    });
  }, []);

  return {
    ...state,
    subscribe,
    reset,
  };
}
