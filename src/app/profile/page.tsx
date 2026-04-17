import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { TrialRequiredBanner } from "@/components/TrialRequiredBanner";
import { TicketWidget } from "@/components/TicketWidget";
import { OnboardingSync } from "@/components/OnboardingSync";
import { StripeSync } from "@/components/StripeSync";
import { Suspense } from "react";
import { TIER_LIMITS } from "@/lib/stripe";
import { canApply } from "@/lib/subscription";

import { ProfileCompletionBar } from "@/components/profile/ProfileCompletionBar";
import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { LocationSection } from "@/components/profile/LocationSection";
import { ProfessionalSection } from "@/components/profile/ProfessionalSection";
import { EducationSection } from "@/components/profile/EducationSection";
import { OnlinePresenceSection } from "@/components/profile/OnlinePresenceSection";
import { RolesAndResumesSection } from "@/components/profile/RolesAndResumesSection";
import { JobPreferencesSection } from "@/components/profile/JobPreferencesSection";
import { DemographicsSection } from "@/components/profile/DemographicsSection";
import { ApplicationAnswersSection } from "@/components/profile/ApplicationAnswersSection";
import { AutoApplySettingsSection } from "@/components/profile/AutoApplySettingsSection";
import { AccountSection } from "@/components/profile/AccountSection";

export const dynamic = "force-dynamic";

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      emailVerified: true,
      onboardingCompletedAt: true,
      role: true,
      firstName: true,
      lastName: true,
      phone: true,
      preferredName: true,
      pronouns: true,
      autoApplyEnabled: true,
      usState: true,
      workAuthorized: true,
      needsSponsorship: true,
      countryOfResidence: true,
      willingToRelocate: true,
      remotePreference: true,
      linkedinUrl: true,
      githubUrl: true,
      websiteUrl: true,
      currentEmployer: true,
      currentTitle: true,
      school: true,
      degree: true,
      graduationYear: true,
      additionalCerts: true,
      city: true,
      workLocations: true,
      yearsOfExperience: true,
      targetRole: true,
      salaryExpectation: true,
      earliestStartDate: true,
      gender: true,
      race: true,
      hispanicOrLatino: true,
      veteranStatus: true,
      disabilityStatus: true,
      applicationAnswers: true,
      onboardingData: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
      freeTierEndsAt: true,
      resumeUrl: true,
      resumeName: true,
      resumeUpdatedAt: true,
      resumes: {
        orderBy: { uploadedAt: "desc" as const },
        select: {
          id: true,
          name: true,
          fileName: true,
          blobUrl: true,
          keywords: true,
          isFallback: true,
          uploadedAt: true,
        },
      },
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

const EXP_MAP: Record<string, string> = {
  "Internship": "0",
  "Entry Level & Graduate": "1",
  "Junior (1-2 years)": "2",
  "Mid Level (3-5 years)": "4",
  "Senior (6-9 years)": "7",
  "Expert & Leadership (10+ years)": "10",
};

async function backfillFromOnboarding(user: NonNullable<Awaited<ReturnType<typeof getUserData>>>) {
  if (!user.onboardingData) return;

  try {
    const data = JSON.parse(user.onboardingData);
    const updates: Record<string, unknown> = {};

    // Only backfill fields that are currently empty
    if (!user.targetRole && data.roles?.length > 0) {
      updates.targetRole = JSON.stringify(data.roles);
    }
    if (!user.yearsOfExperience && data.experience?.length > 0) {
      updates.yearsOfExperience = EXP_MAP[data.experience[0]] || "5";
    }
    // `data.locations` is preferred WORK cities from the wizard — never residence.
    // Write to workLocations; never touch `city` (user sets that on /profile).
    if (data.locations?.length > 0) {
      const workLocs = data.locations.filter((l: string) => l !== "Remote US");
      if (workLocs.length > 0 && !user.workLocations) {
        updates.workLocations = JSON.stringify(workLocs);
      }
      if (!user.remotePreference) {
        const hasRemote = data.locations.includes("Remote US");
        const hasPhysical = workLocs.length > 0;
        if (hasRemote && hasPhysical) updates.remotePreference = "Remote or Hybrid";
        else if (hasRemote) updates.remotePreference = "Remote";
      }
    }
    if (!user.salaryExpectation && data.minSalary && data.minSalary > 0) {
      updates.salaryExpectation = `$${Number(data.minSalary).toLocaleString()}+`;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
      // Merge updates into the user object so the page reflects them immediately
      Object.assign(user, updates);
    }
  } catch { /* ignore parse errors */ }
}

function countFilledFields(user: NonNullable<Awaited<ReturnType<typeof getUserData>>>): { filled: number; total: number } {
  const coreFields = [
    user.firstName, user.lastName, user.phone,
    user.city, user.usState, user.countryOfResidence,
    user.workAuthorized !== null ? "set" : null,
    user.needsSponsorship !== null ? "set" : null,
    user.currentEmployer, user.currentTitle, user.yearsOfExperience,
    user.targetRole,
    user.resumeUrl || user.resumes.length > 0 ? "has resume" : null,
    user.school, user.degree,
    user.linkedinUrl,
    user.salaryExpectation, user.earliestStartDate,
    user.gender, user.race, user.hispanicOrLatino, user.veteranStatus, user.disabilityStatus,
  ];

  let answerCount = 0;
  const answerTotal = 14;
  if (user.applicationAnswers) {
    try {
      const parsed = JSON.parse(user.applicationAnswers);
      answerCount = Object.values(parsed).filter((v) => typeof v === "string" && (v as string).trim()).length;
    } catch { /* ignore */ }
  }

  const total = coreFields.length + answerTotal;
  const filled = coreFields.filter(Boolean).length + answerCount;
  return { filled, total };
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();

  if (!session?.user) {
    const sp = (await searchParams) ?? {};
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string") qs.set(k, v);
    }
    const callbackUrl = qs.toString()
      ? `/profile?${qs.toString()}`
      : "/profile";
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const user = await getUserData(session.user.id);

  if (!user) {
    redirect("/auth/signin");
  }

  // New users who haven't completed onboarding → send to wizard
  if (!user.onboardingCompletedAt) {
    redirect("/auto-apply/get-started");
  }

  // Backfill any missing profile fields from onboarding data
  await backfillFromOnboarding(user);

  const tier = user.subscriptionTier || "free";
  const tierLimits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const rawUsage = await canApply(session.user.id);
  const usage = {
    used: Number(rawUsage.used) || 0,
    limit: Number(rawUsage.limit) || 5,
  };

  const completion = countFilledFields(user);

  return (
    <>
      <Suspense><OnboardingSync /></Suspense>
      <Suspense><StripeSync /></Suspense>
      <Navigation />
      <main className="min-h-screen bg-[var(--background)] pt-[88px] md:pt-[120px] pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {user.subscriptionTier === "free" && user.freeTierEndsAt && (
            <TrialRequiredBanner freeTierEndsAt={user.freeTierEndsAt.toISOString()} />
          )}
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
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center text-2xl font-medium flex-shrink-0">
              {user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-3xl md:text-4xl text-[var(--foreground)]">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : "Your Profile"}
                </h1>
                <SubscriptionBadge tier={tier} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[var(--gray-600)] text-sm truncate">
                  {user.email}
                </p>
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--gray-600)] flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Completion bar */}
          <div className="mb-6">
            <ProfileCompletionBar filled={completion.filled} total={completion.total} />
          </div>

          {/* Applications CTA */}
          <Link
            href="/profile/applications"
            className="flex items-center justify-between w-full mb-8 px-6 py-4 bg-gradient-to-r from-[#ef562a] to-[#d44a22] text-white rounded-2xl hover:opacity-95 transition-opacity"
          >
            <div>
              <span className="text-lg font-serif">Start Applying to Jobs</span>
              <p className="text-sm text-white/80 mt-0.5">Select companies, choose a role, and let BFE apply for you</p>
            </div>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          {/* Sections */}
          <div className="space-y-4">
            <PersonalInfoSection
              initialData={{
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                preferredName: user.preferredName,
                pronouns: user.pronouns,
              }}
            />

            <LocationSection
              initialData={{
                city: user.city,
                usState: user.usState,
                countryOfResidence: user.countryOfResidence,
                workAuthorized: user.workAuthorized,
                needsSponsorship: user.needsSponsorship,
                willingToRelocate: user.willingToRelocate,
                remotePreference: user.remotePreference,
              }}
            />

            <ProfessionalSection
              initialData={{
                currentEmployer: user.currentEmployer,
                currentTitle: user.currentTitle,
                yearsOfExperience: user.yearsOfExperience,
              }}
            />

            <RolesAndResumesSection
              initialRoles={(() => {
                if (!user.targetRole) return [];
                try {
                  const parsed = JSON.parse(user.targetRole);
                  if (Array.isArray(parsed)) return parsed;
                } catch { /* not JSON */ }
                return user.targetRole.trim() ? [user.targetRole.trim()] : [];
              })()}
              resumes={user.resumes.map((r) => ({
                ...r,
                keywords: r.keywords || "",
                uploadedAt: r.uploadedAt.toISOString(),
              }))}
              maxResumes={tierLimits.maxResumes}
              tier={tier}
            />

            <EducationSection
              initialData={{
                school: user.school,
                degree: user.degree,
                graduationYear: user.graduationYear,
                additionalCerts: user.additionalCerts,
              }}
            />

            <OnlinePresenceSection
              initialData={{
                linkedinUrl: user.linkedinUrl,
                githubUrl: user.githubUrl,
                websiteUrl: user.websiteUrl,
              }}
            />

            <JobPreferencesSection
              initialData={{
                salaryExpectation: user.salaryExpectation,
                earliestStartDate: user.earliestStartDate,
              }}
            />

            <DemographicsSection
              initialData={{
                gender: user.gender,
                race: user.race,
                hispanicOrLatino: user.hispanicOrLatino,
                veteranStatus: user.veteranStatus,
                disabilityStatus: user.disabilityStatus,
              }}
            />

            <ApplicationAnswersSection
              initialData={{
                applicationAnswers: user.applicationAnswers,
              }}
            />

            <AutoApplySettingsSection
              initialData={{
                autoApplyEnabled: user.autoApplyEnabled,
                hasResume: !!user.resumeUrl,
              }}
              usage={usage}
            />

            <AccountSection
              user={{
                createdAt: user.createdAt.toISOString(),
                role: user.role,
                emailVerified: !!user.emailVerified,
                stripeCustomerId: user.stripeCustomerId,
                lessonsCompleted: user._count.progress,
                winsShared: user._count.microWins,
              }}
              tier={tier}
            />
          </div>
        </div>
        <TicketWidget page="profile" />
      </main>
      <Footer />
    </>
  );
}
