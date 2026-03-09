import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PresaleContent from "./PresaleContent";

export const metadata = {
  title: "Build in Public: Grow a Tech Audience from 0 | The Black Female Engineer",
  description: "VIP coaching program to help you build a tech audience from scratch. Limited to 5 founding member seats. Private coaching calls + monthly content audits.",
  openGraph: {
    title: "Build in Public: Grow a Tech Audience from 0 | The Black Female Engineer",
    description: "VIP coaching program to help you build a tech audience from scratch. Limited to 5 founding member seats.",
    url: "/creator-course",
    type: "website",
    images: [{ url: "/images/bfeimage2.png", alt: "The Black Female Engineer" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Build in Public: Grow a Tech Audience from 0",
    description: "VIP coaching program to help you build a tech audience from scratch. Limited to 5 founding member seats.",
    images: ["/images/bfeimage2.png"],
  },
};

export default function CreatorCoursePage() {
  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        <PresaleContent />
      </main>
      <Footer />
    </>
  );
}
