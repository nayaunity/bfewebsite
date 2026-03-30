import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import PageViewTracker from "./PageViewTracker";
import WaitlistForm from "./WaitlistForm";

export const metadata = {
  title: "Auto Apply Beta | The Black Female Engineer",
  description:
    "Apply to hundreds of jobs with one profile. Join the Auto Apply beta waitlist and be the first to try our AI-powered job application tool.",
  openGraph: {
    title: "Auto Apply Beta | The Black Female Engineer",
    description:
      "Apply to hundreds of jobs with one profile. Join the Auto Apply beta waitlist and be first in line.",
    url: "/auto-apply",
    type: "website",
    images: [
      { url: "/images/bfeimage2.png", alt: "Auto Apply Beta" },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Auto Apply Beta | The Black Female Engineer",
    description:
      "Apply to hundreds of jobs with one profile. Join the Auto Apply beta waitlist and be first in line.",
    images: ["/images/bfeimage2.png"],
  },
};

const features = [
  {
    title: "One Profile, Many Applications",
    description:
      "Fill out your info once. We handle submitting it to every job that matches.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    title: "AI-Powered Matching",
    description:
      "Our system finds roles that fit your skills and experience so you don't waste time on bad fits.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: "Track Every Application",
    description:
      "See exactly where you applied, what stage you're at, and what's coming next.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Early Beta Access",
    description:
      "Waitlist members get first access before we open to everyone. Limited spots available.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export default function AutoApplyPage() {
  return (
    <>
      <PagePresenceTracker page="auto-apply" />
      <PageViewTracker />
      <Navigation />

      <main className="min-h-screen bg-[var(--background)]">
        {/* Hero */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-[#ef562a]/10 text-[#ef562a] text-sm font-semibold rounded-full mb-6">
              COMING SOON
            </span>
            <h1 className="font-serif text-4xl md:text-6xl text-[var(--foreground)] leading-tight">
              Stop Applying One by One.{" "}
              <span className="italic text-[#ef562a]">Let Us Handle It.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-[var(--gray-600)] max-w-2xl mx-auto leading-relaxed">
              Auto Apply takes your profile and automatically submits applications
              to jobs that match your skills. You focus on prepping for interviews,
              and we handle the rest.
            </p>
          </div>
        </section>

        {/* Waitlist Form */}
        <section className="pb-16 px-6">
          <WaitlistForm />
          <p className="text-center text-sm text-[var(--gray-600)] mt-4">
            Join the beta waitlist. No spam, just early access.
          </p>
        </section>

        {/* How It Works */}
        <section className="py-16 px-6 bg-[var(--gray-50)]">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl md:text-3xl text-[var(--foreground)] text-center mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#ef562a]/10 text-[#ef562a] flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg text-[var(--foreground)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--gray-600)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-2xl md:text-3xl text-[var(--foreground)] mb-4">
              Ready to Apply Smarter?
            </h2>
            <p className="text-[var(--gray-600)] mb-8">
              Drop your email and be the first to know when Auto Apply launches.
            </p>
            <WaitlistForm />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
