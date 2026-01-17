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
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-medium text-lg mb-1 text-[var(--foreground)]">Track your progress</h3>
            <p className="text-[var(--gray-600)] text-sm">
              Sign in to save your progress and pick up where you left off.
            </p>
          </div>
          <Link
            href="/auth/signin?callbackUrl=/resources/resume-linkedin"
            className="px-5 py-2.5 bg-[#ef562a] text-white rounded-full font-medium hover:bg-[#d94d25] transition-colors text-sm text-center shrink-0"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Signed in - show progress bar
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-lg">Your Progress</h3>
          <p className="text-[var(--gray-600)] text-sm">
            {completedCount} of {totalLessons} lessons completed
          </p>
        </div>
        <span className="text-2xl font-bold text-[var(--foreground)]">
          {progressPercentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-[var(--gray-100)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Motivational message */}
      {completedCount === 0 && (
        <p className="text-sm text-neutral-400 mt-4">
          Ready to start? Begin your first lesson!
        </p>
      )}
      {completedCount > 0 && completedCount < totalLessons && (
        <p className="text-sm text-neutral-400 mt-4">
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
