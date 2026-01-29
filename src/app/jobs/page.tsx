import { Suspense } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JobsNewsletter from "./JobsNewsletter";
import JobBoard from "./JobBoard";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";

export const metadata = {
  title: "Job Board | The Black Female Engineer",
  description:
    "Find tech jobs and opportunities to accelerate your career in innovative industries.",
};

export default function JobsPage() {
  return (
    <>
      <PagePresenceTracker page="jobs" />
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        <Suspense fallback={<JobBoardSkeleton />}>
          <JobBoard />
        </Suspense>
        <JobsNewsletter />
      </main>
      <Footer />
    </>
  );
}

function JobBoardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)]">
            <div className="h-4 bg-[var(--gray-200)] rounded w-24 mb-3" />
            <div className="h-6 bg-[var(--gray-200)] rounded w-3/4 mb-3" />
            <div className="h-4 bg-[var(--gray-200)] rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
