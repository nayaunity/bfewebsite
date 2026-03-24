import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PricingCards } from "./PricingCards";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await auth();

  let currentTier = "free";
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true, stripeCustomerId: true },
    });
    currentTier = user?.subscriptionTier || "free";
  }

  return (
    <main className="min-h-screen pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 pb-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl text-[var(--foreground)] mb-4">
            Auto-Apply to <span className="italic text-[#ef562a]">Jobs</span>{" "}
            While You Sleep
          </h1>
          <p className="text-lg text-[var(--gray-600)] max-w-2xl mx-auto">
            Upload your resumes, fill in your profile once, and let our system
            apply to tech jobs at top companies for you. The right resume for
            every role, automatically.
          </p>
        </div>

        <PricingCards
          currentTier={currentTier}
          isSignedIn={!!session?.user}
        />

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl text-[var(--foreground)] text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">
                How does auto-apply work?
              </h3>
              <p className="text-sm text-[var(--gray-600)]">
                You upload your resumes and fill in your profile with your
                details (name, phone, work authorization, etc.). Our system
                browses company career pages, finds relevant jobs, picks the
                right resume for each role, fills out the application form, and
                submits — all automatically.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">
                Which companies do you apply to?
              </h3>
              <p className="text-sm text-[var(--gray-600)]">
                We currently support 20 top tech companies including Anthropic,
                OpenAI, Meta, Google, Apple, Microsoft, Netflix, Stripe, and
                more. New companies are added regularly.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">
                What if a job doesn&apos;t match any of my resumes?
              </h3>
              <p className="text-sm text-[var(--gray-600)]">
                The system skips jobs that don&apos;t match your resume profiles. You
                only apply to roles that fit your background — no wasted
                applications.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">
                Can I cancel anytime?
              </h3>
              <p className="text-sm text-[var(--gray-600)]">
                Yes. You can manage your subscription from your profile page.
                Cancel anytime and you&apos;ll keep access through the end of your
                billing period.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
