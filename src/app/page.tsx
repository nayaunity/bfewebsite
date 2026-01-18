import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Resources from "@/components/Resources";
import Jobs from "@/components/Jobs";
import Community from "@/components/Community";
import Footer from "@/components/Footer";
import { PagePresenceTracker } from "@/components/PagePresenceTracker";

export default function Home() {
  return (
    <>
      <PagePresenceTracker page="home" />
      <Navigation />
      <main>
        <Hero />
        <About />
        <Resources />
        <Jobs />
        <Community />
      </main>
      <Footer />
    </>
  );
}
