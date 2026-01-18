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
        <JobBoard />
        <JobsNewsletter />
      </main>
      <Footer />
    </>
  );
}
