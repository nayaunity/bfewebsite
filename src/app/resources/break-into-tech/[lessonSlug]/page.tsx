import { notFound } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  getCourse,
  getLessonContent,
  getLessonBySlug,
  getAdjacentLessons,
  getLessonNumber,
} from "@/lib/courses";
import LessonSidebar from "../_components/LessonSidebar";
import LessonContent from "../_components/LessonContent";

interface PageProps {
  params: Promise<{ lessonSlug: string }>;
}

export async function generateStaticParams() {
  const course = getCourse("break-into-tech");
  if (!course) return [];

  return course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      lessonSlug: lesson.slug,
    }))
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { lessonSlug } = await params;
  const course = getCourse("break-into-tech");
  if (!course) return {};

  const lessonInfo = getLessonBySlug(course, lessonSlug);
  if (!lessonInfo) return {};

  return {
    title: `${lessonInfo.lesson.title} | Break Into Tech | The Black Female Engineer`,
    description: `Learn about ${lessonInfo.lesson.title} in our comprehensive guide to breaking into software engineering.`,
  };
}

export default async function LessonPage({ params }: PageProps) {
  const { lessonSlug } = await params;
  const course = getCourse("break-into-tech");
  if (!course) notFound();

  const lessonInfo = getLessonBySlug(course, lessonSlug);
  if (!lessonInfo) notFound();

  const { lesson, module } = lessonInfo;
  const content = getLessonContent("break-into-tech", lessonSlug);
  const { prev, next } = getAdjacentLessons(course, lessonSlug);
  const lessonNumber = getLessonNumber(course, lessonSlug);

  return (
    <>
      <Navigation />
      <main className="pt-28 md:pt-32">
        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/resources" className="hover:text-[#ef562a]">
                Resources
              </Link>
              <span>/</span>
              <Link href="/resources/break-into-tech" className="hover:text-[#ef562a]">
                Break Into Tech
              </Link>
              <span>/</span>
              <span className="text-gray-900">{lesson.title}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              {/* Sidebar */}
              <LessonSidebar course={course} currentSlug={lessonSlug} />

              {/* Content - Module info header */}
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Module {module.id}: {module.title}</span>
                    <span>&bull;</span>
                    <span>Lesson {lessonNumber} of {course.stats.lessons}</span>
                  </div>
                </div>

                {/* Client component handles locked/unlocked state */}
                <LessonContent
                  lesson={lesson}
                  content={content}
                  course={course}
                  prevLesson={prev}
                  nextLesson={next}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
