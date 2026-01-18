"use client";

import { usePagePresence } from "@/hooks/usePagePresence";

interface PagePresenceTrackerProps {
  page: string;
}

export function PagePresenceTracker({ page }: PagePresenceTrackerProps) {
  usePagePresence(page);
  return null; // This component doesn't render anything
}
