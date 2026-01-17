"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { Module } from "@/lib/courses";
import { useProgress } from "@/hooks/useProgress";

interface ModuleLessonsProps {
  module: Module;
  coursePath: string;
  courseId: string;
}

export default function ModuleLessons({ module, coursePath, courseId }: ModuleLessonsProps) {
  const { status } = useSession();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isCompleted } = useProgress(courseId);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      setHasAccess(true);
    } else {
      const unlocked = localStorage.getItem("bfe-course-access");
      setHasAccess(unlocked === "true");
    }
    setIsLoading(false);
  }, [status]);

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {module.lessons.map((lesson) => {
        const isAccessible = lesson.free || hasAccess;

        return (
          <Link
            key={lesson.id}
            href={`${coursePath}/${lesson.slug}`}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            {/* Icon - show checkmark if completed, lock if not accessible, lesson type otherwise */}
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
            ) : isCompleted(lesson.slug) ? (
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : isAccessible ? (
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:border-[#ef562a]">
                {lesson.type === "video" ? (
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                ) : lesson.type === "workshop" ? (
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}

            {/* Lesson info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate group-hover:text-[#ef562a] ${isCompleted(lesson.slug) ? "text-green-700" : ""}`}>
                {lesson.title}
              </p>
              <p className="text-xs text-gray-400">
                {lesson.duration} &bull; {lesson.type}
              </p>
            </div>

            {/* Badge - only show if not logged in */}
            {!isLoading && !hasAccess && lesson.free && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                Unlocked
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
