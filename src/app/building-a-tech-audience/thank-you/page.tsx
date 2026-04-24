import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "You're In | Building a Tech Audience",
  description:
    "Your seat in Building a Tech Audience is reserved. The course opens May 15.",
  robots: { index: false, follow: false },
};

export default function CourseThankYouPage() {
  return (
    <>
      <Navigation />
      <main className="pt-42 md:pt-50 min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <span className="inline-block text-xs font-medium px-4 py-1.5 rounded-full bg-[#ffe500] text-black mb-6 tracking-wide">
            PAYMENT RECEIVED
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
            You&apos;re <span className="italic text-[#ef562a]">in</span>.
          </h1>
          <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-6">
            Your seat in Building a Tech Audience is reserved. A receipt is on
            its way to your inbox right now.
          </p>
          <p className="text-lg text-[var(--gray-600)] leading-relaxed mb-8">
            The course opens on <strong>May 15</strong>. You&apos;ll get access
            instructions, your first module, and (if you picked a coaching
            tier) scheduling details a few days before launch.
          </p>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 mb-8 text-left">
            <h2 className="font-serif text-lg mb-3">What to expect next</h2>
            <ul className="space-y-2 text-sm text-[var(--gray-600)]">
              <li className="flex items-start gap-3">
                <span className="text-[#ef562a] font-bold">1.</span>
                <span>
                  Watch your inbox (and spam folder) for a welcome email from
                  Naya in the next few minutes.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#ef562a] font-bold">2.</span>
                <span>
                  On May 15 you&apos;ll get course access and your first
                  module.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#ef562a] font-bold">3.</span>
                <span>
                  If you picked the Group or 1:1 tier, scheduling details for
                  office hours and coaching arrive the week of launch.
                </span>
              </li>
            </ul>
          </div>
          <p className="text-sm text-[var(--gray-600)] mb-8">
            Questions? Reply to your receipt email or reach out at{" "}
            <a
              href="mailto:theblackfemaleengineer@gmail.com"
              className="text-[#ef562a] hover:underline"
            >
              theblackfemaleengineer@gmail.com
            </a>
            .
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#ffe500] text-black px-6 py-3 rounded-full font-medium hover:bg-[#f5dc00] transition-colors"
          >
            Back to home
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
