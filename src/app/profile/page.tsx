import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ResumeUpload } from "@/components/ResumeUpload";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      emailVerified: true,
      role: true,
      resumeUrl: true,
      resumeName: true,
      resumeUpdatedAt: true,
      _count: {
        select: {
          progress: true,
          microWins: true,
        },
      },
    },
  });

  return user;
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/profile");
  }

  const user = await getUserData(session.user.id);

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--gray-600)] hover:text-[var(--foreground)] transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)]">
            Your Profile
          </h1>
          <p className="mt-2 text-[var(--gray-600)]">
            Manage your account information
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
          {/* User Avatar & Email Section */}
          <div className="px-6 py-6 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center text-2xl font-medium">
                {user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-lg font-medium text-[var(--foreground)]">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-sm text-green-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-[var(--gray-600)]">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Pending verification
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="px-6 py-4 space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-[var(--gray-600)]">Member since</span>
              <span className="text-[var(--foreground)] font-medium">
                {formatDate(user.createdAt)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-[var(--gray-600)]">Account type</span>
              <span className="text-[var(--foreground)] font-medium capitalize">
                {user.role}
              </span>
            </div>

            {user._count.progress > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-[var(--gray-600)]">Lessons completed</span>
                <span className="text-[var(--foreground)] font-medium">
                  {user._count.progress}
                </span>
              </div>
            )}

            {user._count.microWins > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-[var(--gray-600)]">Wins shared</span>
                <span className="text-[var(--foreground)] font-medium">
                  {user._count.microWins}
                </span>
              </div>
            )}
          </div>

          {/* Resume Upload */}
          <ResumeUpload
            initialResume={{
              url: user.resumeUrl,
              name: user.resumeName,
              updatedAt: user.resumeUpdatedAt,
            }}
          />

          {/* Admin Link */}
          {user.role === "admin" && (
            <div className="px-6 py-4 border-t border-[var(--card-border)]">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--gray-600)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Go to Admin Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
