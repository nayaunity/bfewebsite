import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import BuildYourTeamQuiz from "./BuildYourTeamQuiz";
import PageViewTracker from "./PageViewTracker";

export const metadata = {
  title: "Build Your Team Quiz | The Black Female Engineer",
  description:
    "I make $60K/month running my life like a startup. Take this 60-second quiz to find out which 'team member' would give you the biggest time ROI right now.",
  openGraph: {
    title: "Build Your Team Quiz",
    description:
      "I make $60K/month running my life like a startup. Find out which 'team member' to hire first.",
    url: "/resources/build-your-team",
    type: "website",
    images: [{ url: "/images/bfeimage2.png", alt: "The Black Female Engineer" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Build Your Team Quiz",
    description:
      "I make $60K/month running my life like a startup. Find out which 'team member' to hire first.",
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
                Build your <span className="italic text-[var(--accent)]">team</span>
              </h1>
              <p className="mt-4 text-lg text-[var(--gray-600)]">
                I run my life like a startup. AI is my junior ops person. Cleaners are my facilities team. DoorDash is my kitchen staff. Find out which role you should hire for first.
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
