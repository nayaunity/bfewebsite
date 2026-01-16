// Course Types
export interface Lesson {
  id: string;
  slug: string;
  title: string;
  duration: string;
  type: "article" | "video" | "workshop";
  free: boolean;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
}

export interface Module {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  tagColor: string;
  stats: {
    modules: number;
    lessons: number;
    freeLessons: number;
  };
  features: string[];
  modules: Module[];
}

export interface Resource {
  title: string;
  source: string;
  url: string;
  type: string;
  description: string;
}

export interface LessonContent {
  title: string;
  intro: string;
  sections: {
    heading: string;
    content: string;
  }[];
  resources: Resource[];
  keyTakeaways: string[];
}

// Import course data
import systemDesignCourse from "@/data/courses/system-design.json";
import systemDesignLessons from "@/data/courses/system-design-lessons.json";

// Course data access functions
export function getCourse(courseId: string): Course | null {
  if (courseId === "system-design") {
    return systemDesignCourse as Course;
  }
  return null;
}

export function getLessonContent(
  courseId: string,
  lessonSlug: string
): LessonContent | null {
  if (courseId === "system-design") {
    const lessons = systemDesignLessons as Record<string, LessonContent>;
    return lessons[lessonSlug] || null;
  }
  return null;
}

export function getLessonBySlug(
  course: Course,
  slug: string
): { lesson: Lesson; module: Module; lessonIndex: number; moduleIndex: number } | null {
  for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
    const module = course.modules[moduleIndex];
    for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
      const lesson = module.lessons[lessonIndex];
      if (lesson.slug === slug) {
        return { lesson, module, lessonIndex, moduleIndex };
      }
    }
  }
  return null;
}

export function getAdjacentLessons(
  course: Course,
  currentSlug: string
): { prev: Lesson | null; next: Lesson | null } {
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.slug === currentSlug);

  return {
    prev: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
    next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null,
  };
}

export function getLessonNumber(course: Course, lessonSlug: string): number {
  let count = 0;
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      count++;
      if (lesson.slug === lessonSlug) {
        return count;
      }
    }
  }
  return 0;
}

export function getTotalLessonsInModule(module: Module): number {
  return module.lessons.length;
}
