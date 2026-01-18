import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MicroWinsWall from "./MicroWinsWall";

export const metadata = {
  title: "Micro-Wins Wall | The Black Female Engineer",
  description:
    "Share and celebrate small wins with our community. What clicked for you this week?",
};

export default function MicroWinsPage() {
  return (
    <>
      <Navigation />
      <main className="pt-32 md:pt-40 bg-[var(--background)] text-[var(--foreground)]">
        <MicroWinsWall />
      </main>
      <Footer />
    </>
  );
}
