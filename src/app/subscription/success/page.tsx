import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import PageViewTracker from "./PageViewTracker";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

async function syncByServer(sessionId: string) {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = host ? `${proto}://${host}` : "";
  try {
    const res = await fetch(
      `${base}/api/stripe/sync-by-session?session_id=${encodeURIComponent(sessionId)}`,
      { cache: "no-store" }
    );
    return (await res.json()) as { synced: boolean; tier?: string; reason?: string };
  } catch {
    return { synced: false, reason: "Network error" };
  }
}

export default async function SubscriptionSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  const result = sessionId ? await syncByServer(sessionId) : { synced: false, reason: "No session id" };
  const tier = result.tier;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navigation />
      <PagePresenceTracker page="subscription-success" />
      <PageViewTracker />

      <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent-blue-bg)] mb-6">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef562a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[var(--foreground)] mb-4">
            You&apos;re <span className="italic text-[#ef562a]">in</span>.
          </h1>

          <p className="text-[var(--gray-600)] text-lg mb-2">
            Payment received. Thanks for upgrading.
          </p>
          {tier ? (
            <p className="text-[var(--gray-600)] mb-8">
              Your account has been activated on the{" "}
              <span className="font-semibold capitalize text-[var(--foreground)]">
                {tier}
              </span>{" "}
              plan.
            </p>
          ) : (
            <p className="text-[var(--gray-600)] mb-8">
              Sign in to start applying. If your plan doesn&apos;t show up right
              away, refresh the dashboard in a minute.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signin?callbackUrl=/profile/applications"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#ef562a] hover:bg-[#d94a22] text-white font-semibold transition-colors"
            >
              Sign in to dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--gray-50)] font-semibold transition-colors"
            >
              Back to home
            </Link>
          </div>

          <p className="text-xs text-[var(--gray-600)] mt-8">
            Questions? Reply to the email we just sent, or write to{" "}
            <a
              href="mailto:theblackfemaleengineer@gmail.com"
              className="underline hover:text-[#ef562a]"
            >
              theblackfemaleengineer@gmail.com
            </a>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
