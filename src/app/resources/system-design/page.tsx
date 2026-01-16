"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// Course content structure
const modules = [
  {
    id: 1,
    title: "Foundations",
    description: "Build your system design mental framework",
    lessons: [
      {
        id: "1-1",
        title: "What is System Design?",
        duration: "10 min",
        type: "article",
        free: true,
      },
      {
        id: "1-2",
        title: "Why System Design Matters",
        duration: "8 min",
        type: "video",
        free: true,
      },
      {
        id: "1-3",
        title: "Thinking at Scale",
        duration: "15 min",
        type: "article",
        free: true,
      },
      {
        id: "1-4",
        title: "Key Metrics: Latency, Throughput, Availability",
        duration: "12 min",
        type: "article",
        free: true,
      },
    ],
  },
  {
    id: 2,
    title: "Building Blocks",
    description: "The core components of every system",
    lessons: [
      {
        id: "2-1",
        title: "Load Balancers",
        duration: "15 min",
        type: "video",
        free: true,
      },
      {
        id: "2-2",
        title: "Caching Strategies",
        duration: "20 min",
        type: "article",
        free: true,
      },
      {
        id: "2-3",
        title: "Databases: SQL vs NoSQL",
        duration: "25 min",
        type: "video",
        free: false,
      },
      {
        id: "2-4",
        title: "Message Queues & Event Streaming",
        duration: "18 min",
        type: "article",
        free: false,
      },
      {
        id: "2-5",
        title: "CDNs & Edge Computing",
        duration: "12 min",
        type: "article",
        free: false,
      },
      {
        id: "2-6",
        title: "API Design Principles",
        duration: "20 min",
        type: "video",
        free: false,
      },
    ],
  },
  {
    id: 3,
    title: "Core Concepts",
    description: "The theory behind scalable systems",
    lessons: [
      {
        id: "3-1",
        title: "CAP Theorem Explained",
        duration: "15 min",
        type: "video",
        free: false,
      },
      {
        id: "3-2",
        title: "Horizontal vs Vertical Scaling",
        duration: "12 min",
        type: "article",
        free: false,
      },
      {
        id: "3-3",
        title: "Database Sharding",
        duration: "20 min",
        type: "article",
        free: false,
      },
      {
        id: "3-4",
        title: "Replication Strategies",
        duration: "18 min",
        type: "video",
        free: false,
      },
      {
        id: "3-5",
        title: "Consistency Patterns",
        duration: "22 min",
        type: "article",
        free: false,
      },
    ],
  },
  {
    id: 4,
    title: "Real System Designs",
    description: "Learn by designing real-world systems",
    lessons: [
      {
        id: "4-1",
        title: "Design a URL Shortener",
        duration: "30 min",
        type: "workshop",
        free: false,
        difficulty: "Beginner",
      },
      {
        id: "4-2",
        title: "Design a Rate Limiter",
        duration: "25 min",
        type: "workshop",
        free: false,
        difficulty: "Beginner",
      },
      {
        id: "4-3",
        title: "Design Twitter's Feed",
        duration: "45 min",
        type: "workshop",
        free: false,
        difficulty: "Intermediate",
      },
      {
        id: "4-4",
        title: "Design a Chat Application",
        duration: "40 min",
        type: "workshop",
        free: false,
        difficulty: "Intermediate",
      },
      {
        id: "4-5",
        title: "Design YouTube/Netflix",
        duration: "50 min",
        type: "workshop",
        free: false,
        difficulty: "Advanced",
      },
      {
        id: "4-6",
        title: "Design Uber/Lyft",
        duration: "55 min",
        type: "workshop",
        free: false,
        difficulty: "Advanced",
      },
    ],
  },
  {
    id: 5,
    title: "Interview Prep",
    description: "Ace your system design interviews",
    lessons: [
      {
        id: "5-1",
        title: "The System Design Interview Framework",
        duration: "20 min",
        type: "article",
        free: false,
      },
      {
        id: "5-2",
        title: "How to Communicate Your Design",
        duration: "15 min",
        type: "video",
        free: false,
      },
      {
        id: "5-3",
        title: "Common Mistakes to Avoid",
        duration: "12 min",
        type: "article",
        free: false,
      },
      {
        id: "5-4",
        title: "Questions to Ask Your Interviewer",
        duration: "10 min",
        type: "article",
        free: false,
      },
      {
        id: "5-5",
        title: "Mock Interview Walkthrough",
        duration: "35 min",
        type: "video",
        free: false,
      },
    ],
  },
];

// Sample lesson content for the first lesson
const sampleLessonContent = {
  title: "What is System Design?",
  intro: `System design is the process of defining the architecture, components, modules, interfaces, and data flow of a system to satisfy specified requirements. It's how engineers plan and build software that can handle millions of users, process massive amounts of data, and remain reliable under pressure.`,
  sections: [
    {
      heading: "Why Should You Learn System Design?",
      content: `Whether you're preparing for technical interviews at top tech companies or building real products, system design skills are essential. Here's why:

• **Interviews**: FAANG and most tech companies include system design rounds for mid-level and senior positions
• **Real-world impact**: Understanding how to design scalable systems makes you a more effective engineer
• **Career growth**: System design knowledge is often what separates senior engineers from juniors`,
    },
    {
      heading: "What You'll Learn in This Guide",
      content: `This comprehensive guide will take you from fundamentals to designing complex distributed systems. By the end, you'll be able to:

• Understand the building blocks of scalable systems
• Apply key concepts like caching, load balancing, and database sharding
• Design systems like Twitter, Netflix, and Uber from scratch
• Communicate your designs effectively in interviews`,
    },
  ],
  resources: [
    {
      title: "System Design Primer",
      source: "GitHub",
      url: "https://github.com/donnemartin/system-design-primer",
      type: "Reading",
      description: "The most comprehensive open-source system design resource",
    },
    {
      title: "System Design Fundamentals",
      source: "ByteByteGo",
      url: "https://www.youtube.com/watch?v=Y-Gl4HEyeUQ",
      type: "Video",
      description: "Visual introduction to system design concepts",
    },
    {
      title: "Designing Data-Intensive Applications",
      source: "Book",
      url: "https://dataintensive.net/",
      type: "Book",
      description: "The definitive book on distributed systems (highly recommended)",
    },
  ],
  keyTakeaways: [
    "System design is about making trade-offs between competing requirements",
    "There's rarely a 'perfect' solution—context matters",
    "Start simple, then iterate based on requirements",
    "Communication is as important as technical knowledge",
  ],
};

export default function SystemDesignGuidePage() {
  const [activeModule, setActiveModule] = useState(1);
  const [activeLesson, setActiveLesson] = useState("1-1");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const freeLessons = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.free).length,
    0
  );

  return (
    <>
      <Navigation />
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-12 md:py-16 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Link href="/resources" className="hover:text-[#ef562a]">
                Resources
              </Link>
              <span>/</span>
              <span>System Design Guide</span>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-purple-100 text-purple-800 mb-4">
                  Advanced
                </span>
                <h1 className="font-serif text-4xl md:text-5xl leading-tight">
                  System Design <span className="italic text-[#ef562a]">Guide</span>
                </h1>
                <p className="mt-4 text-lg text-gray-600 max-w-2xl">
                  Master the art of designing scalable, reliable systems. From fundamentals
                  to real-world system designs used at top tech companies.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>{modules.length} Modules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{totalLessons} Lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>{freeLessons} Free Lessons</span>
                  </div>
                </div>
              </div>

              {/* Quick Start Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-medium text-lg mb-4">Start Learning</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>First {freeLessons} lessons free</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span>Curated top-tier resources</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span>Real system design practice</span>
                  </div>
                </div>
                <button className="w-full bg-[#ffe500] text-black px-6 py-3 rounded-full font-medium hover:bg-[#f5dc00] transition-colors">
                  Start Module 1 →
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  No signup required for free lessons
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Course Content */}
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              {/* Sidebar */}
              <aside className={`${sidebarOpen ? 'w-80' : 'w-12'} flex-shrink-0 transition-all hidden lg:block`}>
                <div className="sticky top-28">
                  <div className="flex items-center justify-between mb-4">
                    {sidebarOpen && <h3 className="font-medium">Course Content</h3>}
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <svg className={`w-5 h-5 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>

                  {sidebarOpen && (
                    <div className="space-y-2">
                      {modules.map((module) => (
                        <div key={module.id} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setActiveModule(activeModule === module.id ? 0 : module.id)}
                            className={`w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                              activeModule === module.id ? 'bg-gray-50' : ''
                            }`}
                          >
                            <div>
                              <span className="text-xs text-gray-500">Module {module.id}</span>
                              <h4 className="font-medium text-sm">{module.title}</h4>
                            </div>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                activeModule === module.id ? 'rotate-180' : ''
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
                                <button
                                  key={lesson.id}
                                  onClick={() => setActiveLesson(lesson.id)}
                                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-sm ${
                                    activeLesson === lesson.id ? 'bg-[#ffe500]/20' : ''
                                  }`}
                                >
                                  {lesson.free ? (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                                      {activeLesson === lesson.id && (
                                        <div className="w-2 h-2 rounded-full bg-[#ef562a]"></div>
                                      )}
                                    </div>
                                  ) : (
                                    <svg className="w-6 h-6 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className={`truncate ${activeLesson === lesson.id ? 'text-[#ef562a] font-medium' : ''}`}>
                                      {lesson.title}
                                    </p>
                                    <p className="text-xs text-gray-400">{lesson.duration}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Lesson Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span>Module 1: Foundations</span>
                    <span>•</span>
                    <span>Lesson 1 of 4</span>
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl">{sampleLessonContent.title}</h2>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      10 min read
                    </span>
                    <span className="flex items-center gap-1.5 text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Free
                    </span>
                  </div>
                </div>

                {/* Lesson Content */}
                <article className="prose prose-lg max-w-none">
                  <p className="text-xl text-gray-600 leading-relaxed">
                    {sampleLessonContent.intro}
                  </p>

                  {sampleLessonContent.sections.map((section, index) => (
                    <div key={index} className="mt-10">
                      <h3 className="font-serif text-2xl mb-4">{section.heading}</h3>
                      <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                        {section.content}
                      </div>
                    </div>
                  ))}
                </article>

                {/* Curated Resources */}
                <div className="mt-12 p-6 md:p-8 bg-gray-50 rounded-2xl">
                  <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Curated Resources
                  </h3>
                  <div className="space-y-4">
                    {sampleLessonContent.resources.map((resource, index) => (
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

                {/* Key Takeaways */}
                <div className="mt-8 p-6 md:p-8 bg-[#ffe500]/10 border border-[#ffe500]/30 rounded-2xl">
                  <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-[#ef562a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Key Takeaways
                  </h3>
                  <ul className="space-y-3">
                    {sampleLessonContent.keyTakeaways.map((takeaway, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Navigation */}
                <div className="mt-12 flex items-center justify-between pt-8 border-t border-gray-100">
                  <div></div>
                  <button className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors">
                    Next: Why System Design Matters
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Email Gate Preview (for locked content) */}
        <section className="bg-gray-50 py-16 md:py-24 border-t border-gray-100">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ffe500] flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              Unlock the Full Guide
            </h2>
            <p className="text-gray-600 mb-8">
              Get access to all {totalLessons} lessons, including real system design workshops
              and interview prep materials. Just enter your email to continue.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 border border-gray-300 rounded-full focus:outline-none focus:border-[#ef562a]"
              />
              <button
                type="submit"
                className="bg-[#ef562a] text-white px-8 py-4 rounded-full font-medium hover:bg-[#d94d25] transition-colors"
              >
                Get Access
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-4">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
