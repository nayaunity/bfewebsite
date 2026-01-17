"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useProgress } from "@/hooks/useProgress";
import type { Course } from "@/lib/courses";

interface CourseProgressProps {
  course: Course;
}

export default function CourseProgress({ course }: CourseProgressProps) {
  const { data: session, status } = useSession();
  const { getCompletedCount, isLoading } = useProgress(course.id);

  const totalLessons = course.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0
  );
  const completedCount = getCompletedCount();
  const progressPercentage = Math.round((completedCount / totalLessons) * 100);

  // Loading state
  if (status === "loading" || isLoading) {
    return null;
  }

  // Not signed in - show prompt
  if (!session?.user) {
    return (
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-lg mb-1">Track your progress</h3>
            <p className="text-neutral-400 text-sm">
              Sign in to save your progress and pick up where you left off.
            </p>
          </div>
          <Link
            href="/auth/signin?callbackUrl=/resources/personal-branding"
            className="px-5 py-2.5 bg-white text-neutral-900 rounded-full font-medium hover:bg-neutral-100 transition-colors text-sm"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Signed in - show progress bar
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-lg">Your Progress</h3>
          <p className="text-gray-600 text-sm">
            {completedCount} of {totalLessons} lessons completed
          </p>
        </div>
        <span className="text-2xl font-bold text-neutral-900">
          {progressPercentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Motivational message */}
      {completedCount === 0 && (
        <p className="text-sm text-gray-500 mt-4">
          Ready to start? Begin your first lesson!
        </p>
      )}
      {completedCount > 0 && completedCount < totalLessons && (
        <p className="text-sm text-gray-500 mt-4">
          Keep going! You&apos;re making great progress.
        </p>
      )}
      {completedCount === totalLessons && (
        <p className="text-sm text-green-600 font-medium mt-4">
          Congratulations! You&apos;ve completed the course!
        </p>
      )}
    </div>
  );
}
