"use client";

import { useEffect, useState } from "react";

interface ActivityItem {
  id: string;
  type: "completed" | "bookmarked" | "milestone" | "active";
  message: string;
  timestamp: Date;
}

// Sample activity data - in production this would come from an API
const SAMPLE_ACTIVITIES: ActivityItem[] = [
  { id: "1", type: "completed", message: "Someone just completed the System Design Guide", timestamp: new Date(Date.now() - 2 * 60 * 1000) },
  { id: "2", type: "bookmarked", message: "3 people bookmarked Claude Code in the last hour", timestamp: new Date(Date.now() - 15 * 60 * 1000) },
  { id: "3", type: "milestone", message: "A learner just landed an offer after 4 months", timestamp: new Date(Date.now() - 45 * 60 * 1000) },
  { id: "4", type: "active", message: "12 people are currently studying for interviews", timestamp: new Date(Date.now() - 5 * 60 * 1000) },
  { id: "5", type: "completed", message: "Someone finished the Resume & LinkedIn course", timestamp: new Date(Date.now() - 90 * 60 * 1000) },
  { id: "6", type: "bookmarked", message: "5 people saved Salary Negotiation tips today", timestamp: new Date(Date.now() - 120 * 60 * 1000) },
  { id: "7", type: "milestone", message: "A member got promoted to Senior Engineer", timestamp: new Date(Date.now() - 180 * 60 * 1000) },
  { id: "8", type: "active", message: "8 people are reading Break Into Tech right now", timestamp: new Date(Date.now() - 10 * 60 * 1000) },
];

const ACTIVITY_ICONS: Record<ActivityItem["type"], { icon: string; color: string }> = {
  completed: { icon: "✓", color: "bg-green-100 text-green-600" },
  bookmarked: { icon: "★", color: "bg-yellow-100 text-yellow-600" },
  milestone: { icon: "🎉", color: "bg-purple-100 text-purple-600" },
  active: { icon: "●", color: "bg-blue-100 text-blue-600" },
};

function formatTimeAgo(date: Date): string {
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
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate loading activities
    setActivities(SAMPLE_ACTIVITIES);
  }, []);

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
      <div className="sticky top-36 max-h-[calc(100vh-10rem)] overflow-hidden">
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

          {/* Activity List */}
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[calc(100vh-14rem)] overflow-y-auto">
            {activities.map((activity) => {
              const { icon, color } = ACTIVITY_ICONS[activity.type];
              return (
                <div
                  key={activity.id}
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center shrink-0 text-xs font-bold`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
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
