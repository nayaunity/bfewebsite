import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import AIMoneyQuiz from "./AIMoneyQuiz";
import PageViewTracker from "./PageViewTracker";

export const metadata = {
  title: "Which AI Money Stack Fits You? | The Black Female Engineer",
  description:
    "Take this 60-second quiz to find out which AI tools and business model match your skills, style, and income goals. No tech knowledge required.",
  openGraph: {
    title: "Which AI Money Stack Fits You?",
    description:
      "Take this 60-second quiz to find out which AI tools and business model match your skills, style, and income goals.",
    url: "/resources/ai-money-quiz",
    type: "website",
    images: [{ url: "/images/bfeimage2.png", alt: "The Black Female Engineer" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Which AI Money Stack Fits You?",
    description:
      "Take this 60-second quiz to find out which AI tools and business model match your skills, style, and income goals.",
    images: ["/images/bfeimage2.png"],
  },
};

export default function AIMoneyQuizPage() {
  return (
    <>
      <PagePresenceTracker page="ai-money-quiz" />
      <PageViewTracker />
      <Navigation />
      <main className="pt-32 md:pt-40 pb-16 md:pb-24 bg-[var(--background)] text-[var(--foreground)]">
        <section className="mb-12 md:mb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight">
                Find your <span className="italic text-[#ef562a]">AI money stack</span>
              </h1>
              <p className="mt-4 text-lg text-[var(--gray-600)]">
                6 ways to use AI to make up to $5,000+/month. No tech knowledge required. Take the quiz to find which one fits you best.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AIMoneyQuiz />
        </section>
      </main>
      <Footer />
    </>
  );
}
