"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { LessonContent as LessonContentType, Lesson, Course } from "@/lib/courses";
import { useSubscribe } from "@/hooks/useSubscribe";

interface LessonContentProps {
  lesson: Lesson;
  content: LessonContentType | null;
  course: Course;
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
}

export default function LessonContent({
  lesson,
  content,
  course,
  prevLesson,
  nextLesson,
}: LessonContentProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { isLoading: isSubmitting, error: subscribeError, subscribe } = useSubscribe();

  useEffect(() => {
    // Check if user has unlocked premium content
    const unlocked = localStorage.getItem("bfe-course-access");
    setHasAccess(unlocked === "true");
    setIsLoading(false);
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    await subscribe(email, {
      tags: ["bfewebsite", "course-signup", "system-design-guide"],
      onSuccess: () => {
        // Store access in localStorage
        localStorage.setItem("bfe-course-access", "true");
        localStorage.setItem("bfe-user-email", email);
        setHasAccess(true);
      },
    });
  };

  const hasContent = content !== null;
  const isLocked = !lesson.free && !hasAccess;

  // Show loading state while checking localStorage
  if (isLoading) {
    return (
      <div className="flex-1 min-w-0">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show locked state for premium lessons
  if (isLocked) {
    return (
      <div className="flex-1 min-w-0">
        {/* Lesson Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl">{lesson.title}</h1>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {lesson.duration}
            </span>
            <span className="flex items-center gap-1.5 text-amber-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Premium Content
            </span>
          </div>
        </div>

        {/* Locked Content - Clean centered unlock form */}
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ffe500] flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl mb-4">
              Unlock This Lesson
            </h2>
            <p className="text-gray-600 mb-6">
              Enter your email to get free access to all {course.stats.lessons} lessons in this guide.
            </p>
            <form onSubmit={handleUnlock} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isSubmitting}
                className="w-full px-5 py-4 border border-gray-300 rounded-full focus:outline-none focus:border-[#ef562a] bg-white disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#ef562a] text-white px-8 py-4 rounded-full font-medium hover:bg-[#d94d25] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Unlocking..." : "Get Free Access"}
              </button>
              {subscribeError && (
                <p className="text-sm text-red-600 text-center">{subscribeError}</p>
              )}
            </form>
            <p className="text-xs text-gray-500 mt-4">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </div>

        {/* Navigation still visible */}
        <div className="mt-12 flex items-center justify-between pt-8 border-t border-gray-100">
          {prevLesson ? (
            <Link
              href={`/resources/system-design/${prevLesson.slug}`}
              className="flex items-center gap-2 text-gray-600 hover:text-[#ef562a] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <div className="text-left">
                <span className="text-xs text-gray-400 block">Previous</span>
                <span className="font-medium">{prevLesson.title}</span>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {nextLesson ? (
            <Link
              href={`/resources/system-design/${nextLesson.slug}`}
              className="flex items-center gap-2 text-gray-600 hover:text-[#ef562a] transition-colors"
            >
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Next</span>
                <span className="font-medium">{nextLesson.title}</span>
              </div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  }

  // Show full content for free lessons or unlocked users
  return (
    <div className="flex-1 min-w-0">
      {/* Lesson Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl">{lesson.title}</h1>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {lesson.duration}
          </span>
          <span className="flex items-center gap-1.5 capitalize">
            {lesson.type === "video" && (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {lesson.type === "article" && (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {lesson.type === "workshop" && (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            )}
            {lesson.type}
          </span>
          {lesson.free ? (
            <span className="flex items-center gap-1.5 text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              Free
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Unlocked
            </span>
          )}
        </div>
      </div>

      {/* Lesson Content */}
      {hasContent ? (
        <>
          <article className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-600 leading-relaxed">
              {content.intro}
            </p>

            {content.sections.map((section, index) => (
              <div key={index} className="mt-10">
                <h2 className="font-serif text-2xl mb-4">{section.heading}</h2>
                <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </div>
            ))}
          </article>

          {/* Curated Resources */}
          {content.resources.length > 0 && (
            <div className="mt-12 p-6 md:p-8 bg-gray-50 rounded-2xl">
              <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Curated Resources
              </h3>
              <div className="space-y-4">
                {content.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white p-4 rounded-xl border border-gray-100 hover:border-[#ffe500] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {resource.type}
                        </span>
                        <h4 className="font-medium mt-2 group-hover:text-[#ef562a] transition-colors">
                          {resource.title}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">{resource.source}</p>
                        <p className="text-sm text-gray-600 mt-2">{resource.description}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-300 group-hover:text-[#ef562a] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Key Takeaways */}
          {content.keyTakeaways.length > 0 && (
            <div className="mt-8 p-6 md:p-8 bg-[#ffe500]/10 border border-[#ffe500]/30 rounded-2xl">
              <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Key Takeaways
              </h3>
              <ul className="space-y-3">
                {content.keyTakeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        /* Coming Soon State */
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl mb-4">Content Coming Soon</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            We&apos;re working on this lesson. Check back soon or explore other available lessons.
          </p>
          <Link
            href="/resources/system-design"
            className="inline-block mt-6 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            Back to Course Overview
          </Link>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between pt-8 border-t border-gray-100">
        {prevLesson ? (
          <Link
            href={`/resources/system-design/${prevLesson.slug}`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#ef562a] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <div className="text-left">
              <span className="text-xs text-gray-400 block">Previous</span>
              <span className="font-medium">{prevLesson.title}</span>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <Link
            href={`/resources/system-design/${nextLesson.slug}`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#ef562a] transition-colors"
          >
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Next</span>
              <span className="font-medium">{nextLesson.title}</span>
            </div>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
