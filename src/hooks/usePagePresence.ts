"use client";

import { useEffect, useCallback, useRef } from "react";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const VISITOR_ID_KEY = "bfe_visitor_id";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";

  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

export function usePagePresence(page: string) {
  const visitorIdRef = useRef<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendHeartbeat = useCallback(async () => {
    if (!visitorIdRef.current || !page) return;

    try {
      await fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: visitorIdRef.current,
          page,
        }),
      });
    } catch (error) {
      // Silently fail - presence is not critical
      console.debug("Presence heartbeat failed:", error);
    }
  }, [page]);

  const removePresence = useCallback(async () => {
    if (!visitorIdRef.current || !page) return;

    try {
      await fetch("/api/presence", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: visitorIdRef.current,
          page,
        }),
      });
    } catch (error) {
      // Silently fail
      console.debug("Presence removal failed:", error);
    }
  }, [page]);

  useEffect(() => {
    visitorIdRef.current = getOrCreateVisitorId();

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval for heartbeats
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Handle visibility change (tab focus/blur)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Handle beforeunload to remove presence
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery on page unload
      if (navigator.sendBeacon && visitorIdRef.current) {
        navigator.sendBeacon(
          "/api/presence",
          JSON.stringify({
            visitorId: visitorIdRef.current,
            page,
            _action: "delete",
          })
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      removePresence();
    };
  }, [page, sendHeartbeat, removePresence]);

  return { visitorId: visitorIdRef.current };
}
