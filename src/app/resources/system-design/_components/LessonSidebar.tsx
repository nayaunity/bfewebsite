"use client";

import { useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/courses";

interface LessonSidebarProps {
  course: Course;
  currentSlug?: string;
}

export default function LessonSidebar({ course, currentSlug }: LessonSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Find the module that contains the current lesson
  const currentModuleId = currentSlug
    ? course.modules.find((m) =>
        m.lessons.some((l) => l.slug === currentSlug)
      )?.id || 1
    : 1;

  const [activeModule, setActiveModule] = useState(currentModuleId);

  return (
    <aside className={`${sidebarOpen ? "w-80" : "w-12"} flex-shrink-0 transition-all hidden lg:block`}>
      <div className="sticky top-36">
        <div className="flex items-center justify-between mb-4">
          {sidebarOpen && <h3 className="font-medium">Course Content</h3>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className={`w-5 h-5 transition-transform ${sidebarOpen ? "" : "rotate-180"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {sidebarOpen && (
          <div className="space-y-2">
            {course.modules.map((module) => (
              <div key={module.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setActiveModule(activeModule === module.id ? 0 : module.id)}
                  className={`w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    activeModule === module.id ? "bg-gray-50" : ""
                  }`}
                >
                  <div>
                    <span className="text-xs text-gray-500">Module {module.id}</span>
                    <h4 className="font-medium text-sm">{module.title}</h4>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      activeModule === module.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {activeModule === module.id && (
                  <div className="border-t border-gray-100">
                    {module.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/resources/system-design/${lesson.slug}`}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-sm block ${
                          currentSlug === lesson.slug ? "bg-[#ffe500]/20" : ""
                        }`}
                      >
                        {lesson.free ? (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                            {currentSlug === lesson.slug && (
                              <div className="w-2 h-2 rounded-full bg-[#ef562a]"></div>
                            )}
                          </div>
                        ) : (
                          <svg
                            className="w-6 h-6 text-gray-300 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`truncate ${currentSlug === lesson.slug ? "text-[#ef562a] font-medium" : ""}`}>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-gray-400">{lesson.duration}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
