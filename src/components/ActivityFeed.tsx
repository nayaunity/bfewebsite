"use client";

import { useEffect, useState, useCallback } from "react";

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

interface PresenceData {
  home: number;
  jobs: number;
  resources: number;
  community: number;
  total: number;
}

interface StatsData {
  completionsToday: number;
  microWinsToday: number;
  jobClicksToday: number;
}

interface FeedData {
  activities: ActivityItem[];
  presence: PresenceData;
  stats: StatsData;
}

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  course_completed: { icon: "✓", color: "bg-green-100 text-green-600" },
  lesson_completed: { icon: "📖", color: "bg-blue-100 text-blue-600" },
  micro_win: { icon: "✨", color: "bg-yellow-100 text-yellow-600" },
  job_click: { icon: "💼", color: "bg-purple-100 text-purple-600" },
  presence: { icon: "●", color: "bg-emerald-100 text-emerald-600" },
  stat: { icon: "📊", color: "bg-orange-100 text-orange-600" },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function ActivityFeed() {
  const [data, setData] = useState<FeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const response = await fetch("/api/activity");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.debug("Failed to fetch activity:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  // Build the feed items from presence, stats, and activities
  const feedItems: Array<{
    id: string;
    type: string;
    message: string;
    isLive: boolean;
    createdAt?: string;
  }> = [];

  if (data) {
    // Add presence items (always show these at the top)
    if (data.presence.jobs > 0) {
      feedItems.push({
        id: "presence-jobs",
        type: "presence",
        message: `${data.presence.jobs} ${data.presence.jobs === 1 ? "person" : "people"} looking for their perfect role`,
        isLive: true,
      });
    }

    if (data.presence.resources > 0) {
      feedItems.push({
        id: "presence-resources",
        type: "presence",
        message: `${data.presence.resources} ${data.presence.resources === 1 ? "person" : "people"} learning right now`,
        isLive: true,
      });
    }

    if (data.presence.community > 0) {
      feedItems.push({
        id: "presence-community",
        type: "presence",
        message: `${data.presence.community} ${data.presence.community === 1 ? "person" : "people"} on the community board`,
        isLive: true,
      });
    }

    // Add stats items
    if (data.stats.completionsToday > 0) {
      feedItems.push({
        id: "stat-completions",
        type: "stat",
        message: `${data.stats.completionsToday} lessons completed today`,
        isLive: false,
      });
    }

    if (data.stats.microWinsToday > 0) {
      feedItems.push({
        id: "stat-microwins",
        type: "stat",
        message: `${data.stats.microWinsToday} micro-wins shared today`,
        isLive: false,
      });
    }

    if (data.stats.jobClicksToday > 0) {
      feedItems.push({
        id: "stat-jobclicks",
        type: "stat",
        message: `${data.stats.jobClicksToday} job applications started today`,
        isLive: false,
      });
    }

    // Add recent activities
    data.activities.forEach((activity) => {
      feedItems.push({
        id: activity.id,
        type: activity.type,
        message: activity.message,
        createdAt: activity.createdAt,
        isLive: false,
      });
    });
  }

  // If no data and no activity, show some placeholder movement
  if (feedItems.length === 0 && !isLoading) {
    feedItems.push(
      { id: "placeholder-1", type: "presence", message: "Waiting for activity...", isLive: true },
    );
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-l-lg p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Show Activity Feed"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="hidden lg:block w-72 xl:w-80 shrink-0">
      <div className="sticky top-56 max-h-[calc(100vh-16rem)] overflow-hidden">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Activity Feed</h3>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Hide Activity Feed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Active Now Banner */}
          {data && data.presence.total > 0 && (
            <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-b border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
                </div>
                <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                  {data.presence.total} {data.presence.total === 1 ? "person" : "people"} active right now
                </span>
              </div>
            </div>
          )}

          {/* Activity List */}
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[calc(100vh-14rem)] overflow-y-auto">
            {isLoading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <div key={i} className="px-4 py-3 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              feedItems.map((item) => {
                const iconData = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.stat;
                return (
                  <div
                    key={item.id}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className={`w-7 h-7 rounded-full ${iconData.color} flex items-center justify-center shrink-0 text-xs font-bold`}>
                        {iconData.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                          {item.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {item.isLive ? (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              Live
                            </span>
                          ) : item.createdAt ? (
                            formatTimeAgo(item.createdAt)
                          ) : (
                            "Today"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              Live community activity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
