import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Link from "next/link";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import { ResumeQuiz } from "./ResumeQuiz";

export const dynamic = "force-dynamic";

export default async function ResumeQuizPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/profile/resume-quiz");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true },
  });

  return (
    <>
      <PagePresenceTracker page="resume-quiz" />
      <Navigation />
      <main className="min-h-screen bg-[var(--background)] pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-2">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1 text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ef562a]/10 text-[#ef562a] text-xs font-medium mb-4">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Resume Boost
            </div>
            <h1 className="text-3xl font-serif text-[var(--foreground)] mb-3">
              Help us make your resume{" "}
              <span className="italic text-[#ef562a]">unforgettable</span>
            </h1>
            <p className="text-[var(--gray-600)] max-w-lg mx-auto">
              10 quick questions, ~5 minutes. Your answers give us the numbers
              and stories that turn a good resume into one that lands interviews.
              Ballpark answers are perfect.
            </p>
          </div>

          {/* Quiz */}
          <ResumeQuiz firstName={user?.firstName ?? null} />
        </div>
      </main>
      <Footer />
    </>
  );
}
