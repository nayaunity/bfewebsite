import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
import ContentToCompanyPageViewTracker from "./PageViewTracker";
import Deck from "./Deck";

export const metadata: Metadata = {
  title: "Content to Company: Using AI to Build the Next-Gen Media Company | The Black Female Engineer",
  description:
    "Naya's keynote on going from $170K to $700K in one year with the same niche and platforms. The two jobs AI does in her media company, the tools behind each, and how to start today.",
  openGraph: {
    title: "Content to Company: Using AI to Build the Next-Gen Media Company",
    description:
      "A keynote by Naya Bere. From $170K to $700K in a year. Same me, same niche, same platforms. One difference: AI.",
    url: "/talks/content-to-company",
    type: "website",
    images: [{ url: "/images/bfeimage2.png", alt: "The Black Female Engineer" }],
  },
};

export default function ContentToCompanyPage() {
  return (
    <>
      <PagePresenceTracker page="talks-content-to-company" />
      <ContentToCompanyPageViewTracker />
      <Navigation />
      <main className="pt-28 md:pt-36 bg-[var(--gray-100)] text-[var(--foreground)]">
        <Deck />
      </main>
      <Footer />
    </>
  );
}
