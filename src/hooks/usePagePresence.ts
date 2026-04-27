"use client";

import { useEffect, useCallback, useRef } from "react";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const VISITOR_ID_KEY = "bfe_visitor_id";
const UTM_KEY = "bfe_utm";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";

  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

interface UtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

function captureUtm(): UtmParams | null {
  if (typeof window === "undefined") return null;

  const existing = localStorage.getItem(UTM_KEY);
  if (existing) {
    try { return JSON.parse(existing); } catch { /* fall through */ }
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");

  if (utmSource || utmMedium || utmCampaign) {
    const utm: UtmParams = {};
    if (utmSource) utm.utmSource = utmSource;
    if (utmMedium) utm.utmMedium = utmMedium;
    if (utmCampaign) utm.utmCampaign = utmCampaign;
    localStorage.setItem(UTM_KEY, JSON.stringify(utm));
    return utm;
  }

  return null;
}

export function usePagePresence(page: string) {
  const visitorIdRef = useRef<string>("");
  const utmRef = useRef<UtmParams | null>(null);
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
          ...utmRef.current,
        }),
      });
    } catch (error) {
      console.debug("Presence heartbeat failed:", error);
    }
  }, [page]);

  useEffect(() => {
    visitorIdRef.current = getOrCreateVisitorId();
    utmRef.current = captureUtm();

    sendHeartbeat();

    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [page, sendHeartbeat]);

  return { visitorId: visitorIdRef.current };
}
