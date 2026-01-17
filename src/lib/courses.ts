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
import webDevelopmentCourse from "@/data/courses/web-development.json";
import webDevelopmentLessons from "@/data/courses/web-development-lessons.json";
import claudeCodeCourse from "@/data/courses/claude-code.json";
import claudeCodeLessons from "@/data/courses/claude-code-lessons.json";
import breakIntoTechCourse from "@/data/courses/break-into-tech.json";
import breakIntoTechLessons from "@/data/courses/break-into-tech-lessons.json";
import personalBrandingCourse from "@/data/courses/personal-branding.json";
import personalBrandingLessons from "@/data/courses/personal-branding-lessons.json";
import resumeLinkedInCourse from "@/data/courses/resume-linkedin.json";
import resumeLinkedInLessons from "@/data/courses/resume-linkedin-lessons.json";

// Course data access functions
export function getCourse(courseId: string): Course | null {
  switch (courseId) {
    case "system-design":
      return systemDesignCourse as Course;
    case "web-development":
      return webDevelopmentCourse as Course;
    case "claude-code":
      return claudeCodeCourse as Course;
    case "break-into-tech":
      return breakIntoTechCourse as Course;
    case "personal-branding":
      return personalBrandingCourse as Course;
    case "resume-linkedin":
      return resumeLinkedInCourse as Course;
    default:
      return null;
  }
}

export function getLessonContent(
  courseId: string,
  lessonSlug: string
): LessonContent | null {
  let lessons: Record<string, LessonContent>;

  switch (courseId) {
    case "system-design":
      lessons = systemDesignLessons as Record<string, LessonContent>;
      break;
    case "web-development":
      lessons = webDevelopmentLessons as Record<string, LessonContent>;
      break;
    case "claude-code":
      lessons = claudeCodeLessons as Record<string, LessonContent>;
      break;
    case "break-into-tech":
      lessons = breakIntoTechLessons as Record<string, LessonContent>;
      break;
    case "personal-branding":
      lessons = personalBrandingLessons as Record<string, LessonContent>;
      break;
    case "resume-linkedin":
      lessons = resumeLinkedInLessons as Record<string, LessonContent>;
      break;
    default:
      return null;
  }

  return lessons[lessonSlug] || null;
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
