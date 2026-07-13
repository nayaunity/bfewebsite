import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import PageViewTracker from "./PageViewTracker";
import SelfIdForm from "./SelfIdForm";
import { SupportEmail } from "@/components/SupportEmail";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ session_id?: string; next?: string }>;
};

/**
 * Mandatory self-identification step. Stripe checkout success_url lands the
 * user here right after their card is captured (both trial and direct-pay
 * Pro flows). The eight fields collected here pre-fill the EEO + work-auth
 * sections on Greenhouse, Lever, Ashby, and Workday applications. Without
 * them the worker decline-defaults everything, which suppresses interviews.
 *
 * Skip case: if the user already has every required field set AND
 * selfIdCompletedAt is non-null, we redirect straight to ?next so returning
 * Pro subscribers aren't forced through a form they've already filled.
 *
 * Gate: /profile and /profile/applications redirect back here whenever a
 * paying user lacks selfIdCompletedAt, so bailing mid-flow doesn't bypass
 * the requirement.
 */
async function syncByServer(sessionId: string) {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = host ? `${proto}://${host}` : "";
  try {
    await fetch(
      `${base}/api/stripe/sync-by-session?session_id=${encodeURIComponent(sessionId)}`,
      { cache: "no-store" }
    );
  } catch {}
}

function safeNext(next: string | undefined, fallback: string): string {
  // Only allow same-origin relative paths to prevent open-redirect.
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export default async function SelfIdentificationPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/onboarding/self-identification");
  }

  const { session_id: stripeSessionId, next } = await searchParams;
  if (stripeSessionId) await syncByServer(stripeSessionId);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      gender: true,
      race: true,
      hispanicOrLatino: true,
      veteranStatus: true,
      disabilityStatus: true,
      pronouns: true,
      workAuthorized: true,
      needsSponsorship: true,
      selfIdCompletedAt: true,
    },
  });

  if (!user) redirect("/profile");

  const nextUrl = safeNext(next, "/profile/applications");

  const allFilled =
    !!user.gender &&
    !!user.race &&
    !!user.hispanicOrLatino &&
    !!user.veteranStatus &&
    !!user.disabilityStatus &&
    !!user.pronouns &&
    user.workAuthorized !== null &&
    user.needsSponsorship !== null;

  if (user.selfIdCompletedAt && allFilled) {
    redirect(nextUrl);
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navigation />
      <PagePresenceTracker page="onboarding-self-identification" />
      <PageViewTracker />

      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold text-[#4d1b27] uppercase tracking-wider mb-2">
            One quick step
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--foreground)]">
            Tell us how to answer the standard application questions
          </h1>
          <p className="text-sm text-[var(--gray-600)] mt-3">
            Most jobs ask these. Filling them out gives you a real shot at the interviews we route you to.
          </p>
        </div>

        <SelfIdForm
          initial={{
            gender: user.gender ?? "",
            race: user.race ?? "",
            hispanicOrLatino: user.hispanicOrLatino ?? "",
            veteranStatus: user.veteranStatus ?? "",
            disabilityStatus: user.disabilityStatus ?? "",
            pronouns: user.pronouns ?? "",
            workAuthorized: user.workAuthorized,
            needsSponsorship: user.needsSponsorship,
          }}
          nextUrl={nextUrl}
        />
        <SupportEmail />
      </main>

      <Footer />
    </div>
  );
}
