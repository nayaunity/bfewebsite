import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import PageViewTracker from "./PageViewTracker";
import ReviewForm from "./ReviewForm";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

/**
 * Post-trial-checkout review screen. The user's card is on file, status is
 * trialing, and we want them to verify the resume-extracted fields before
 * the worker starts auto-applying with potentially wrong data.
 *
 * Required-first-time gating: the page renders for everyone, but the form's
 * Continue button is the ONLY way out on first visit. Once
 * detailsReviewedAt is set (via /api/profile/review), the page becomes a
 * normal editor and shows a Skip link too.
 *
 * Flow into this page:
 *   1. Stripe checkout success_url returns here with ?session_id=cs_...
 *   2. We sync the subscription via /api/stripe/sync-by-session so
 *      subscriptionStatus reflects 'trialing' immediately (the webhook may
 *      arrive seconds later).
 *   3. Pull the User row's extracted fields and render.
 */
async function syncByServer(sessionId: string) {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = host ? `${proto}://${host}` : "";
  try {
    await fetch(`${base}/api/stripe/sync-by-session?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
  } catch {}
}

export default async function OnboardingReviewPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/onboarding/review");
  }

  const { session_id: stripeSessionId } = await searchParams;
  if (stripeSessionId) await syncByServer(stripeSessionId);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      linkedinUrl: true,
      currentTitle: true,
      currentEmployer: true,
      yearsOfExperience: true,
      school: true,
      degree: true,
      detailsReviewedAt: true,
    },
  });

  if (!user) redirect("/profile");

  const firstTime = !user.detailsReviewedAt;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navigation />
      <PagePresenceTracker page="onboarding-review" />
      <PageViewTracker />

      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold text-[#ef562a] uppercase tracking-wider mb-2">
            One more thing
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--foreground)]">
            Quick check on what we pulled from your resume
          </h1>
          <p className="text-sm text-[var(--gray-600)] mt-3">
            We use these to fill applications on your behalf. Take a second to
            fix anything that&apos;s off.
          </p>
        </div>

        <ReviewForm
          initial={{
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            phone: user.phone ?? "",
            linkedinUrl: user.linkedinUrl ?? "",
            currentTitle: user.currentTitle ?? "",
            currentEmployer: user.currentEmployer ?? "",
            yearsOfExperience: user.yearsOfExperience ?? "",
            school: user.school ?? "",
            degree: user.degree ?? "",
          }}
          firstTime={firstTime}
        />
      </main>

      <Footer />
    </div>
  );
}
