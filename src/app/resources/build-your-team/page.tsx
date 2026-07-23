import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import BuildYourTeamQuiz from "./BuildYourTeamQuiz";
import PageViewTracker from "./PageViewTracker";

export const metadata = {
  title: "The Founder of Your Life Quiz | The Black Female Engineer",
  description:
    "I make $60K/month running my life like a startup. Take this quiz to find where you're leaking time and what your first 'hire' should be.",
  openGraph: {
    title: "The Founder of Your Life Quiz",
    description:
      "Find where you're leaking time and what your first 'hire' should be to buy it back.",
    url: "/resources/build-your-team",
    type: "website",
    images: [{ url: "/images/bfeimage2.png", alt: "The Black Female Engineer" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "The Founder of Your Life Quiz",
    description:
      "Find where you're leaking time and what your first 'hire' should be to buy it back.",
    images: ["/images/bfeimage2.png"],
  },
};

export default function BuildYourTeamPage() {
  return (
    <>
      <PagePresenceTracker page="build-your-team" />
      <PageViewTracker />
      <Navigation />
      <main className="pt-32 md:pt-40 pb-16 md:pb-24 bg-[var(--background)] text-[var(--foreground)]">
        <section className="mb-12 md:mb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight">
                The Founder of Your Life{" "}
                <span className="italic text-[var(--accent)]">Quiz</span>
              </h1>
              <p className="mt-4 text-lg text-[var(--gray-600)]">
                I make $60K/month running my life like a startup. Find out where
                you're leaking time and what your first "hire" should be.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BuildYourTeamQuiz />
        </section>
      </main>
      <Footer />
    </>
  );
}
