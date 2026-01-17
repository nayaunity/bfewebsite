import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { getCourse } from "@/lib/courses";
import { notFound } from "next/navigation";
import CourseProgress from "./_components/CourseProgress";
import ModuleLessons from "./_components/ModuleLessons";

export const metadata = {
  title: "Salary Negotiation | The Black Female Engineer",
  description:
    "Get paid what you're actually worth. Learn the strategies, scripts, and psychology behind successful salary negotiations—whether you're accepting a new offer or asking for a raise.",
};

export default function SalaryNegotiationPage() {
  const course = getCourse("salary-negotiation");
  if (!course) notFound();

  const firstLesson = course.modules[0]?.lessons[0];

  return (
    <>
      <Navigation />
      <main className="pt-28 md:pt-32">
        {/* Hero */}
        <section className="bg-[var(--background)] py-12 md:py-16 border-b border-[var(--card-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-[var(--gray-600)] mb-4">
              <Link href="/resources" className="hover:text-[#ef562a]">
                Resources
              </Link>
              <span>/</span>
              <span>Salary Negotiation</span>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <span className="inline-block text-xs px-3 py-1 rounded-full font-medium bg-[var(--accent-green-bg)] text-[var(--accent-green-text)] mb-4">
                  {course.tag}
                </span>
                <h1 className="font-serif text-4xl md:text-5xl leading-tight">
                  {course.title.split(" ")[0]}{" "}
                  <span className="italic text-[#ef562a]">
                    {course.title.split(" ").slice(1).join(" ")}
                  </span>
                </h1>
                <p className="mt-4 text-lg text-[var(--gray-600)] max-w-2xl">
                  {course.subtitle}. {course.description}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--gray-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>{course.stats.modules} Modules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--gray-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{course.stats.lessons} Lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span>{course.stats.freeLessons} Unlocked</span>
                  </div>
                </div>
              </div>

              {/* Quick Start Card */}
              <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-6 shadow-sm">
                <h3 className="font-medium text-lg mb-4">Start Learning</h3>
                <div className="space-y-3 mb-6">
                  {course.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? "bg-[var(--accent-green-bg)]" : index === 1 ? "bg-[var(--accent-yellow-bg)]" : "bg-[var(--accent-orange-bg)]"
                      }`}>
                        <svg className={`w-4 h-4 ${
                          index === 0 ? "text-[var(--accent-green-text)]" : index === 1 ? "text-[var(--accent-yellow-text)]" : "text-[var(--accent-orange-text)]"
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                {firstLesson && (
                  <Link
                    href={`/resources/salary-negotiation/${firstLesson.slug}`}
                    className="block w-full bg-[#ffe500] text-black px-6 py-3 rounded-full font-medium hover:bg-[#f5dc00] transition-colors text-center"
                  >
                    Start Module 1 &rarr;
                  </Link>
                )}
                <p className="text-xs text-[var(--gray-600)] text-center mt-3">
                  No signup required for unlocked lessons
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
              <CourseSidebar course={course} />

              {/* Main Content - Course Overview */}
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-2xl md:text-3xl mb-8">Course Overview</h2>

                {/* Progress Bar */}
                <CourseProgress course={course} />

                {/* Module Cards */}
                <div className="space-y-6">
                  {course.modules.map((module) => (
                    <div
                      key={module.id}
                      id={`module-${module.id}`}
                      className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 hover:shadow-lg transition-shadow scroll-mt-40"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-xs text-[var(--gray-600)]">Module {module.id}</span>
                          <h3 className="font-serif text-xl mt-1">{module.title}</h3>
                          <p className="text-[var(--gray-600)] text-sm mt-1">{module.description}</p>
                        </div>
                        <span className="text-sm text-[var(--gray-600)]">
                          {module.lessons.length} lessons
                        </span>
                      </div>

                      <ModuleLessons module={module} coursePath="/resources/salary-negotiation" courseId="salary-negotiation" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Email Gate Preview */}
        <section className="bg-[var(--gray-50)] py-16 md:py-24 border-t border-[var(--card-border)]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ffe500] flex items-center justify-center">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              Unlock the Full Guide
            </h2>
            <p className="text-[var(--gray-600)] mb-8">
              Get access to all {course.stats.lessons} lessons, including advanced strategies
              for negotiating your salary. Just enter your email to continue.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 border border-[var(--card-border)] rounded-full focus:outline-none focus:border-[#ef562a]"
              />
              <button
                type="submit"
                className="bg-[#ef562a] text-white px-8 py-4 rounded-full font-medium hover:bg-[#d94d25] transition-colors"
              >
                Get Access
              </button>
            </form>
            <p className="text-xs text-[var(--gray-600)] mt-4">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

// Course sidebar component
function CourseSidebar({ course }: { course: ReturnType<typeof getCourse> }) {
  if (!course) return null;

  return (
    <aside className="w-80 flex-shrink-0 hidden lg:block">
      <div className="sticky top-36">
        <h3 className="font-medium mb-4">Course Content</h3>
        <div className="space-y-2">
          {course.modules.map((module) => (
            <a
              key={module.id}
              href={`#module-${module.id}`}
              className="block border border-[var(--card-border)] rounded-xl overflow-hidden hover:border-[#ffe500] transition-colors"
            >
              <div className="p-4 bg-[var(--gray-50)] hover:bg-[var(--gray-100)] transition-colors">
                <span className="text-xs text-[var(--gray-600)]">Module {module.id}</span>
                <h4 className="font-medium text-sm">{module.title}</h4>
              </div>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
